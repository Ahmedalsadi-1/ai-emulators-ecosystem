import { useState, useCallback } from 'react';
import type { ControllerWorkflow, WorkflowStep } from '@/types/controller.types';

export function useControllerWorkflows() {
  const [workflows, setWorkflows] = useState<ControllerWorkflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<ControllerWorkflow | null>(null);

  const createWorkflow = useCallback((name: string, description?: string): string => {
    const workflow: ControllerWorkflow = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      steps: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setWorkflows(prev => [...prev, workflow]);
    return workflow.id;
  }, []);

  const addWorkflowStep = useCallback((workflowId: string, step: Omit<WorkflowStep, 'id'>) => {
    const stepWithId: WorkflowStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };

    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId
        ? {
            ...workflow,
            steps: [...workflow.steps, stepWithId],
            updatedAt: new Date(),
          }
        : workflow
    ));
  }, []);

  const removeWorkflowStep = useCallback((workflowId: string, stepId: string) => {
    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId
        ? {
            ...workflow,
            steps: workflow.steps.filter(step => step.id !== stepId),
            updatedAt: new Date(),
          }
        : workflow
    ));
  }, []);

  const updateWorkflowStep = useCallback((
    workflowId: string,
    stepId: string,
    updates: Partial<WorkflowStep>
  ) => {
    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId
        ? {
            ...workflow,
            steps: workflow.steps.map(step =>
              step.id === stepId ? { ...step, ...updates } : step
            ),
            updatedAt: new Date(),
          }
        : workflow
    ));
  }, []);

  const activateWorkflow = useCallback((workflowId: string) => {
    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId
        ? { ...workflow, isActive: true, updatedAt: new Date() }
        : { ...workflow, isActive: false } // Deactivate others
    ));

    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      setActiveWorkflow({ ...workflow, isActive: true });
    }
  }, [workflows]);

  const deactivateWorkflow = useCallback((workflowId: string) => {
    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId
        ? { ...workflow, isActive: false, updatedAt: new Date() }
        : workflow
    ));

    if (activeWorkflow?.id === workflowId) {
      setActiveWorkflow(null);
    }
  }, [activeWorkflow]);

  const deleteWorkflow = useCallback((workflowId: string) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));

    if (activeWorkflow?.id === workflowId) {
      setActiveWorkflow(null);
    }
  }, [activeWorkflow]);

  const executeWorkflowStep = useCallback(async (
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<boolean> => {
    // Check conditions if any
    if (step.conditions) {
      for (const condition of step.conditions) {
        const value = context[condition.value] || condition.value;
        let conditionMet = false;

        switch (condition.operator) {
          case 'equals':
            conditionMet = value === condition.value;
            break;
          case 'contains':
            conditionMet = String(value).includes(String(condition.value));
            break;
          case 'greater':
            conditionMet = Number(value) > Number(condition.value);
            break;
          case 'less':
            conditionMet = Number(value) < Number(condition.value);
            break;
          case 'exists':
            conditionMet = value != null;
            break;
          case 'not_exists':
            conditionMet = value == null;
            break;
        }

        if (!conditionMet) {
          return false; // Condition not met, skip step
        }
      }
    }

    // Execute step action (this would integrate with controller actions)
    console.log(`Executing workflow step: ${step.action} on controller ${step.controllerId}`, step.params);

    // Add delay if specified
    if (step.delay) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    return true;
  }, []);

  const executeWorkflow = useCallback(async (
    workflowId: string,
    context: Record<string, any> = {}
  ): Promise<boolean> => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return false;

    for (const step of workflow.steps) {
      const success = await executeWorkflowStep(step, context);
      if (!success) {
        console.log(`Workflow ${workflow.name} failed at step ${step.id}`);
        return false;
      }
    }

    console.log(`Workflow ${workflow.name} completed successfully`);
    return true;
  }, [workflows, executeWorkflowStep]);

  return {
    workflows,
    activeWorkflow,
    createWorkflow,
    addWorkflowStep,
    removeWorkflowStep,
    updateWorkflowStep,
    activateWorkflow,
    deactivateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    executeWorkflowStep,
  };
}