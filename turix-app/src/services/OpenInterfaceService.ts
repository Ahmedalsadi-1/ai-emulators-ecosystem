// Open-Interface Service Integration for TuriX
import ServiceRegistry from '../services/ServiceRegistry';

const OpenInterfaceService = {
  name: 'open-interface',
  displayName: 'Open-Interface',
  description: 'AI-powered screen automation with natural language commands and computer vision',
  capabilities: ['screen-control', 'automation', 'computer-vision', 'natural-language', 'screenshot-analysis'],
  actions: ['Execute Command', 'Take Screenshot', 'Get Status', 'Update Settings', 'Stop Execution'],
  commands: [
    'automate task',
    'take screenshot',
    'analyze screen',
    'click element',
    'type text',
    'move mouse',
    'press keys',
    'scroll page',
    'execute command',
    'stop automation'
  ],
  endpoint: 'http://localhost:5000',
  electronApp: 'open-interface-electron',

  // Service-specific UI component
  ui: null, // Will be implemented as needed

  // Initialize the service
  init: () => {
    ServiceRegistry.getInstance().registerService(OpenInterfaceService);
  },

  // Process Open-Interface-specific commands
  processCommand: async (command: string, params: any) => {
    try {
      switch (command.toLowerCase()) {
        case 'execute command':
        case 'automate task':
          return await OpenInterfaceService.executeCommand(params.command || params.task);

        case 'take screenshot':
          return await OpenInterfaceService.takeScreenshot();

        case 'get status':
          return await OpenInterfaceService.getStatus();

        case 'stop automation':
        case 'stop execution':
          return await OpenInterfaceService.stopExecution();

        case 'analyze screen':
          return await OpenInterfaceService.analyzeScreen();

        default:
          throw new Error(`Unknown Open-Interface command: ${command}`);
      }
    } catch (error) {
      console.error('Open-Interface command failed:', error);
      throw new Error('Open-Interface service unavailable');
    }
  },

  // Execute natural language command
  executeCommand: async (command: string) => {
    try {
      const response = await fetch(`${OpenInterfaceService.endpoint}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: command })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Execution failed: ${error.error || response.status}`);
      }

      const result = await response.json();
      if (result.status === 'started') {
        return {
          success: true,
          data: result,
          message: `Started executing: ${command}`
        };
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (error) {
      console.error('Execute command failed:', error);
      throw error;
    }
  },

  // Take a screenshot via Open-Interface
  takeScreenshot: async () => {
    try {
      const response = await fetch(`${OpenInterfaceService.endpoint}/screenshot`);

      if (!response.ok) {
        throw new Error(`Screenshot failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        return {
          success: true,
          data: result.image,
          message: 'Screenshot captured successfully'
        };
      } else {
        throw new Error(result.error || 'Screenshot failed');
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
      throw error;
    }
  },

  // Get current status
  getStatus: async () => {
    try {
      const response = await fetch(`${OpenInterfaceService.endpoint}/status`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        message: `Status: ${result.status}, Executing: ${result.is_executing}`
      };
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  },

  // Stop current execution
  stopExecution: async () => {
    try {
      const response = await fetch(`${OpenInterfaceService.endpoint}/stop`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Stop execution failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        message: 'Execution stopped successfully'
      };
    } catch (error) {
      console.error('Stop execution failed:', error);
      throw error;
    }
  },

  // Analyze screen content
  analyzeScreen: async () => {
    try {
      // First take a screenshot, then we could extend this to analyze it
      const screenshot = await OpenInterfaceService.takeScreenshot();
      return {
        success: true,
        data: screenshot.data,
        message: 'Screen captured for analysis'
      };
    } catch (error) {
      console.error('Screen analysis failed:', error);
      throw error;
    }
  },

  // Get service health
  getHealth: async () => {
    try {
      const response = await fetch(`${OpenInterfaceService.endpoint}/health`);

      if (!response.ok) {
        return { healthy: false, status: response.status };
      }

      const result = await response.json();
      return {
        healthy: result.status === 'healthy',
        status: result.current_status,
        isExecuting: result.is_executing
      };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  // Launch Open-Interface Electron app
  launchApp: async () => {
    try {
      // This would typically be handled by the Electron main process
      // For now, we'll assume the app is launched separately
      if (window.electronAPI && window.electronAPI.launchService) {
        return await window.electronAPI.launchService('open-interface');
      } else {
        throw new Error('Electron API not available for launching services');
      }
    } catch (error) {
      console.error('Failed to launch Open-Interface app:', error);
      throw error;
    }
  },

  // Get available tools via API (for MCP compatibility)
  getTools: async () => {
    return [
      'execute_command',
      'take_screenshot',
      'get_status',
      'stop_execution',
      'analyze_screen'
    ];
  },

  // Invoke specific tool (for MCP compatibility)
  invokeTool: async (toolName: string, params: any) => {
    // Map MCP tool names to Open-Interface actions
    const toolMapping: { [key: string]: string } = {
      'execute_command': 'execute_command',
      'take_screenshot': 'take_screenshot',
      'get_status': 'get_status',
      'stop_execution': 'stop_execution',
      'analyze_screen': 'analyze_screen'
    };

    const action = toolMapping[toolName];
    if (!action) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return await OpenInterfaceService.processCommand(action, params);
  },

  // Get settings
  getSettings: async () => {
    try {
      const response = await fetch(`${OpenInterfaceService.endpoint}/settings`);

      if (!response.ok) {
        throw new Error(`Get settings failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get settings failed:', error);
      throw error;
    }
  },

  // Update settings
  updateSettings: async (settings: any) => {
    try {
      const response = await fetch(`${OpenInterfaceService.endpoint}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`Update settings failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update settings failed:', error);
      throw error;
    }
  }
};

export default OpenInterfaceService;