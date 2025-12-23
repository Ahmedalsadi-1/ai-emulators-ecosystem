import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type AutomationTool = 'turix' | 'openinterface' | 'factif';

export interface WorkflowStep {
  id: string;
  tool: AutomationTool;
  action: string;
  parameters: Record<string, any>;
  dependsOn?: string[]; // IDs of steps this step depends on
  timeout?: number;
  retryCount?: number;
  onSuccess?: string[]; // IDs of steps to execute on success
  onFailure?: string[]; // IDs of steps to execute on failure
}

export interface WorkflowExecution {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  startTime?: Date;
  endTime?: Date;
  results: Record<string, any>;
  logs: WorkflowLog[];
  sharedState: Record<string, any>; // State shared between steps
}

export interface WorkflowLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  stepId?: string;
  tool?: AutomationTool;
  data?: any;
}

export interface AutomationWorkflowState {
  workflows: Record<string, WorkflowExecution>;
  activeWorkflowId: string | null;

  // Actions
  createWorkflow: (name: string, steps: WorkflowStep[]) => string;
  startWorkflow: (workflowId: string) => Promise<void>;
  pauseWorkflow: (workflowId: string) => void;
  stopWorkflow: (workflowId: string) => void;
  deleteWorkflow: (workflowId: string) => void;

  // Execution methods
  executeStep: (workflowId: string, stepId: string) => Promise<void>;
  updateWorkflowStatus: (workflowId: string, status: WorkflowExecution['status']) => void;
  addLog: (workflowId: string, log: Omit<WorkflowLog, 'id' | 'timestamp'>) => void;

  // State management
  setSharedState: (workflowId: string, key: string, value: any) => void;
  getSharedState: (workflowId: string, key: string) => any;
  getWorkflow: (workflowId: string) => WorkflowExecution | null;

  // Tool integration methods
  executeTurixAction: (action: string, parameters: Record<string, any>) => Promise<any>;
  executeOpenInterfaceAction: (action: string, parameters: Record<string, any>) => Promise<any>;
  executeFactifAction: (action: string, parameters: Record<string, any>) => Promise<any>;
}

