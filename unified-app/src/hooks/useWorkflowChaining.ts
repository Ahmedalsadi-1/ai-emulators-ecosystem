import { useAutomationWorkflowStore } from './useAutomationWorkflow';
import { useCrossCommunication } from './useCrossCommunication';
import { WorkflowStep } from './useAutomationWorkflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  category: 'basic' | 'advanced' | 'testing' | 'integration';
  estimatedDuration: number; // in seconds
  tags: string[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'turix-openinterface-factif-chain',
    name: 'Complete Automation Chain',
    description: 'Turix automation → OpenInterface control → Factif visual testing',
    category: 'integration',
    estimatedDuration: 45,
    tags: ['turix', 'openinterface', 'factif', 'full-chain'],
    steps: [
      {
        id: 'turix-init',
        tool: 'turix',
        action: 'initialize-session',
        parameters: { sessionType: 'automation-chain' },
        onSuccess: ['openinterface-capture'],
      },
      {
        id: 'openinterface-capture',
        tool: 'openinterface',
        action: 'computer-control',
        parameters: {
          objective: 'Take a screenshot of the current desktop state for analysis',
          captureScreenshot: true
        },
        dependsOn: ['turix-init'],
        onSuccess: ['factif-analyze'],
      },
      {
        id: 'factif-analyze',
        tool: 'factif',
        action: 'visual-testing',
        parameters: {
          action: 'analyze-screenshot',
          useCapturedScreenshot: true,
          detectElements: true
        },
        dependsOn: ['openinterface-capture'],
        onSuccess: ['turix-report'],
      },
      {
        id: 'turix-report',
        tool: 'turix',
        action: 'generate-report',
        parameters: {
          includeResults: true,
          format: 'json'
        },
        dependsOn: ['factif-analyze'],
      },
    ],
  },
  {
    id: 'web-automation-testing',
    name: 'Web Automation Testing',
    description: 'Browser automation with visual regression testing',
    category: 'testing',
    estimatedDuration: 30,
    tags: ['factif', 'testing', 'web'],
    steps: [
      {
        id: 'factif-navigate',
        tool: 'factif',
        action: 'browser-control',
        parameters: {
          action: 'navigate',
          url: 'https://example.com'
        },
        onSuccess: ['factif-capture-baseline'],
      },
      {
        id: 'factif-capture-baseline',
        tool: 'factif',
        action: 'visual-testing',
        parameters: {
          action: 'capture-baseline',
          name: 'homepage-baseline'
        },
        dependsOn: ['factif-navigate'],
        onSuccess: ['factif-run-tests'],
      },
      {
        id: 'factif-run-tests',
        tool: 'factif',
        action: 'visual-testing',
        parameters: {
          action: 'run-regression-test',
          baselineName: 'homepage-baseline'
        },
        dependsOn: ['factif-capture-baseline'],
      },
    ],
  },
  {
    id: 'desktop-automation-workflow',
    name: 'Desktop Automation Workflow',
    description: 'LLM-driven desktop automation with screenshot verification',
    category: 'basic',
    estimatedDuration: 25,
    tags: ['openinterface', 'desktop', 'llm'],
    steps: [
      {
        id: 'openinterface-task',
        tool: 'openinterface',
        action: 'computer-control',
        parameters: {
          objective: 'Open a text editor and type a sample message',
          captureScreenshot: true
        },
        onSuccess: ['openinterface-verify'],
      },
      {
        id: 'openinterface-verify',
        tool: 'openinterface',
        action: 'computer-control',
        parameters: {
          objective: 'Verify that the text was entered correctly by reading the screen',
          compareWithPrevious: true
        },
        dependsOn: ['openinterface-task'],
      },
    ],
  },
  {
    id: 'cross-platform-integration',
    name: 'Cross-Platform Integration',
    description: 'Turix service orchestration with OpenInterface and Factif coordination',
    category: 'advanced',
    estimatedDuration: 60,
    tags: ['turix', 'openinterface', 'factif', 'orchestration'],
    steps: [
      {
        id: 'turix-orchestrate',
        tool: 'turix',
        action: 'service-orchestration',
        parameters: {
          services: ['openinterface', 'factif'],
          mode: 'coordinated'
        },
        onSuccess: ['parallel-execution'],
      },
      {
        id: 'parallel-execution',
        tool: 'turix',
        action: 'parallel-execution',
        parameters: {
          tasks: [
            {
              tool: 'openinterface',
              action: 'computer-control',
              parameters: { objective: 'Monitor system performance' }
            },
            {
              tool: 'factif',
              action: 'browser-control',
              parameters: { action: 'health-check' }
            }
          ]
        },
        dependsOn: ['turix-orchestrate'],
        onSuccess: ['turix-aggregate'],
      },
      {
        id: 'turix-aggregate',
        tool: 'turix',
        action: 'aggregate-results',
        parameters: {
          sources: ['openinterface', 'factif'],
          format: 'unified-report'
        },
        dependsOn: ['parallel-execution'],
      },
    ],
  },
];

