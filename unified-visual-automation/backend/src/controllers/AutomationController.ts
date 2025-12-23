// backend/src/controllers/AutomationController.ts
import { Request, Response } from 'express';
import { workflowService } from '../services/WorkflowService';
import { elementDetectionService } from '../services/ElementDetectionService';
import { actionExecutionService } from '../services/ActionExecutionService';
import { visualTestingService } from '../services/VisualTestingService';
import { AutomationWorkflow, Platform } from '../../../shared/types/automation.types';

export class AutomationController {
  // Workflow CRUD operations
  async createWorkflow(req: Request, res: Response) {
    try {
      const workflow = await workflowService.createWorkflow(req.body);
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWorkflow(req: Request, res: Response) {
    try {
      const workflow = await workflowService.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async listWorkflows(req: Request, res: Response) {
    try {
      const workflows = await workflowService.listWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async executeWorkflow(req: Request, res: Response) {
    try {
      const result = await workflowService.executeWorkflow(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Element detection
  async detectElements(req: Request, res: Response) {
    try {
      const { platform, screenshot } = req.body;
      const elements = await elementDetectionService.detectElements(platform, screenshot);
      res.json({ elements });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async detectElementAt(req: Request, res: Response) {
    try {
      const { platform, x, y, screenshot } = req.body;
      const element = await elementDetectionService.detectElementAt(platform, x, y, screenshot);
      res.json({ element });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Action execution
  async getAvailableActions(req: Request, res: Response) {
    try {
      const { platform } = req.query;
      const actions = await actionExecutionService.getAvailableActions(platform as string);
      res.json({ actions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async executeAction(req: Request, res: Response) {
    try {
      const { actionId, parameters, platform } = req.body;
      const result = await actionExecutionService.executeAction(actionId, parameters, platform);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Visual testing
  async createVisualTest(req: Request, res: Response) {
    try {
      const { name, workflowId, baselineScreenshot, currentScreenshot, threshold } = req.body;
      const test = await visualTestingService.createVisualTest(
        name,
        workflowId,
        baselineScreenshot,
        currentScreenshot,
        threshold
      );
      res.json({ test });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async compareScreenshots(req: Request, res: Response) {
    try {
      const { workflowId, currentScreenshot, threshold } = req.body;
      const test = await visualTestingService.compareWithBaseline(
        workflowId,
        currentScreenshot,
        threshold
      );
      res.json({ test });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateBaseline(req: Request, res: Response) {
    try {
      const { workflowId, newBaseline } = req.body;
      const success = await visualTestingService.updateBaseline(workflowId, newBaseline);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // LLM Integration for natural language automation
  async generateWorkflowFromText(req: Request, res: Response) {
    try {
      const { description, platform } = req.body;

      // TODO: Integrate with LLM to generate workflow from natural language
      // This would use the LLM to parse the description and create appropriate nodes

      const mockWorkflow: Partial<AutomationWorkflow> = {
        name: `Generated from: ${description.substring(0, 50)}...`,
        description,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            config: {},
            platform: platform || 'desktop',
          },
          // Add more nodes based on LLM analysis
        ],
        connections: [],
        metadata: {
          author: 'LLM Generator',
          version: '1.0.0',
          tags: ['generated', 'llm'],
          platforms: [platform || 'desktop'],
          estimatedDuration: 30000, // 30 seconds
        },
      };

      res.json({ workflow: mockWorkflow });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async suggestActions(req: Request, res: Response) {
    try {
      const { context, currentStep, platform } = req.body;

      // TODO: Use LLM to suggest next actions based on context

      const suggestions = [
        {
          actionId: 'web_navigate',
          confidence: 0.9,
          reason: 'Starting a web automation workflow typically begins with navigation',
        },
        {
          actionId: 'desktop_click',
          confidence: 0.7,
          reason: 'Clicking is a common interaction in automation',
        },
      ];

      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const automationController = new AutomationController();