export const useAutomationWorkflowStore = create<AutomationWorkflowState>()(
  devtools(
    (set, get) => ({
      workflows: {},
      activeWorkflowId: null,

      createWorkflow: (name: string, steps: WorkflowStep[]) => {
        const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const workflow: WorkflowExecution = {
          id: workflowId,
          name,
          steps,
          status: 'idle',
          results: {},
          logs: [],
          sharedState: {},
        };

        set((state) => ({
          workflows: {
            ...state.workflows,
            [workflowId]: workflow,
          },
        }));

        return workflowId;
      },

      startWorkflow: async (workflowId: string) => {
        const workflow = get().workflows[workflowId];
        if (!workflow) return;

        // Update status to running
        get().updateWorkflowStatus(workflowId, 'running');

        // Find initial steps (no dependencies)
        const initialSteps = workflow.steps.filter(step => !step.dependsOn || step.dependsOn.length === 0);

        // Execute initial steps in parallel
        await Promise.all(
          initialSteps.map(step => get().executeStep(workflowId, step.id))
        );

        // Check if workflow is complete
        const workflowAfterStart = get().workflows[workflowId];
        const completedSteps = Object.keys(workflowAfterStart.results);
        const allSteps = workflowAfterStart.steps.map(s => s.id);

        if (completedSteps.length === allSteps.length) {
          get().updateWorkflowStatus(workflowId, 'completed');
        }
      },

      pauseWorkflow: (workflowId: string) => {
        get().updateWorkflowStatus(workflowId, 'paused');
      },

      stopWorkflow: (workflowId: string) => {
        get().updateWorkflowStatus(workflowId, 'failed');
        get().addLog(workflowId, {
          level: 'info',
          message: 'Workflow stopped by user',
        });
      },

      deleteWorkflow: (workflowId: string) => {
        set((state) => {
          const newWorkflows = { ...state.workflows };
          delete newWorkflows[workflowId];
          return {
            workflows: newWorkflows,
            activeWorkflowId: state.activeWorkflowId === workflowId ? null : state.activeWorkflowId,
          };
        });
      },

      executeStep: async (workflowId: string, stepId: string) => {
        const workflow = get().workflows[workflowId];
        if (!workflow) return;

        const step = workflow.steps.find(s => s.id === stepId);
        if (!step) return;

        // Update current step
        set((state) => ({
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...state.workflows[workflowId],
              currentStep: stepId,
            },
          },
        }));

        get().addLog(workflowId, {
          level: 'info',
          message: `Executing step: ${step.action}`,
          stepId,
          tool: step.tool,
        });

        try {
          let result;

          // Execute based on tool
          switch (step.tool) {
            case 'turix':
              result = await get().executeTurixAction(step.action, step.parameters);
              break;
            case 'openinterface':
              result = await get().executeOpenInterfaceAction(step.action, step.parameters);
              break;
            case 'factif':
              result = await get().executeFactifAction(step.action, step.parameters);
              break;
            default:
              throw new Error(`Unknown tool: ${step.tool}`);
          }

          // Store result
          set((state) => ({
            workflows: {
              ...state.workflows,
              [workflowId]: {
                ...state.workflows[workflowId],
                results: {
                  ...state.workflows[workflowId].results,
                  [stepId]: result,
                },
              },
            },
          }));

          get().addLog(workflowId, {
            level: 'info',
            message: `Step completed successfully`,
            stepId,
            tool: step.tool,
            data: result,
          });

          // Execute dependent steps
          if (step.onSuccess) {
            await Promise.all(
              step.onSuccess.map(nextStepId => get().executeStep(workflowId, nextStepId))
            );
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          get().addLog(workflowId, {
            level: 'error',
            message: `Step failed: ${errorMessage}`,
            stepId,
            tool: step.tool,
            data: error,
          });

          // Execute failure steps
          if (step.onFailure) {
            await Promise.all(
              step.onFailure.map(nextStepId => get().executeStep(workflowId, nextStepId))
            );
          }

          // Update workflow status to failed
          get().updateWorkflowStatus(workflowId, 'failed');
        }
      },

      updateWorkflowStatus: (workflowId: string, status: WorkflowExecution['status']) => {
        set((state) => ({
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...state.workflows[workflowId],
              status,
              endTime: status === 'completed' || status === 'failed' ? new Date() : undefined,
              startTime: status === 'running' && !state.workflows[workflowId].startTime ? new Date() : state.workflows[workflowId].startTime,
            },
          },
        }));
      },

      addLog: (workflowId: string, logData: Omit<WorkflowLog, 'id' | 'timestamp'>) => {
        const log: WorkflowLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          timestamp: new Date(),
          ...logData,
        };

        set((state) => ({
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...state.workflows[workflowId],
              logs: [...state.workflows[workflowId].logs, log],
            },
          },
        }));
      },

      setSharedState: (workflowId: string, key: string, value: any) => {
        set((state) => ({
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...state.workflows[workflowId],
              sharedState: {
                ...state.workflows[workflowId].sharedState,
                [key]: value,
              },
            },
          },
        }));
      },

      getSharedState: (workflowId: string, key: string) => {
        const workflow = get().workflows[workflowId];
        return workflow?.sharedState[key];
      },

      getWorkflow: (workflowId: string) => {
        return get().workflows[workflowId] || null;
      },

      // Tool execution methods (to be implemented with actual API calls)
      executeTurixAction: async (action: string, parameters: Record<string, any>) => {
        // TODO: Implement actual Turix API calls
        console.log('Executing Turix action:', action, parameters);
        return { success: true, action, parameters };
      },

      executeOpenInterfaceAction: async (action: string, parameters: Record<string, any>) => {
        // TODO: Implement actual OpenInterface API calls
        console.log('Executing OpenInterface action:', action, parameters);
        return { success: true, action, parameters };
      },

      executeFactifAction: async (action: string, parameters: Record<string, any>) => {
        // TODO: Implement actual Factif API calls
        console.log('Executing Factif action:', action, parameters);
        return { success: true, action, parameters };
      },

      // Helper method to check workflow completion
      checkWorkflowCompletion: (workflowId: string) => {
        const workflow = get().workflows[workflowId];
        if (!workflow) return;

        const completedSteps = Object.keys(workflow.results);
        const allSteps = workflow.steps.map(s => s.id);

        if (completedSteps.length === allSteps.length) {
          get().updateWorkflowStatus(workflowId, 'completed');
        }
      },
    }),
    {
      name: 'automation-workflow-store',
    }
  )
);