export const useWorkflowChaining = () => {
  const workflowStore = useAutomationWorkflowStore();
  const comms = useCrossCommunication();

  const createWorkflowFromTemplate = (templateId: string) => {
    const template = workflowTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflowId = workflowStore.createWorkflow(
      `${template.name} - ${new Date().toLocaleString()}`,
      template.steps
    );

    return workflowId;
  };

  const executeChainedWorkflow = async (workflowId: string) => {
    try {
      // Validate tool connections before starting
      const requiredTools = ['turix', 'openinterface', 'factif'] as const;
      for (const tool of requiredTools) {
        if (!comms.isToolConnected(tool)) {
          throw new Error(`Required tool ${tool} is not connected`);
        }
      }

      // Start the workflow
      await workflowStore.startWorkflow(workflowId);

      // Set up progress monitoring
      const workflow = workflowStore.getWorkflow(workflowId);
      if (workflow) {
        comms.reportWorkflowStatus(workflowId, 'running', 'orchestrator');
      }

      return workflowId;
    } catch (error) {
      console.error('Failed to execute chained workflow:', error);
      comms.reportWorkflowStatus(workflowId, 'failed', 'orchestrator');
      throw error;
    }
  };

  const createCustomChain = (
    name: string,
    steps: Array<{
      tool: 'turix' | 'openinterface' | 'factif';
      action: string;
      parameters: Record<string, any>;
      dependsOn?: string[];
    }>
  ) => {
    const workflowSteps: WorkflowStep[] = steps.map((step, index) => ({
      id: `step-${index + 1}`,
      tool: step.tool,
      action: step.action,
      parameters: step.parameters,
      dependsOn: step.dependsOn,
      onSuccess: index < steps.length - 1 ? [`step-${index + 2}`] : undefined,
    }));

    return workflowStore.createWorkflow(name, workflowSteps);
  };

  const getWorkflowTemplates = (category?: string) => {
    if (category) {
      return workflowTemplates.filter(t => t.category === category);
    }
    return workflowTemplates;
  };

  const validateWorkflowChain = (steps: WorkflowStep[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCircularDependency = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step?.onSuccess) {
        for (const nextStepId of step.onSuccess) {
          if (hasCircularDependency(nextStepId)) return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (hasCircularDependency(step.id)) {
        errors.push(`Circular dependency detected involving step: ${step.id}`);
      }
    }

    // Check for unreachable steps
    const reachableSteps = new Set<string>();
    const initialSteps = steps.filter(s => !s.dependsOn || s.dependsOn.length === 0);

    const markReachable = (stepId: string) => {
      if (reachableSteps.has(stepId)) return;
      reachableSteps.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step?.onSuccess) {
        step.onSuccess.forEach(markReachable);
      }
    };

    initialSteps.forEach(step => markReachable(step.id));

    const unreachableSteps = steps.filter(s => !reachableSteps.has(s.id));
    if (unreachableSteps.length > 0) {
      warnings.push(`Unreachable steps: ${unreachableSteps.map(s => s.id).join(', ')}`);
    }

    // Check tool availability
    const requiredTools = [...new Set(steps.map(s => s.tool))];
    for (const tool of requiredTools) {
      if (!comms.isToolConnected(tool)) {
        warnings.push(`Tool ${tool} is not currently connected`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  };

  return {
    // Template management
    getWorkflowTemplates,
    createWorkflowFromTemplate,

    // Workflow execution
    executeChainedWorkflow,
    createCustomChain,

    // Validation
    validateWorkflowChain,

    // Utilities
    workflowTemplates,

    // Integration helpers
    shareWorkflowResult: (workflowId: string, result: any) => {
      comms.shareState(`workflow.${workflowId}.result`, result, 'orchestrator');
    },

    getWorkflowResult: (workflowId: string) => {
      return comms.getSharedState(`workflow.${workflowId}.result`);
    },
  };
};