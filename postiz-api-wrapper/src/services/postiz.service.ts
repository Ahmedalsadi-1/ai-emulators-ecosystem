import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';
import { CreatePostDto, UpdatePostDto, PostResponseDto } from '../dto/post.dto';
import { AnalyticsQueryDto, AnalyticsResponseDto } from '../dto/analytics.dto';
import { IntegrationDto, ConnectIntegrationDto } from '../dto/integration.dto';

export class PostizService {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.postizApiUrl,
      timeout: config.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        logger.error('API request failed', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  async authenticate(): Promise<void> {
    try {
      if (config.postizUsername && config.postizPassword) {
        const response = await this.client.post('/auth/login', {
          username: config.postizUsername,
          password: config.postizPassword,
        });
        this.authToken = response.data.token;
        logger.info('Successfully authenticated with Postiz');
      } else if (config.postizApiKey) {
        // Use API key authentication
        this.authToken = config.postizApiKey;
        logger.info('Using API key authentication with Postiz');
      } else {
        throw new Error('No authentication credentials provided');
      }
    } catch (error) {
      logger.error('Failed to authenticate with Postiz', error);
      throw new Error('Authentication failed');
    }
  }

  // Posts API methods
  async createPost(postData: CreatePostDto): Promise<PostResponseDto> {
    try {
      const response = await this.client.post('/posts', postData);
      return response.data;
    } catch (error) {
      logger.error('Failed to create post', error);
      throw error;
    }
  }

  async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    platform?: string;
  }): Promise<{ posts: PostResponseDto[]; pagination: any }> {
    try {
      const response = await this.client.get('/posts', { params });
      return response.data;
    } catch (error) {
      logger.error('Failed to get posts', error);
      throw error;
    }
  }

  async getPost(id: string): Promise<PostResponseDto> {
    try {
      const response = await this.client.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get post ${id}`, error);
      throw error;
    }
  }

  async updatePost(id: string, updateData: UpdatePostDto): Promise<PostResponseDto> {
    try {
      const response = await this.client.put(`/posts/${id}`, updateData);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update post ${id}`, error);
      throw error;
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      await this.client.delete(`/posts/${id}`);
    } catch (error) {
      logger.error(`Failed to delete post ${id}`, error);
      throw error;
    }
  }

  // Analytics API methods
  async getAnalytics(query: AnalyticsQueryDto): Promise<AnalyticsResponseDto[]> {
    try {
      const response = await this.client.get('/analytics', { params: query });
      return response.data;
    } catch (error) {
      logger.error('Failed to get analytics', error);
      throw error;
    }
  }

  async getPostAnalytics(postId: string): Promise<any> {
    try {
      const response = await this.client.get(`/posts/${postId}/analytics`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get analytics for post ${postId}`, error);
      throw error;
    }
  }

  // Integrations API methods
  async getIntegrations(): Promise<IntegrationDto[]> {
    try {
      const response = await this.client.get('/integrations/list');
      return response.data.integrations;
    } catch (error) {
      logger.error('Failed to get integrations', error);
      throw error;
    }
  }

  async connectIntegration(connectData: ConnectIntegrationDto): Promise<IntegrationDto> {
    try {
      const response = await this.client.post(`/integrations/social/${connectData.platform}/connect`, connectData);
      return response.data;
    } catch (error) {
      logger.error(`Failed to connect ${connectData.platform} integration`, error);
      throw error;
    }
  }

  async disconnectIntegration(integrationId: string): Promise<void> {
    try {
      await this.client.delete('/integrations', { data: { id: integrationId } });
    } catch (error) {
      logger.error(`Failed to disconnect integration ${integrationId}`, error);
      throw error;
    }
  }

  // Content generation methods
  async generateContent(params: {
    topic: string;
    tone?: string;
    length?: string;
    platforms?: string[];
  }): Promise<any> {
    try {
      const response = await this.client.post('/posts/generator', params);
      return response.data;
    } catch (error) {
      logger.error('Failed to generate content', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkSchedule(posts: CreatePostDto[]): Promise<any> {
    try {
      const response = await this.client.post('/posts/bulk', { posts });
      return response.data;
    } catch (error) {
      logger.error('Failed to bulk schedule posts', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Health check failed', error);
      throw error;
    }
  }
}

export const postizService = new PostizService();