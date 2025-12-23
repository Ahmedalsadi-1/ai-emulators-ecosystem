import axios from 'axios';
import { postizServiceCardProps } from '../components/PostizServiceCard';

// Custom error class for service-specific errors
class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Assuming TuriX is available globally - replace with actual import when available
declare const TuriX: any;

/**
 * PostizService integrates with the postiz-app service for social media scheduling and content management.
 * Provides capabilities for posting to multiple platforms, scheduling content, and viewing analytics.
 */
export class PostizService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'http://localhost:3001/api', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || '';
    if (!this.apiKey) {
      console.warn('PostizService: No API key provided. Ensure POSTIZ_API_KEY is set.');
    }
  }

  /**
   * Returns the service registration object for TuriX.
   * Call TuriX.registerService(this.getServiceRegistration()) to register.
   */
  public static getServiceRegistration() {
    return {
      name: 'postiz',
      capabilities: ['social-media-posting', 'content-scheduling', 'analytics'],
      ui: postizServiceCardProps,
      commands: [
        'post to twitter',
        'post to instagram',
        'post to linkedin',
        'schedule content',
        'view analytics',
        'cancel scheduled post'
      ]
    };
  }

  /**
   * Processes natural language commands for the Postiz service.
   * @param command - The natural language command to process.
   * @returns Promise resolving to the command result.
   */
  public async processCommand(command: string): Promise<any> {
    try {
      const normalizedCommand = command.toLowerCase().trim();

      if (normalizedCommand.includes('post to twitter')) {
        return await this.postToPlatform('twitter', this.extractContent(command));
      } else if (normalizedCommand.includes('post to instagram')) {
        return await this.postToPlatform('instagram', this.extractContent(command));
      } else if (normalizedCommand.includes('post to linkedin')) {
        return await this.postToPlatform('linkedin', this.extractContent(command));
      } else if (normalizedCommand.includes('schedule content')) {
        return await this.scheduleContent(this.extractContent(command), this.extractScheduleTime(command));
      } else if (normalizedCommand.includes('view analytics')) {
        return await this.getAnalytics();
      } else if (normalizedCommand.includes('cancel scheduled post')) {
        return await this.cancelScheduledPost(this.extractPostId(command));
      } else {
        throw new ServiceError(`Unknown command: ${command}`);
      }
    } catch (error) {
      console.error('PostizService: Command processing failed', error);
      throw new ServiceError(`Failed to process command: ${(error as Error).message}`);
    }
  }

  /**
   * Posts content to a specific social media platform immediately.
   * @param platform - The platform to post to (e.g., 'twitter', 'instagram').
   * @param content - The content to post.
   * @returns Promise resolving to the post result.
   */
  public async postToPlatform(platform: string, content: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/posts`, {
        platform,
        content,
        scheduled: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.info(`PostizService: Posted to ${platform} successfully`);
      return response.data;
    } catch (error) {
      console.error(`PostizService: Failed to post to ${platform}`, error);
      throw new ServiceError(`Failed to post to ${platform}: ${(error as Error).message}`);
    }
  }

  /**
   * Schedules content for posting at a future time.
   * @param content - The content to schedule.
   * @param scheduleTime - The ISO string for when to post.
   * @param platforms - Array of platforms to post to.
   * @returns Promise resolving to the scheduled post result.
   */
  public async scheduleContent(content: string, scheduleTime: string, platforms: string[] = ['twitter']): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/posts`, {
        content,
        platforms,
        scheduled: true,
        scheduleTime
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.info(`PostizService: Scheduled content for ${scheduleTime}`);
      return response.data;
    } catch (error) {
      console.error('PostizService: Failed to schedule content', error);
      throw new ServiceError(`Failed to schedule content: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves analytics data for posts.
   * @param postId - Optional specific post ID to get analytics for.
   * @returns Promise resolving to analytics data.
   */
  public async getAnalytics(postId?: string): Promise<any> {
    try {
      const url = postId ? `${this.baseUrl}/analytics/${postId}` : `${this.baseUrl}/analytics`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.info('PostizService: Retrieved analytics data');
      return response.data;
    } catch (error) {
      console.error('PostizService: Failed to get analytics', error);
      throw new ServiceError(`Failed to get analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Cancels a scheduled post.
   * @param postId - The ID of the post to cancel.
   * @returns Promise resolving to the cancellation result.
   */
  public async cancelScheduledPost(postId: string): Promise<any> {
    try {
      const response = await axios.delete(`${this.baseUrl}/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.info(`PostizService: Cancelled scheduled post ${postId}`);
      return response.data;
    } catch (error) {
      console.error(`PostizService: Failed to cancel post ${postId}`, error);
      throw new ServiceError(`Failed to cancel post ${postId}: ${(error as Error).message}`);
    }
  }

  // Helper methods for extracting information from commands
  private extractContent(command: string): string {
    // Simple extraction - in production, use NLP for better parsing
    const match = command.match(/(?:post|schedule)\s+(.+?)(?:\s+at\s+|to\s+|$)/i);
    return match ? match[1].trim() : '';
  }

  private extractScheduleTime(command: string): string {
    // Extract time - assume ISO format or parse natural language
    const match = command.match(/at\s+(.+)/i);
    if (match) {
      // Parse natural language time - placeholder
      return new Date(match[1]).toISOString();
    }
    // Default to 1 hour from now
    return new Date(Date.now() + 3600000).toISOString();
  }

  private extractPostId(command: string): string {
    const match = command.match(/post\s+(\w+)/i);
    return match ? match[1] : '';
  }
}



// Export default instance
export default new PostizService();