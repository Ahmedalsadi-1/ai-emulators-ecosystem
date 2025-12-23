// AIOS Service Integration for TuriX
import ServiceRegistry from '../services/ServiceRegistry';

const AIOSService = {
  name: 'aios',
  displayName: 'AIOS',
  description: 'Complete AI Agent Operating System with LLM routing and tool integration',
  capabilities: ['text-generation', 'code-execution', 'llm-routing', 'memory-management'],
  actions: ['Generate Text', 'Execute Code', 'Analyze Document', 'Create Agent'],
  commands: [
    'generate text',
    'run code',
    'analyze document',
    'create agent',
    'chat with ai',
    'process document'
  ],
  endpoint: 'http://localhost:8010',
  mcpPort: 8011,

  // Service-specific UI component
  ui: null, // Will be implemented as needed

  // Initialize the service
  init: () => {
    ServiceRegistry.getInstance().registerService(AIOSService);
  },

  // Process AIOS-specific commands
  processCommand: async (command: string, params: any) => {
    try {
      const response = await fetch(`${AIOSService.endpoint}/api/v1/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          params,
          source: 'turix'
        })
      });

      if (!response.ok) {
        throw new Error(`AIOS API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AIOS command failed:', error);
      throw new Error('AIOS service unavailable');
    }
  },

  // Get available tools via MCP
  getTools: async () => {
    try {
      const response = await fetch(`http://localhost:${AIOSService.mcpPort}/tools`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get AIOS tools:', error);
      return [];
    }
  },

  // Invoke specific tool
  invokeTool: async (toolName: string, params: any) => {
    try {
      const response = await fetch(`http://localhost:${AIOSService.mcpPort}/tools/${toolName}/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      return await response.json();
    } catch (error) {
      console.error(`Failed to invoke AIOS tool ${toolName}:`, error);
      throw error;
    }
  }
};

export default AIOSService;