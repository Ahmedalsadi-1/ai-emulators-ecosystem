// Bytebot Service Integration for TuriX
import ServiceRegistry from '../services/ServiceRegistry';

const BytebotService = {
  name: 'bytebot',
  displayName: 'Bytebot',
  description: 'AI desktop automation agent with screen control, mouse/keyboard simulation, and VNC integration',
  capabilities: ['screen-control', 'automation', 'vnc-integration', 'mouse-control', 'keyboard-control'],
  actions: ['Take Screenshot', 'Move Mouse', 'Click Element', 'Type Text', 'Open Application', 'Scroll Page'],
  commands: [
    'take screenshot',
    'move mouse',
    'click element',
    'type text',
    'open application',
    'scroll page',
    'press keys',
    'get cursor position',
    'switch to app',
    'automate task'
  ],
  endpoint: 'http://localhost:9990',
  vncUrl: 'http://localhost:9990/vnc',

  // Service-specific UI component
  ui: null, // Will be implemented as needed

  // Initialize the service
  init: () => {
    ServiceRegistry.getInstance().registerService(BytebotService);
  },

  // Process Bytebot-specific commands
  processCommand: async (command: string, params: any) => {
    try {
      switch (command.toLowerCase()) {
        case 'take screenshot':
          return await BytebotService.takeScreenshot();

        case 'move mouse':
          return await BytebotService.moveMouse(params.coordinates);

        case 'click element':
          return await BytebotService.clickMouse(params.coordinates, params.button || 'left', params.clickCount || 1);

        case 'type text':
          return await BytebotService.typeText(params.text, params.delay);

        case 'press keys':
          return await BytebotService.pressKeys(params.keys, params.press);

        case 'get cursor position':
          return await BytebotService.getCursorPosition();

        case 'open application':
          return await BytebotService.openApplication(params.application);

        case 'scroll page':
          return await BytebotService.scroll(params.coordinates, params.direction, params.scrollCount);

        default:
          throw new Error(`Unknown Bytebot command: ${command}`);
      }
    } catch (error) {
      console.error('Bytebot command failed:', error);
      throw new Error('Bytebot service unavailable');
    }
  },

  // Take a screenshot of the desktop
  takeScreenshot: async () => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'screenshot'
        })
      });

      if (!response.ok) {
        throw new Error(`Screenshot failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          data: result.data,
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

  // Move mouse to coordinates
  moveMouse: async (coordinates: { x: number, y: number }) => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'move_mouse',
          coordinates
        })
      });

      if (!response.ok) {
        throw new Error(`Mouse move failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Mouse move failed:', error);
      throw error;
    }
  },

  // Click mouse at coordinates
  clickMouse: async (coordinates: { x: number, y: number }, button: string = 'left', clickCount: number = 1) => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'click_mouse',
          coordinates,
          button,
          clickCount
        })
      });

      if (!response.ok) {
        throw new Error(`Mouse click failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Mouse click failed:', error);
      throw error;
    }
  },

  // Type text
  typeText: async (text: string, delay?: number) => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'type_text',
          text,
          delay
        })
      });

      if (!response.ok) {
        throw new Error(`Type text failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Type text failed:', error);
      throw error;
    }
  },

  // Press/release keys
  pressKeys: async (keys: string[], press: 'up' | 'down') => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'press_keys',
          keys,
          press
        })
      });

      if (!response.ok) {
        throw new Error(`Press keys failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Press keys failed:', error);
      throw error;
    }
  },

  // Get cursor position
  getCursorPosition: async () => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cursor_position'
        })
      });

      if (!response.ok) {
        throw new Error(`Get cursor position failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get cursor position failed:', error);
      throw error;
    }
  },

  // Open/switch to application
  openApplication: async (application: string) => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'application',
          application
        })
      });

      if (!response.ok) {
        throw new Error(`Open application failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Open application failed:', error);
      throw error;
    }
  },

  // Scroll in direction
  scroll: async (coordinates: { x: number, y: number }, direction: string, scrollCount: number) => {
    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'scroll',
          coordinates,
          direction,
          scrollCount
        })
      });

      if (!response.ok) {
        throw new Error(`Scroll failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Scroll failed:', error);
      throw error;
    }
  },

  // Get VNC URL for direct access
  getVncUrl: () => {
    return BytebotService.vncUrl;
  },

  // Get available tools via MCP (if available)
  getTools: async () => {
    // Bytebot primarily uses REST API, but can be extended with MCP
    return [
      'computer_move_mouse',
      'computer_click_mouse',
      'computer_type_text',
      'computer_screenshot',
      'computer_cursor_position',
      'computer_application',
      'computer_scroll'
    ];
  },

  // Invoke specific tool (for MCP compatibility)
  invokeTool: async (toolName: string, params: any) => {
    // Map MCP tool names to Bytebot actions
    const toolMapping: { [key: string]: string } = {
      'computer_move_mouse': 'move_mouse',
      'computer_click_mouse': 'click_mouse',
      'computer_type_text': 'type_text',
      'computer_screenshot': 'screenshot',
      'computer_cursor_position': 'cursor_position',
      'computer_application': 'application',
      'computer_scroll': 'scroll'
    };

    const action = toolMapping[toolName];
    if (!action) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
      const response = await fetch(`${BytebotService.endpoint}/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...params
        })
      });

      return await response.json();
    } catch (error) {
      console.error(`Failed to invoke Bytebot tool ${toolName}:`, error);
      throw error;
    }
  }
};

export default BytebotService;