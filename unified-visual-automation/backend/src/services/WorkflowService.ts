// backend/src/services/WorkflowService.ts
import { AutomationWorkflow, WorkflowNode, WorkflowConnection, NodeType } from '../../../shared/types/automation.types';

export class WorkflowService {
  private workflows: Map<string, AutomationWorkflow> = new Map();

  async createWorkflow(workflowData: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationWorkflow> {
    const workflow: AutomationWorkflow = {
      ...workflowData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async getWorkflow(id: string): Promise<AutomationWorkflow | null> {
    return this.workflows.get(id) || null;
  }

  async updateWorkflow(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null> {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
    };

    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async listWorkflows(): Promise<AutomationWorkflow[]> {
    return Array.from(this.workflows.values());
  }

  async validateWorkflow(workflow: AutomationWorkflow): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for start and end nodes
    const hasStart = workflow.nodes.some(node => node.type === 'start');
    const hasEnd = workflow.nodes.some(node => node.type === 'end');

    if (!hasStart) errors.push('Workflow must have a start node');
    if (!hasEnd) errors.push('Workflow must have an end node');

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    workflow.connections.forEach(conn => {
      connectedNodeIds.add(conn.sourceNodeId);
      connectedNodeIds.add(conn.targetNodeId);
    });

    workflow.nodes.forEach(node => {
      if (!connectedNodeIds.has(node.id) && node.type !== 'start') {
        errors.push(`Node "${node.id}" is not connected to the workflow`);
      }
    });

    // Validate node configurations
    workflow.nodes.forEach(node => {
      const nodeErrors = this.validateNode(node);
      errors.push(...nodeErrors);
    });

    return { valid: errors.length === 0, errors };
  }

  private validateNode(node: WorkflowNode): string[] {
    const errors: string[] = [];

    switch (node.type) {
      case 'action':
        if (!node.config.actionId) {
          errors.push(`Action node "${node.id}" must specify an actionId`);
        }
        break;
      case 'condition':
        if (!node.config.condition) {
          errors.push(`Condition node "${node.id}" must specify a condition`);
        }
        break;
      case 'assertion':
        if (!node.config.assertion) {
          errors.push(`Assertion node "${node.id}" must specify assertion config`);
        }
        break;
    }

    return errors;
  }

  async executeWorkflow(workflowId: string): Promise<any> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    // Validate before execution
    const validation = await this.validateWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }

    // TODO: Implement workflow execution logic
    // This would orchestrate execution across different automation backends

    return {
      workflowId,
      status: 'executing',
      startTime: new Date(),
    };
  }

  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const workflowService = new WorkflowService();