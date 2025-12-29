import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface FactifAIStatus {
  status: string;
  message: string;
  version?: string;
  uptime?: number;
}

export interface FactifAIChatRequest {
  message: string;
  mode?: string;
  context?: any;
}

export interface FactifAIChatResponse {
  response: string;
  mode: string;
  timestamp: number;
}

@Injectable()
export class FactifAIService {
  private readonly logger = new Logger(FactifAIService.name);
  private readonly httpClient: AxiosInstance;
  private isConnected = false;

  constructor() {
    this.httpClient = axios.create({
      baseURL: process.env.FACTIF_AI_BASE_URL || 'http://localhost:3001',
      timeout: 60000, // 60 seconds timeout for AI operations
    });

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`Factif-AI API Error: ${error.message}`, error.stack);
        return Promise.reject(error);
      }
    );
  }

  async getStatus(): Promise<FactifAIStatus> {
    try {
      // Factif-AI doesn't have a dedicated status endpoint, so we'll check if the service is responding
      const response = await this.httpClient.get('/api/mode');
      this.isConnected = true;
      return {
        status: 'connected',
        message: 'Factif-AI service is responding',
        version: '1.0.0', // Could be retrieved from a version endpoint if available
      };
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(`Failed to connect to Factif-AI: ${error.message}`);
      return {
        status: 'disconnected',
        message: `Cannot connect to Factif-AI service: ${error.message}`,
      };
    }
  }

  async getAvailableModes(): Promise<any> {
    try {
      const response = await this.httpClient.get('/api/mode');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Factif-AI modes: ${error.message}`);
    }
  }

  async setMode(mode: string): Promise<any> {
    try {
      const response = await this.httpClient.post('/api/mode', { mode });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to set Factif-AI mode: ${error.message}`);
    }
  }

  async sendChatMessage(message: string, mode?: string, context?: any): Promise<FactifAIChatResponse> {
    try {
      const payload: any = { message };
      if (mode) payload.mode = mode;
      if (context) payload.context = context;

      const response = await this.httpClient.post('/api/chat', payload);
      return {
        response: response.data.response || response.data.message,
        mode: response.data.mode || mode || 'default',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to send chat message to Factif-AI: ${error.message}`);
    }
  }

  async exploreAction(action: any): Promise<any> {
    try {
      const response = await this.httpClient.post('/api/explore/action', action);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute explore action in Factif-AI: ${error.message}`);
    }
  }

  async getChatHistory(): Promise<any> {
    try {
      const response = await this.httpClient.get('/api/history');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get chat history from Factif-AI: ${error.message}`);
    }
  }

  async clearChatHistory(): Promise<any> {
    try {
      const response = await this.httpClient.delete('/api/history');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to clear chat history in Factif-AI: ${error.message}`);
    }
  }

  async executeAction(action: any): Promise<any> {
    try {
      const response = await this.httpClient.post('/api/actions/execute', action);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute action in Factif-AI: ${error.message}`);
    }
  }

  async getFileSystemInfo(path?: string): Promise<any> {
    try {
      const url = path ? `/api/filesystem?path=${encodeURIComponent(path)}` : '/api/filesystem';
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get filesystem info from Factif-AI: ${error.message}`);
    }
  }



  isServiceConnected(): boolean {
    return this.isConnected;
  }
}