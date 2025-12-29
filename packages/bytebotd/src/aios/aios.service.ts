import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface AIOSStatus {
  status: string;
  message: string;
  components?: {
    llms: string;
    storage: string;
    memory: string;
    tool: string;
    scheduler: string;
    factory: string;
  };
}

export interface AIOSLLMConfig {
  name: string;
  provider: string;
  model?: string;
}

@Injectable()
export class AIOSService {
  private readonly logger = new Logger(AIOSService.name);
  private readonly httpClient: AxiosInstance;
  private isConnected = false;

  constructor() {
    this.httpClient = axios.create({
      baseURL: process.env.AIOS_BASE_URL || 'http://localhost:8000',
      timeout: 30000, // 30 seconds timeout
    });

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`AIOS API Error: ${error.message}`, error.stack);
        return Promise.reject(error);
      }
    );
  }

  async getStatus(): Promise<AIOSStatus> {
    try {
      const response = await this.httpClient.get('/status');
      this.isConnected = true;
      return response.data;
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(`Failed to connect to AIOS: ${error.message}`);
      return {
        status: 'disconnected',
        message: `Cannot connect to AIOS service: ${error.message}`,
      };
    }
  }

  async getCoreStatus(): Promise<any> {
    try {
      const response = await this.httpClient.get('/core/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get AIOS core status: ${error.message}`);
    }
  }

  async listLLMs(): Promise<AIOSLLMConfig[]> {
    try {
      const response = await this.httpClient.get('/core/llms/list');
      return response.data.llms || [];
    } catch (error) {
      throw new Error(`Failed to list AIOS LLMs: ${error.message}`);
    }
  }

  async selectLLMs(llms: AIOSLLMConfig[]): Promise<any> {
    try {
      const response = await this.httpClient.post('/user/select/llms', llms);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to select AIOS LLMs: ${error.message}`);
    }
  }

  async getSelectedLLMs(): Promise<AIOSLLMConfig[]> {
    try {
      const response = await this.httpClient.get('/user/selected/llms');
      return response.data.llms || [];
    } catch (error) {
      throw new Error(`Failed to get selected AIOS LLMs: ${error.message}`);
    }
  }

  async submitAgent(agentId: string, config: any): Promise<any> {
    try {
      const response = await this.httpClient.post('/agents/submit', {
        agent_id: agentId,
        agent_config: config,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to submit AIOS agent: ${error.message}`);
    }
  }

  async getAgentStatus(executionId: number): Promise<any> {
    try {
      const response = await this.httpClient.get(`/agents/${executionId}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get AIOS agent status: ${error.message}`);
    }
  }

  async listAgentProcesses(): Promise<any> {
    try {
      const response = await this.httpClient.get('/agents/ps');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list AIOS agent processes: ${error.message}`);
    }
  }

  async refreshConfiguration(): Promise<any> {
    try {
      const response = await this.httpClient.post('/core/refresh');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to refresh AIOS configuration: ${error.message}`);
    }
  }

  isServiceConnected(): boolean {
    return this.isConnected;
  }
}