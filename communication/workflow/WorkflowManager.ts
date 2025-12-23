/**
 * Workflow Manager
 * Coordinates workflow operations and provides high-level workflow APIs
 */

import { WorkflowEngine, WorkflowResult } from './WorkflowEngine';
import { WorkflowChain, WorkflowStep, RetryPolicy } from '../core/types';
import { CommunicationHub } from '../core/CommunicationHub';
import { Logger } from '../utils/Logger';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  defaultRetryPolicy?: RetryPolicy;
}

export interface WorkflowExecutionOptions {
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
  onProgress?: (progress: { completed: number; total: number; currentStep: string }) => void;
  onError?: (error: any) => void;
}

export class WorkflowManager {
  private logger: Logger;
  private engine: WorkflowEngine;
  private hub: CommunicationHub;
  private templates: Map<string, WorkflowTemplate> = new Map();
  private activeExecutions: Map<string, WorkflowExecutionOptions> = new Map();

  constructor(hub: CommunicationHub) {
    this.hub = hub;
    this.engine = new WorkflowEngine(hub);
    this.logger = new Logger('WorkflowManager');
  }

  /**
   * Register a workflow template
   */
  registerTemplate(template: WorkflowTemplate): void {
    // Apply default retry policy if specified
    if (template.defaultRetryPolicy) {
      const defaultPolicy = template.defaultRetryPolicy;
      template.steps.forEach(step => {
        if (!step.retryPolicy) {
          step.retryPolicy = {
            maxRetries: defaultPolicy.maxRetries ?? 0,
            backoffMultiplier: defaultPolicy.backoffMultiplier ?? 2,
            initialDelay: defaultPolicy.initialDelay ?? 1000,
            maxDelay: defaultPolicy.maxDelay ?? 30000
          };
        }
      });
    }

    this.templates.set(template.id, template);
    this.logger.info(`Registered workflow template: ${template.id}`, { name: template.name });
  }

  /**
   * Execute a workflow from template
   */
  async executeFromTemplate(
    templateId: string,
    overrides: {
      stepParams?: Record<string, any>;
      executionOptions?: WorkflowExecutionOptions;
    } = {}
  ): Promise<WorkflowResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    // Clone and customize steps
    const steps = template.steps.map(step => ({
      ...step,
      params: overrides.stepParams?.[step.id] ? {
        ...step.params,
        ...overrides.stepParams[step.id]
      } : step.params
    }));

    // Create workflow
    const workflowId = await this.engine.createWorkflow({
      name: template.name,
      steps
    });

