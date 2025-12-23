// backend/src/services/ActionExecutionService.ts
import axios from 'axios';
import {
  AutomationAction,
  AutomationBackend,
  DetectedElement
} from '../../../shared/types/automation.types';

export class ActionExecutionService {
  private backends: Record<AutomationBackend, string> = {
    openinterface: process.env.OPENINTERFACE_URL || 'http://localhost:8000',
    factif: process.env.FACTIF_URL || 'http://localhost:3001',
    turix: process.env.TURIX_URL || 'http://localhost:4000',
    unified: '', // This service itself
  };

  private actions: AutomationAction[] = [
    // Desktop actions (OpenInterface)
    {
      id: 'desktop_click',
      name: 'Click Element',
      description: 'Click on a desktop element at specified coordinates',
      category: 'interaction',
      platforms: ['desktop'],
      executor: 'openinterface',
      parameters: [
        {
          name: 'x',
          type: 'number',
          required: true,
          description: 'X coordinate to click'
        },
        {
          name: 'y',
          type: 'number',
          required: true,
          description: 'Y coordinate to click'
        },
        {
          name: 'button',
          type: 'string',
          required: false,
          defaultValue: 'left',
          description: 'Mouse button (left, right, middle)'
        }
      ]
    },
    {
      id: 'desktop_type',
      name: 'Type Text',
      description: 'Type text at current cursor position',
      category: 'input',
      platforms: ['desktop'],
      executor: 'openinterface',
      parameters: [
        {
          name: 'text',
          type: 'string',
          required: true,
          description: 'Text to type'
        }
      ]
    },
    {
      id: 'desktop_screenshot',
      name: 'Take Screenshot',
      description: 'Capture screenshot of desktop',
      category: 'data',
      platforms: ['desktop'],
      executor: 'openinterface',
      parameters: []
    },

    // Web actions (Factif AI)
    {
      id: 'web_navigate',
      name: 'Navigate to URL',
      description: 'Navigate browser to specified URL',
      category: 'navigation',
      platforms: ['web'],
      executor: 'factif',
      parameters: [
        {
          name: 'url',
          type: 'string',
          required: true,
          description: 'URL to navigate to'
        }
      ]
    },
    {
      id: 'web_click',
      name: 'Click Web Element',
      description: 'Click on a web element',
      category: 'interaction',
      platforms: ['web'],
      executor: 'factif',
      parameters: [
        {
          name: 'selector',
          type: 'string',
          required: true,
          description: 'CSS selector or element ID'
        }
      ]
    },
    {
      id: 'web_type',
      name: 'Type in Web Element',
      description: 'Type text into a web input element',
      category: 'input',
      platforms: ['web'],
      executor: 'factif',
      parameters: [
        {
          name: 'selector',
          type: 'string',
          required: true,
          description: 'CSS selector for input element'
        },
        {
          name: 'text',
          type: 'string',
          required: true,
          description: 'Text to type'
        }
      ]
    },
    {
      id: 'web_screenshot',
      name: 'Take Web Screenshot',
      description: 'Capture screenshot of web page',
      category: 'data',
      platforms: ['web'],
      executor: 'factif',
      parameters: []
    },

    // Cross-platform actions
    {
      id: 'wait',
      name: 'Wait',
      description: 'Wait for specified duration',
      category: 'control',
      platforms: ['desktop', 'web', 'mobile'],
      executor: 'unified',
      parameters: [
        {
          name: 'duration',
          type: 'number',
          required: true,
          description: 'Duration to wait in milliseconds'
        }
      ]
    },
    {
      id: 'assert_element_exists',
      name: 'Assert Element Exists',
      description: 'Assert that an element exists on screen',
      category: 'assertion',
      platforms: ['desktop', 'web'],
      executor: 'unified',
      parameters: [
        {
          name: 'element',
          type: 'element',
          required: true,
          description: 'Element to check for existence'
        }
      ]
    }
  ];

  async getAvailableActions(platform?: string): Promise<AutomationAction[]> {
    if (!platform) return this.actions;

    return this.actions.filter(action =>
      action.platforms.includes(platform as any)
    );
  }

  async executeAction(
    actionId: string,
    parameters: Record<string, any>,
    platform: string
  ): Promise<any> {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    // Validate parameters
    this.validateParameters(action, parameters);

    // Route to appropriate backend
    switch (action.executor) {
      case 'openinterface':
        return this.executeOpenInterfaceAction(action, parameters);
      case 'factif':
        return this.executeFactifAction(action, parameters);
      case 'turix':
        return this.executeTurixAction(action, parameters);
      case 'unified':
        return this.executeUnifiedAction(action, parameters);
      default:
        throw new Error(`Unknown executor: ${action.executor}`);
    }
  }

  private async executeOpenInterfaceAction(action: AutomationAction, parameters: Record<string, any>): Promise<any> {
    const backendUrl = this.backends.openinterface;

    try {
      const response = await axios.post(`${backendUrl}/api/actions/execute`, {
        action: action.id,
        parameters,
        platform: 'desktop',
      }, {
        timeout: action.timeout || 30000,
      });

      return response.data;
    } catch (error) {
      console.error('OpenInterface action execution failed:', error);
      throw new Error(`Desktop action failed: ${error.message}`);
    }
  }

  private async executeFactifAction(action: AutomationAction, parameters: Record<string, any>): Promise<any> {
    const backendUrl = this.backends.factif;

    try {
      const response = await axios.post(`${backendUrl}/api/actions/execute`, {
        action: action.id,
        parameters,
        platform: 'web',
      }, {
        timeout: action.timeout || 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Factif action execution failed:', error);
      throw new Error(`Web action failed: ${error.message}`);
    }
  }

  private async executeTurixAction(action: AutomationAction, parameters: Record<string, any>): Promise<any> {
    // TODO: Implement Turix action execution
    // This would route to the appropriate Turix automation card
    throw new Error('Turix action execution not implemented yet');
  }

  private async executeUnifiedAction(action: AutomationAction, parameters: Record<string, any>): Promise<any> {
    switch (action.id) {
      case 'wait':
        await this.delay(parameters.duration);
        return { status: 'completed', duration: parameters.duration };
      case 'assert_element_exists':
        // TODO: Implement element existence assertion
        return { status: 'completed', elementExists: true };
      default:
        throw new Error(`Unknown unified action: ${action.id}`);
    }
  }

  private validateParameters(action: AutomationAction, parameters: Record<string, any>): void {
    for (const param of action.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      // Type validation
      const value = parameters[param.name];
      if (value !== undefined) {
        this.validateParameterType(param, value);
      }
    }
  }

  private validateParameterType(param: any, value: any): void {
    switch (param.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Parameter ${param.name} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Parameter ${param.name} must be a boolean`);
        }
        break;
      // Add more type validations as needed
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const actionExecutionService = new ActionExecutionService();