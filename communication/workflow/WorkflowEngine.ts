/**
 * Workflow Engine
 * Manages execution of chained operations across multiple panels
 */

import {
  WorkflowChain,
  WorkflowStep,
  WorkflowError,
  RetryPolicy,
  UnifiedMessage,
  MessageType,
  MessageChannel
} from '../core/types';
import { CommunicationHub } from '../core/CommunicationHub';
import { Logger } from '../utils/Logger';

export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  results: Map<string, any>;
  errors: WorkflowError[];
  executionTime: number;
  completedSteps: number;
  totalSteps: number;
}

export interface StepExecutionContext {
  step: WorkflowStep;
  workflowId: string;
  previousResults: Map<string, any>;
  attempt: number;
}

export class WorkflowEngine {
  private logger: Logger;
  private hub: CommunicationHub;
  private activeWorkflows: Map<string, WorkflowChain> = new Map();
  private stepTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(hub: CommunicationHub) {
    this.hub = hub;
    this.logger = new Logger('WorkflowEngine');
    this.setupMessageHandlers();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowData: {
    name: string;
    steps: WorkflowStep[];
  }): Promise<string> {
    const workflowId = this.generateWorkflowId();

    const workflow: WorkflowChain = {
      id: workflowId,
      name: workflowData.name,
      steps: workflowData.steps,
      currentStep: 0,
      status: 'pending',
      results: new Map(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.activeWorkflows.set(workflowId, workflow);
    this.logger.info(`Created workflow: ${workflowId}`, { name: workflowData.name, steps: workflowData.steps.length });

    return workflowId;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string): Promise<WorkflowResult> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const startTime = Date.now();
    workflow.status = 'running';
    workflow.updatedAt = Date.now();

    this.logger.info(`Starting workflow execution: ${workflowId}`);

    try {
      // Execute steps sequentially
      for (let i = 0; i < workflow.steps.length; i++) {
        workflow.currentStep = i;
        const step = workflow.steps[i];

        // Check dependencies
        if (!this.checkStepDependencies(step, workflow.results)) {
          throw new WorkflowError(
            step.id,
            `Dependencies not satisfied for step: ${step.id}`,
            Date.now(),
            0,
            false
          );
        }

        // Execute step
        const result = await this.executeStep(step, workflowId, workflow.results);

        // Store result
        workflow.results.set(step.id, result);
        workflow.updatedAt = Date.now();

        // Broadcast progress
        await this.broadcastWorkflowProgress(workflow);

        this.logger.debug(`Completed step ${i + 1}/${workflow.steps.length}: ${step.id}`);
      }

      // Mark as completed
      workflow.status = 'completed';
      workflow.updatedAt = Date.now();

      await this.broadcastWorkflowCompletion(workflow);

      const executionTime = Date.now() - startTime;
      this.logger.info(`Workflow completed: ${workflowId}`, { executionTime, steps: workflow.steps.length });

      return {
        workflowId,
        success: true,
        results: workflow.results,
        errors: [],
        executionTime,
        completedSteps: workflow.steps.length,
        totalSteps: workflow.steps.length
      };

    } catch (error) {
      // Handle workflow failure
      workflow.status = 'failed';
      workflow.updatedAt = Date.now();

      const workflowError = error instanceof WorkflowError ? error :
        new WorkflowError(
          workflow.steps[workflow.currentStep]?.id || 'unknown',
          error instanceof Error ? error.message : 'Unknown error',
          Date.now(),
          0,
          false
        );

      workflow.error = workflowError;

      await this.broadcastWorkflowError(workflow, workflowError);

      // Attempt rollback if configured
      await this.rollbackWorkflow(workflow);

      const executionTime = Date.now() - startTime;
      this.logger.error(`Workflow failed: ${workflowId}`, workflowError);

      return {
        workflowId,
        success: false,
        results: workflow.results,
        errors: [workflowError],
        executionTime,
        completedSteps: workflow.currentStep,
        totalSteps: workflow.steps.length
      };
    }
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status === 'running') {
      workflow.status = 'cancelled';
      workflow.updatedAt = Date.now();

      // Clear any pending timeouts
      const timeoutKey = `${workflowId}:${workflow.currentStep}`;
      const timeout = this.stepTimeouts.get(timeoutKey);
      if (timeout) {
        clearTimeout(timeout);
        this.stepTimeouts.delete(timeoutKey);
      }

      await this.broadcastWorkflowCancellation(workflow);
      this.logger.info(`Workflow cancelled: ${workflowId}`);
    }
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): WorkflowChain | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): WorkflowChain[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    workflowId: string,
    previousResults: Map<string, any>
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let attempt = 0;
      const maxRetries = step.retryPolicy?.maxRetries || 0;

      const executeWithRetry = async () => {
        attempt++;

        try {
          // Set timeout
          const timeoutKey = `${workflowId}:${step.id}`;
          const timeout = setTimeout(() => {
            this.stepTimeouts.delete(timeoutKey);
            reject(new WorkflowError(
              step.id,
              `Step timeout after ${step.timeout}ms`,
              Date.now(),
              attempt,
              attempt <= maxRetries
            ));
          }, step.timeout);

          this.stepTimeouts.set(timeoutKey, timeout);

          // Execute the step
          const result = await this.performStepExecution(step, workflowId, previousResults, attempt);

          // Clear timeout
          clearTimeout(timeout);
          this.stepTimeouts.delete(timeoutKey);

          resolve(result);

        } catch (error) {
          // Clear timeout
          const timeoutKey = `${workflowId}:${step.id}`;
          const timeout = this.stepTimeouts.get(timeoutKey);
          if (timeout) {
            clearTimeout(timeout);
            this.stepTimeouts.delete(timeoutKey);
          }

          const workflowError = error instanceof WorkflowError ? error :
            new WorkflowError(
              step.id,
              error instanceof Error ? error.message : 'Step execution failed',
              Date.now(),
              attempt,
              attempt <= maxRetries
            );

          if (attempt <= maxRetries && workflowError.canRetry) {
            // Calculate delay with exponential backoff
            const delay = this.calculateRetryDelay(step.retryPolicy!, attempt);
            this.logger.warn(`Step ${step.id} failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries + 1})`);

            setTimeout(executeWithRetry, delay);
          } else {
            reject(workflowError);
          }
        }
      };

      executeWithRetry();
    });
  }

  /**
   * Perform the actual step execution
   */
  private async performStepExecution(
    step: WorkflowStep,
    workflowId: string,
    previousResults: Map<string, any>,
    attempt: number
  ): Promise<any> {
    // Send message to the target panel
    const message: UnifiedMessage = {
      id: this.generateMessageId(),
      type: MessageType.WORKFLOW_STEP,
      source: 'workflow_engine',
      target: step.panelId,
      channel: MessageChannel.POSTMESSAGE,
      payload: {
        workflowId,
        stepId: step.id,
        action: step.action,
        params: step.params,
        previousResults: Object.fromEntries(previousResults),
        attempt
      },
      timestamp: Date.now()
    };

    // Send and wait for response
    const response = await this.hub.sendMessageWithResponse(message, step.timeout);

    if (response.type === MessageType.WORKFLOW_ERROR) {
      throw new WorkflowError(
        step.id,
        response.payload.error || 'Step execution failed',
        Date.now(),
        attempt,
        false
      );
    }

    return response.payload.result;
  }

  /**
   * Check if step dependencies are satisfied
   */
  private checkStepDependencies(step: WorkflowStep, results: Map<string, any>): boolean {
    for (const dependencyId of step.dependencies) {
      if (!results.has(dependencyId)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(policy: RetryPolicy, attempt: number): number {
    const baseDelay = policy.initialDelay || 1000;
    const multiplier = policy.backoffMultiplier || 2;
    const maxDelay = policy.maxDelay || 30000;

    const delay = baseDelay * Math.pow(multiplier, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Rollback workflow on failure
   */
  private async rollbackWorkflow(workflow: WorkflowChain): Promise<void> {
    this.logger.info(`Rolling back workflow: ${workflow.id}`);

    // Execute rollback actions in reverse order
    for (let i = workflow.currentStep; i >= 0; i--) {
      const step = workflow.steps[i];
      if (step.rollbackAction) {
        try {
          await this.performRollbackStep(step, workflow.id);
          this.logger.debug(`Rollback completed for step: ${step.id}`);
        } catch (error) {
          this.logger.error(`Rollback failed for step: ${step.id}`, error);
          // Continue with other rollbacks
        }
      }
    }
  }

  /**
   * Perform rollback for a single step
   */
  private async performRollbackStep(step: WorkflowStep, workflowId: string): Promise<void> {
    const message: UnifiedMessage = {
      id: this.generateMessageId(),
      type: MessageType.WORKFLOW_STEP,
      source: 'workflow_engine',
      target: step.panelId,
      channel: MessageChannel.POSTMESSAGE,
      payload: {
        workflowId,
        stepId: step.id,
        action: step.rollbackAction,
        isRollback: true
      },
      timestamp: Date.now()
    };

    await this.hub.sendMessage(message);
  }

  /**
   * Broadcast workflow progress
   */
  private async broadcastWorkflowProgress(workflow: WorkflowChain): Promise<void> {
    const message: UnifiedMessage = {
      id: this.generateMessageId(),
      type: MessageType.WORKFLOW_STEP,
      source: 'workflow_engine',
      target: 'broadcast',
      channel: MessageChannel.WEBSOCKET,
      payload: {
        workflowId: workflow.id,
        status: workflow.status,
        currentStep: workflow.currentStep,
        totalSteps: workflow.steps.length,
        progress: ((workflow.currentStep + 1) / workflow.steps.length) * 100
      },
      timestamp: Date.now()
    };

    await this.hub.sendMessage(message);
  }

  /**
   * Broadcast workflow completion
   */
  private async broadcastWorkflowCompletion(workflow: WorkflowChain): Promise<void> {
    const message: UnifiedMessage = {
      id: this.generateMessageId(),
      type: MessageType.WORKFLOW_COMPLETE,
      source: 'workflow_engine',
      target: 'broadcast',
      channel: MessageChannel.WEBSOCKET,
      payload: {
        workflowId: workflow.id,
        success: true,
        results: Object.fromEntries(workflow.results),
        executionTime: Date.now() - workflow.createdAt
      },
      timestamp: Date.now()
    };

    await this.hub.sendMessage(message);
  }

  /**
   * Broadcast workflow error
   */
  private async broadcastWorkflowError(workflow: WorkflowChain, error: WorkflowError): Promise<void> {
    const message: UnifiedMessage = {
      id: this.generateMessageId(),
      type: MessageType.WORKFLOW_ERROR,
      source: 'workflow_engine',
      target: 'broadcast',
      channel: MessageChannel.WEBSOCKET,
      payload: {
        workflowId: workflow.id,
        error: {
          stepId: error.stepId,
          message: error.error,
          timestamp: error.timestamp
        },
        completedSteps: workflow.currentStep,
        totalSteps: workflow.steps.length
      },
      timestamp: Date.now()
    };

    await this.hub.sendMessage(message);
  }

  /**
   * Broadcast workflow cancellation
   */
  private async broadcastWorkflowCancellation(workflow: WorkflowChain): Promise<void> {
    const message: UnifiedMessage = {
      id: this.generateMessageId(),
      type: MessageType.WORKFLOW_CANCEL,
      source: 'workflow_engine',
      target: 'broadcast',
      channel: MessageChannel.WEBSOCKET,
      payload: {
        workflowId: workflow.id,
        cancelledAt: Date.now(),
        completedSteps: workflow.currentStep
      },
      timestamp: Date.now()
    };

    await this.hub.sendMessage(message);
  }

  /**
   * Set up message handlers
   */
  private setupMessageHandlers(): void {
    // Handle workflow responses
    this.hub.onMessage(MessageType.WORKFLOW_STEP, async (message) => {
      // Handle step completion responses
      this.logger.debug('Received workflow step response', { workflowId: message.payload?.workflowId });
    });
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up completed workflows
   */
  cleanupCompletedWorkflows(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    let cleaned = 0;

    for (const [workflowId, workflow] of this.activeWorkflows.entries()) {
      if (workflow.status !== 'running' && (now - workflow.updatedAt) > maxAge) {
        this.activeWorkflows.delete(workflowId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Cleaned up ${cleaned} completed workflows`);
    }
  }

  /**
   * Get workflow statistics
   */
  getStats(): any {
    const workflows = Array.from(this.activeWorkflows.values());
    const running = workflows.filter(w => w.status === 'running').length;
    const completed = workflows.filter(w => w.status === 'completed').length;
    const failed = workflows.filter(w => w.status === 'failed').length;

    return {
      totalWorkflows: workflows.length,
      running,
      completed,
      failed,
      averageSteps: workflows.length > 0 ?
        workflows.reduce((sum, w) => sum + w.steps.length, 0) / workflows.length : 0
    };
  }
}