import axios, { AxiosInstance } from 'axios';
import { AIOSServiceCard } from '../components/AIOSServiceCard';

// Custom error class for AIOS service-specific errors
class AIOSServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIOSServiceError';
  }
}

// Types based on AIOS API structure
interface LLMModel {
  name: string;
  backend: string;
  hostname?: string;
  provider?: string;
}

interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LLMQueryData {
  llms?: LLMModel[];
  messages: LLMMessage[];
  tools?: any[];
  action_type?: string;
  message_return_type?: string;
}

interface MemoryQueryData {
  params: any;
  operation_type: string;
}

interface ToolQueryData {
  params: any;
  operation_type: string;
}

interface StorageQueryData {
  params: any;
  operation_type: string;
}

interface QueryRequest {
  agent_name: string;
  query_type: 'llm' | 'memory' | 'tool' | 'storage';
  query_data: LLMQueryData | MemoryQueryData | ToolQueryData | StorageQueryData;
}

interface AgentSubmitRequest {
  agent_id: string;
  agent_config: {
    task: string;
    [key: string]: any;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * AIOSService provides a standardized API wrapper for the AIOS (AI Operating System) service.
 * Handles LLM operations, memory management, MCP tool discovery, and agent execution.
 * Integrates with the running AIOS container to provide clean REST endpoints.
 */
export class AIOSService {
  private baseUrl: string;
  private client: AxiosInstance;
  private selectedLLMs: LLMModel[] = [];

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout for AI operations
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.detail) {
          throw new AIOSServiceError(`AIOS API Error: ${error.response.data.detail}`);
        }
        throw new AIOSServiceError(`AIOS Service Error: ${error.message}`);
      }
    );
  }

  /**
   * Returns the service registration object for TuriX.
   * Call TuriX.registerService(this.getServiceRegistration()) to register.
   */
  public static getServiceRegistration() {
    return {
      name: 'aios',
      capabilities: ['llm-operations', 'memory-management', 'mcp-tools', 'agent-execution'],
      ui: AIOSServiceCard,
      commands: [
        'run llm query',
        'store memory',
        'retrieve memory',
        'discover mcp tools',
        'execute agent',
        'check agent status',
        'list llms'
      ]
    };
  }

  /**
   * Processes natural language commands for the AIOS service.
   * @param command - The natural language command to process.
   * @returns Promise resolving to the command result.
   */
  public async processCommand(command: string): Promise<any> {
    try {
      const normalizedCommand = command.toLowerCase().trim();

      if (normalizedCommand.includes('run llm query')) {
        return await this.runLLMQuery(this.extractQuery(command));
      } else       if (normalizedCommand.includes('store memory')) {
        const { key, data } = this.extractMemoryData(command);
        return await this.storeMemory(key, data);
      } else if (normalizedCommand.includes('retrieve memory')) {
        return await this.retrieveMemory(this.extractMemoryKey(command));
      } else if (normalizedCommand.includes('discover mcp tools') || normalizedCommand.includes('list mcp tools')) {
        return await this.discoverMCPTools();
      } else if (normalizedCommand.includes('execute agent') || normalizedCommand.includes('run agent')) {
        const { agentId, task } = this.extractAgentTask(command);
        return await this.executeAgent(agentId, task);
      } else if (normalizedCommand.includes('check agent status')) {
        return await this.checkAgentStatus(this.extractAgentId(command));
      } else if (normalizedCommand.includes('list llms')) {
        return await this.listAvailableLLMs();
      } else {
        throw new AIOSServiceError(`Unknown command: ${command}`);
      }
    } catch (error) {
      console.error('AIOSService: Command processing failed', error);
      throw new AIOSServiceError(`Failed to process command: ${(error as Error).message}`);
    }
  }

  /**
   * Runs an LLM query with the specified messages and configuration.
   * @param messages - Array of messages for the conversation.
   * @param llms - Optional specific LLMs to use.
   * @param tools - Optional tools to make available.
   * @returns Promise resolving to the LLM response.
   */
  public async runLLMQuery(
    messages: LLMMessage[],
    llms?: LLMModel[],
    tools?: any[]
  ): Promise<any> {
    try {
      if (!llms && this.selectedLLMs.length === 0) {
        throw new AIOSServiceError('No LLMs selected. Please select LLMs first or provide them explicitly.');
      }

      const queryData: LLMQueryData = {
        messages,
        tools,
        action_type: 'chat',
        message_return_type: 'text'
      };

      if (llms) {
        queryData.llms = llms;
      } else if (this.selectedLLMs.length > 0) {
        queryData.llms = this.selectedLLMs;
      }

      const request: QueryRequest = {
        agent_name: 'llm-agent',
        query_type: 'llm',
        query_data: queryData
      };

      const response = await this.client.post('/query', request);
      console.info('AIOSService: LLM query executed successfully');
      return response.data;
    } catch (error) {
      console.error('AIOSService: Failed to run LLM query', error);
      throw new AIOSServiceError(`Failed to run LLM query: ${(error as Error).message}`);
    }
  }

  /**
   * Stores data in the AIOS memory system.
   * @param key - Memory key for retrieval.
   * @param data - Data to store.
   * @param metadata - Optional metadata for the memory entry.
   * @returns Promise resolving to the storage result.
   */
  public async storeMemory(key: string, data: any, metadata?: any): Promise<any> {
    try {
      const queryData: MemoryQueryData = {
        params: {
          key,
          data,
          metadata
        },
        operation_type: 'store'
      };

      const request: QueryRequest = {
        agent_name: 'memory-agent',
        query_type: 'memory',
        query_data: queryData
      };

      const response = await this.client.post('/query', request);
      console.info(`AIOSService: Memory stored successfully for key: ${key}`);
      return response.data;
    } catch (error) {
      console.error('AIOSService: Failed to store memory', error);
      throw new AIOSServiceError(`Failed to store memory: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves data from the AIOS memory system.
   * @param key - Memory key to retrieve.
   * @param options - Optional retrieval options (e.g., similarity search).
   * @returns Promise resolving to the retrieved data.
   */
  public async retrieveMemory(key: string, options?: any): Promise<any> {
    try {
      const queryData: MemoryQueryData = {
        params: {
          key,
          options
        },
        operation_type: 'retrieve'
      };

      const request: QueryRequest = {
        agent_name: 'memory-agent',
        query_type: 'memory',
        query_data: queryData
      };

      const response = await this.client.post('/query', request);
      console.info(`AIOSService: Memory retrieved successfully for key: ${key}`);
      return response.data;
    } catch (error) {
      console.error('AIOSService: Failed to retrieve memory', error);
      throw new AIOSServiceError(`Failed to retrieve memory: ${(error as Error).message}`);
    }
  }

  /**
   * Discovers available MCP tools from the AIOS service.
   * @returns Promise resolving to the list of available MCP tools.
   */
  public async discoverMCPTools(): Promise<MCPTool[]> {
    try {
      const response = await this.client.get('/get/mcp/server');
      if (response.data.status !== 'success') {
        throw new AIOSServiceError('Failed to get MCP server path');
      }

      // For now, return the server path. In a full implementation,
      // this would connect to the MCP server and list tools.
      console.info('AIOSService: MCP server discovered successfully');
      return [{
        name: 'mcp-server',
        description: 'MCP Server for tool discovery and invocation',
        inputSchema: {
          type: 'object',
          properties: {
            server_path: { type: 'string' }
          }
        }
      }];
    } catch (error) {
      console.error('AIOSService: Failed to discover MCP tools', error);
      throw new AIOSServiceError(`Failed to discover MCP tools: ${(error as Error).message}`);
    }
  }

  /**
   * Executes an agent with the specified task.
   * @param agentId - Unique identifier for the agent.
   * @param task - The task description for the agent to execute.
   * @param config - Additional agent configuration.
   * @returns Promise resolving to the agent execution result.
   */
  public async executeAgent(
    agentId: string,
    task: string,
    config: any = {}
  ): Promise<any> {
    try {
      const agentConfig = {
        task,
        ...config
      };

      const request: AgentSubmitRequest = {
        agent_id: agentId,
        agent_config: agentConfig
      };

      const response = await this.client.post('/agents/submit', request);
      console.info(`AIOSService: Agent ${agentId} submitted for execution`);
      return response.data;
    } catch (error) {
      console.error('AIOSService: Failed to execute agent', error);
      throw new AIOSServiceError(`Failed to execute agent: ${(error as Error).message}`);
    }
  }

  /**
   * Checks the status of a running agent.
   * @param executionId - The execution ID returned from executeAgent.
   * @returns Promise resolving to the agent status.
   */
  public async checkAgentStatus(executionId: number): Promise<any> {
    try {
      const response = await this.client.get(`/agents/${executionId}/status`);
      console.info(`AIOSService: Agent status checked for execution ID: ${executionId}`);
      return response.data;
    } catch (error) {
      console.error('AIOSService: Failed to check agent status', error);
      throw new AIOSServiceError(`Failed to check agent status: ${(error as Error).message}`);
    }
  }

  /**
   * Lists all available LLMs configured in the AIOS service.
   * @returns Promise resolving to the list of available LLMs.
   */
  public async listAvailableLLMs(): Promise<LLMModel[]> {
    try {
      const response = await this.client.get('/core/llms/list');
      if (response.data.status !== 'success') {
        throw new AIOSServiceError('Failed to list LLMs');
      }
      console.info('AIOSService: Available LLMs listed successfully');
      return response.data.llms || [];
    } catch (error) {
      console.error('AIOSService: Failed to list LLMs', error);
      throw new AIOSServiceError(`Failed to list LLMs: ${(error as Error).message}`);
    }
  }

  /**
   * Selects LLMs to use for subsequent operations.
   * @param llms - Array of LLM configurations to select.
   * @returns Promise resolving when LLMs are selected.
   */
  public async selectLLMs(llms: LLMModel[]): Promise<void> {
    try {
      await this.client.post('/user/select/llms', llms);
      this.selectedLLMs = llms;
      console.info('AIOSService: LLMs selected successfully');
    } catch (error) {
      console.error('AIOSService: Failed to select LLMs', error);
      throw new AIOSServiceError(`Failed to select LLMs: ${(error as Error).message}`);
    }
  }

  /**
   * Gets the current status of the AIOS service.
   * @returns Promise resolving to the service status.
   */
  public async getServiceStatus(): Promise<any> {
    try {
      const response = await this.client.get('/status');
      return response.data;
    } catch (error) {
      console.error('AIOSService: Failed to get service status', error);
      throw new AIOSServiceError(`Failed to get service status: ${(error as Error).message}`);
    }
  }

  /**
   * Gets the health status of the AIOS service.
   * @returns Promise resolving to the health status.
   */
  public async getHealthStatus(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('AIOSService: Health check failed', error);
      throw new AIOSServiceError(`Health check failed: ${(error as Error).message}`);
    }
  }

  // Helper methods for extracting information from commands
  private extractQuery(command: string): LLMMessage[] {
    // Simple extraction - extract everything after "run llm query"
    const query = command.replace(/run llm query/i, '').trim();
    return [{
      role: 'user',
      content: query || 'Hello, how can I help you?'
    }];
  }

  private extractMemoryData(command: string): { key: string; data: any } {
    // Simple extraction - assume format: "store memory key value"
    const parts = command.split(' ').slice(2); // Remove "store memory"
    const key = parts[0] || 'default';
    const data = parts.slice(1).join(' ') || 'default data';
    return { key, data };
  }

  private extractMemoryKey(command: string): string {
    // Simple extraction - assume format: "retrieve memory key"
    const parts = command.split(' ').slice(2); // Remove "retrieve memory"
    return parts[0] || 'default';
  }

  private extractAgentTask(command: string): { agentId: string; task: string } {
    // Simple extraction - assume format: "execute agent task_description"
    const task = command.replace(/execute agent|run agent/i, '').trim();
    return {
      agentId: `agent-${Date.now()}`,
      task: task || 'Please perform a helpful task'
    };
  }

  private extractAgentId(command: string): number {
    // Simple extraction - assume format: "check agent status 123"
    const parts = command.split(' ');
    const id = parseInt(parts[parts.length - 1]);
    return isNaN(id) ? 1 : id;
  }
}

// Export default instance
export default new AIOSService();
