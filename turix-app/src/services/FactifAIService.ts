// FactifAIService.ts - TuriX Integration for Factif AI Test Automation
import ServiceRegistry from '../services/ServiceRegistry';

const FactifAIService = {
  name: 'factif-ai',
  displayName: 'Factif AI',
  description: 'AI-powered test automation with visual testing, computer control, and browser automation using Claude, GPT-4o, and Gemini',
  capabilities: [
    'ai-powered-testing',
    'visual-testing',
    'computer-control',
    'browser-automation',
    'screen-parsing',
    'test-case-generation',
    'automated-verification'
  ],
  actions: [
    'Execute Test Action',
    'Take Screenshot',
    'Click Element',
    'Type Text',
    'Press Key',
    'Scroll Page',
    'Navigate URL',
    'Visual Verification',
    'Parse Screen',
    'Generate Test Case'
  ],
  commands: [
    'run test action',
    'take screenshot',
    'click element',
    'type text',
    'press key',
    'scroll page',
    'navigate to',
    'verify visual',
    'parse screen',
    'generate test',
    'automate workflow',
    'validate ui',
    'extract elements'
  ],
  endpoint: 'http://localhost:3001',
  apiBaseUrl: 'http://localhost:3001/api',

  // Service-specific UI component
  ui: null, // Will be implemented as needed

  // Initialize the service
  init: () => {
    ServiceRegistry.getInstance().registerService(FactifAIService);
  },

  // Process Factif AI-specific commands
  processCommand: async (command: string, params: any) => {
    try {
      switch (command.toLowerCase()) {
        case 'run test action':
          return await FactifAIService.executeTestAction(params.action, params.source || 'chrome-puppeteer');

        case 'take screenshot':
          return await FactifAIService.takeScreenshot(params.source || 'chrome-puppeteer');

        case 'click element':
          return await FactifAIService.clickElement(params.coordinates, params.source || 'chrome-puppeteer');

        case 'type text':
          return await FactifAIService.typeText(params.text, params.source || 'chrome-puppeteer');

        case 'press key':
          return await FactifAIService.pressKey(params.key, params.source || 'chrome-puppeteer');

        case 'scroll page':
          return await FactifAIService.scrollPage(params.direction, params.source || 'chrome-puppeteer');

        case 'navigate to':
          return await FactifAIService.navigateTo(params.url, params.source || 'chrome-puppeteer');

        case 'verify visual':
          return await FactifAIService.verifyVisual(params.expected, params.source || 'chrome-puppeteer');

        case 'parse screen':
          return await FactifAIService.parseScreen(params.source || 'chrome-puppeteer');

        case 'generate test':
          return await FactifAIService.generateTestCase(params.description, params.source || 'chrome-puppeteer');

        case 'automate workflow':
          return await FactifAIService.automateWorkflow(params.steps, params.source || 'chrome-puppeteer');

        case 'validate ui':
          return await FactifAIService.validateUI(params.requirements, params.source || 'chrome-puppeteer');

        case 'extract elements':
          return await FactifAIService.extractElements(params.source || 'chrome-puppeteer');

        default:
          throw new Error(`Unknown Factif AI command: ${command}`);
      }
    } catch (error) {
      console.error('Factif AI command failed:', error);
      throw new Error('Factif AI service unavailable');
    }
  },

  // Execute a test action via Factif AI
  executeTestAction: async (action: string, source: string = 'chrome-puppeteer') => {
    try {
      const response = await fetch(`${FactifAIService.apiBaseUrl}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Test action failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result,
        message: result.message || 'Test action executed successfully'
      };
    } catch (error) {
      console.error('Execute test action failed:', error);
      throw error;
    }
  },

  // Take a screenshot for visual testing
  takeScreenshot: async (source: string = 'chrome-puppeteer') => {
    try {
      const response = await fetch(`${FactifAIService.apiBaseUrl}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'screenshot',
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Screenshot failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        screenshot: result.screenshot,
        omniParserResults: result.omniParserResults,
        message: 'Screenshot captured successfully'
      };
    } catch (error) {
      console.error('Screenshot failed:', error);
      throw error;
    }
  },

  // Click on an element at coordinates
  clickElement: async (coordinates: { x: number, y: number }, source: string = 'chrome-puppeteer') => {
    try {
      const response = await fetch(`${FactifAIService.apiBaseUrl}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'click',
          coordinate: `${coordinates.x},${coordinates.y}`,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Click element failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result,
        message: `Clicked at ${coordinates.x},${coordinates.y}`
      };
    } catch (error) {
      console.error('Click element failed:', error);
      throw error;
    }
  },

  // Type text into focused element
  typeText: async (text: string, source: string = 'chrome-puppeteer') => {
    try {
      const response = await fetch(`${FactifAIService.apiBaseUrl}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'type',
          text,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Type text failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result,
        message: `Typed text: ${text}`
      };
    } catch (error) {
      console.error('Type text failed:', error);
      throw error;
    }
  },

  // Press a specific key
  pressKey: async (key: string, source: string = 'chrome-puppeteer') => {
    try {
      const response = await fetch(`${FactifAIService.apiBaseUrl}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'keyPress',
          key,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Press key failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result,
        message: `Pressed key: ${key}`
      };
    } catch (error) {
      console.error('Press key failed:', error);
      throw error;
    }
  },

  // Scroll the page in a direction
  scrollPage: async (direction: 'up' | 'down', source: string = 'chrome-puppeteer') => {
    try {
      const action = direction === 'up' ? 'scrollUp' : 'scrollDown';
      const response = await fetch(`${FactifAIService.apiBaseUrl}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Scroll page failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result,
        message: `Scrolled ${direction}`
      };
    } catch (error) {
      console.error('Scroll page failed:', error);
      throw error;
    }
  },

  // Navigate to a URL (for browser automation)
  navigateTo: async (url: string, source: string = 'chrome-puppeteer') => {
    try {
      const response = await fetch(`${FactifAIService.apiBaseUrl}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'launch',
          url,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Navigate to URL failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result,
        message: `Navigated to ${url}`
      };
    } catch (error) {
      console.error('Navigate to URL failed:', error);
      throw error;
    }
  },

  // Perform visual verification
  verifyVisual: async (expected: any, source: string = 'chrome-puppeteer') => {
    try {
      // First take a screenshot
      const screenshotResult = await FactifAIService.takeScreenshot(source);
      if (!screenshotResult.success) {
        throw new Error('Failed to capture screenshot for verification');
      }

      // Use AI to analyze the screenshot against expected criteria
      const response = await fetch(`${FactifAIService.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Verify that the current screen matches these expectations: ${JSON.stringify(expected)}`,
          screenshot: screenshotResult.screenshot,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Visual verification failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        verification: result,
        screenshot: screenshotResult.screenshot,
        message: 'Visual verification completed'
      };
    } catch (error) {
      console.error('Visual verification failed:', error);
      throw error;
    }
  },

  // Parse screen elements using OmniParser
  parseScreen: async (source: string = 'chrome-puppeteer') => {
    try {
      const screenshotResult = await FactifAIService.takeScreenshot(source);
      if (!screenshotResult.success) {
        throw new Error('Failed to capture screenshot for parsing');
      }

      return {
        success: true,
        elements: screenshotResult.omniParserResults,
        screenshot: screenshotResult.screenshot,
        message: 'Screen parsed successfully'
      };
    } catch (error) {
      console.error('Parse screen failed:', error);
      throw error;
    }
  },

  // Generate test case from natural language description
  generateTestCase: async (description: string, source: string = 'chrome-puppeteer') => {
    try {
      const response = await fetch(`${FactifAIService.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate a test case for: ${description}`,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Test case generation failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        testCase: result,
        message: 'Test case generated successfully'
      };
    } catch (error) {
      console.error('Generate test case failed:', error);
      throw error;
    }
  },

  // Automate a multi-step workflow
  automateWorkflow: async (steps: Array<{ action: string, params?: any }>, source: string = 'chrome-puppeteer') => {
    try {
      const results = [];

      for (const step of steps) {
        const result = await FactifAIService.executeTestAction(step.action, source);
        results.push({
          step,
          result,
          timestamp: new Date().toISOString()
        });

        // Add delay between steps
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        workflowResults: results,
        message: `Workflow automation completed with ${results.length} steps`
      };
    } catch (error) {
      console.error('Automate workflow failed:', error);
      throw error;
    }
  },

  // Validate UI against requirements
  validateUI: async (requirements: any, source: string = 'chrome-puppeteer') => {
    try {
      const screenshotResult = await FactifAIService.takeScreenshot(source);
      if (!screenshotResult.success) {
        throw new Error('Failed to capture screenshot for UI validation');
      }

      const response = await fetch(`${FactifAIService.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Validate that the UI meets these requirements: ${JSON.stringify(requirements)}`,
          screenshot: screenshotResult.screenshot,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`UI validation failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        validation: result,
        screenshot: screenshotResult.screenshot,
        message: 'UI validation completed'
      };
    } catch (error) {
      console.error('Validate UI failed:', error);
      throw error;
    }
  },

  // Extract clickable elements from screen
  extractElements: async (source: string = 'chrome-puppeteer') => {
    try {
      const parseResult = await FactifAIService.parseScreen(source);
      if (!parseResult.success) {
        throw new Error('Failed to parse screen for element extraction');
      }

      return {
        success: true,
        elements: parseResult.elements?.parsed_content || [],
        coordinates: parseResult.elements?.label_coordinates || {},
        screenshot: parseResult.screenshot,
        message: 'Elements extracted successfully'
      };
    } catch (error) {
      console.error('Extract elements failed:', error);
      throw error;
    }
  },

  // Get available tools via MCP (if available)
  getTools: async () => {
    try {
      // Factif AI primarily uses REST API, but can be extended with MCP
      return [
        'factif_execute_action',
        'factif_take_screenshot',
        'factif_click_element',
        'factif_type_text',
        'factif_press_key',
        'factif_scroll_page',
        'factif_navigate_url',
        'factif_verify_visual',
        'factif_parse_screen',
        'factif_generate_test',
        'factif_automate_workflow',
        'factif_validate_ui',
        'factif_extract_elements'
      ];
    } catch (error) {
      console.error('Failed to get Factif AI tools:', error);
      return [];
    }
  },

  // Invoke specific tool (for MCP compatibility)
  invokeTool: async (toolName: string, params: any) => {
    try {
      // Map MCP tool names to Factif AI actions
      const toolMapping: { [key: string]: string } = {
        'factif_execute_action': 'executeTestAction',
        'factif_take_screenshot': 'takeScreenshot',
        'factif_click_element': 'clickElement',
        'factif_type_text': 'typeText',
        'factif_press_key': 'pressKey',
        'factif_scroll_page': 'scrollPage',
        'factif_navigate_url': 'navigateTo',
        'factif_verify_visual': 'verifyVisual',
        'factif_parse_screen': 'parseScreen',
        'factif_generate_test': 'generateTestCase',
        'factif_automate_workflow': 'automateWorkflow',
        'factif_validate_ui': 'validateUI',
        'factif_extract_elements': 'extractElements'
      };

      const method = toolMapping[toolName];
      if (!method) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      return await (FactifAIService as any)[method](params);
    } catch (error) {
      console.error(`Failed to invoke Factif AI tool ${toolName}:`, error);
      throw error;
    }
  },

  // Get supported sources (browser automation modes)
  getSupportedSources: () => {
    return ['chrome-puppeteer', 'ubuntu-docker-vnc'];
  },

  // Check service health
  checkHealth: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${FactifAIService.endpoint}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Factif AI health check failed:', error);
      return false;
    }
  }
};

export default FactifAIService;