    // Execute with options
    return this.executeWorkflow(workflowId, overrides.executionOptions);
  }

  /**
   * Execute a custom workflow
   */
  async executeWorkflow(
    workflowId: string,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowResult> {
    // Store execution options
    this.activeExecutions.set(workflowId, options);

    try {
      // Set up progress monitoring
      if (options.onProgress) {
        this.setupProgressMonitoring(workflowId, options.onProgress);
      }

      // Execute workflow
      const result = await this.engine.executeWorkflow(workflowId);

      // Clean up
      this.activeExecutions.delete(workflowId);

      return result;

    } catch (error) {
      // Clean up
      this.activeExecutions.delete(workflowId);

      // Call error callback if provided
      if (options.onError) {
        options.onError(error);
      }

      throw error;
    }
  }

  /**
   * Create and execute a workflow in one step
   */
  async createAndExecuteWorkflow(
    name: string,
    steps: WorkflowStep[],
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowResult> {
    const workflowId = await this.engine.createWorkflow({ name, steps });
    return this.executeWorkflow(workflowId, options);
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    await this.engine.cancelWorkflow(workflowId);
    this.activeExecutions.delete(workflowId);
    this.logger.info(`Cancelled workflow: ${workflowId}`);
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): WorkflowChain | null {
    return this.engine.getWorkflowStatus(workflowId);
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): WorkflowChain[] {
    return this.engine.getActiveWorkflows();
  }

  /**
   * Get available templates
   */
  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Remove template
   */
  removeTemplate(templateId: string): boolean {
    const removed = this.templates.delete(templateId);
    if (removed) {
      this.logger.info(`Removed workflow template: ${templateId}`);
    }
    return removed;
  }

  /**
   * Create a simple linear workflow
   */
  createLinearWorkflow(
    name: string,
    stepConfigs: Array<{
      panelId: string;
      action: string;
      params?: any;
      timeout?: number;
    }>
  ): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    stepConfigs.forEach((config, index) => {
      const step: WorkflowStep = {
        id: `step_${index + 1}`,
        panelId: config.panelId,
        action: config.action,
        params: config.params || {},
        dependencies: index > 0 ? [`step_${index}`] : [],
        timeout: config.timeout || 30000,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 2,
          initialDelay: 1000,
          maxDelay: 10000
        }
      };
      steps.push(step);
    });

    return steps;
  }

  /**
   * Create a parallel workflow
   */
  createParallelWorkflow(
    name: string,
    parallelSteps: Array<{
      panelId: string;
      action: string;
      params?: any;
      timeout?: number;
    }>,
    finalStep?: {
      panelId: string;
      action: string;
      params?: any;
    }
  ): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    // Add parallel steps
    parallelSteps.forEach((config, index) => {
      const step: WorkflowStep = {
        id: `parallel_${index + 1}`,
        panelId: config.panelId,
        action: config.action,
        params: config.params || {},
        dependencies: [], // No dependencies for parallel execution
        timeout: config.timeout || 30000,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 2,
          initialDelay: 1000,
          maxDelay: 10000
        }
      };
      steps.push(step);
    });

    // Add final step that depends on all parallel steps
    if (finalStep) {
      const finalWorkflowStep: WorkflowStep = {
        id: 'final_step',
        panelId: finalStep.panelId,
        action: finalStep.action,
        params: finalStep.params || {},
        dependencies: parallelSteps.map((_, index) => `parallel_${index + 1}`),
        timeout: 30000,
        retryPolicy: {
          maxRetries: 1,
          backoffMultiplier: 1.5,
          initialDelay: 2000,
          maxDelay: 15000
        }
      };
      steps.push(finalWorkflowStep);
    }

    return steps;
  }

  /**
   * Setup progress monitoring for a workflow
   */
  private setupProgressMonitoring(
    workflowId: string,
    onProgress: (progress: { completed: number; total: number; currentStep: string }) => void
  ): void {
    // This would integrate with the workflow engine's progress events
    // For now, we'll poll the status
    const monitor = () => {
      const workflow = this.engine.getWorkflowStatus(workflowId);
      if (workflow) {
        const currentStep = workflow.steps[workflow.currentStep];
        onProgress({
          completed: workflow.currentStep,
          total: workflow.steps.length,
          currentStep: currentStep?.id || 'unknown'
        });

        if (workflow.status === 'running') {
          setTimeout(monitor, 1000); // Check every second
        }
      }
    };

    setTimeout(monitor, 1000);
  }

  /**
   * Validate workflow steps
   */
  validateWorkflow(steps: WorkflowStep[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!steps || steps.length === 0) {
      errors.push('Workflow must have at least one step');
      return { valid: false, errors };
    }

    // Check for duplicate step IDs
    const stepIds = new Set<string>();
    steps.forEach(step => {
      if (stepIds.has(step.id)) {
        errors.push(`Duplicate step ID: ${step.id}`);
      }
      stepIds.add(step.id);
    });

    // Check dependencies
    steps.forEach(step => {
      step.dependencies.forEach(depId => {
        if (!stepIds.has(depId)) {
          errors.push(`Step ${step.id} depends on unknown step: ${depId}`);
        }
      });
    });

    // Check for circular dependencies (simplified)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCircularDependency = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const depId of step.dependencies) {
          if (hasCircularDependency(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (hasCircularDependency(step.id)) {
        errors.push(`Circular dependency detected involving step: ${step.id}`);
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get workflow statistics
   */
  getStats(): any {
    return {
      ...this.engine.getStats(),
      registeredTemplates: this.templates.size,
      activeExecutions: this.activeExecutions.size
    };
  }

  /**
   * Clean up completed workflows
   */
  cleanup(maxAge: number = 3600000): void {
    this.engine.cleanupCompletedWorkflows(maxAge);
    this.logger.info('Workflow cleanup completed');
  }
}