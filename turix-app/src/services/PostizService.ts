// Postiz Service Integration for TuriX
import ServiceRegistry from '../services/ServiceRegistry';

const PostizService = {
  name: 'postiz',
  displayName: 'Postiz',
  description: 'Social media scheduling and content management platform',
  capabilities: ['social-media-posting', 'content-scheduling', 'analytics'],
  actions: ['Post Now', 'Schedule Post', 'View Analytics', 'Cancel Post'],
  commands: [
    'post to twitter',
    'post to instagram',
    'post to linkedin',
    'schedule post',
    'view analytics',
    'cancel post',
    'create content'
  ],
  endpoint: 'http://localhost:3001/api',
  mcpPort: 3002,

  // Service-specific UI component
  ui: null,

  // Initialize the service
  init: () => {
    ServiceRegistry.getInstance().registerService(PostizService);
  },

  // Process Postiz-specific commands
  processCommand: async (command: string, params: any) => {
    try {
      const response = await fetch(`${PostizService.endpoint}/process`, {
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
        throw new Error(`Postiz API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Postiz command failed:', error);
      throw new Error('Postiz service unavailable');
    }
  },

  // Post content immediately
  postContent: async (platform: string, content: string, mediaUrls?: string[]) => {
    try {
      const response = await fetch(`${PostizService.endpoint}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          content,
          mediaUrls,
          scheduled: false
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to post content:', error);
      throw error;
    }
  },

  // Schedule content for future posting
  scheduleContent: async (platform: string, content: string, scheduledTime: string, mediaUrls?: string[]) => {
    try {
      const response = await fetch(`${PostizService.endpoint}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          content,
          mediaUrls,
          scheduled: true,
          scheduledTime
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to schedule content:', error);
      throw error;
    }
  },

  // Get analytics for posts
  getAnalytics: async (postId?: string) => {
    try {
      const url = postId
        ? `${PostizService.endpoint}/analytics/${postId}`
        : `${PostizService.endpoint}/analytics`;

      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  },

  // Cancel scheduled post
  cancelPost: async (postId: string) => {
    try {
      const response = await fetch(`${PostizService.endpoint}/posts/${postId}`, {
        method: 'DELETE'
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to cancel post:', error);
      throw error;
    }
  },

  // Get available tools via MCP
  getTools: async () => {
    try {
      const response = await fetch(`http://localhost:${PostizService.mcpPort}/tools`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get Postiz tools:', error);
      return [];
    }
  },

  // Invoke specific tool
  invokeTool: async (toolName: string, params: any) => {
    try {
      const response = await fetch(`http://localhost:${PostizService.mcpPort}/tools/${toolName}/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      return await response.json();
    } catch (error) {
      console.error(`Failed to invoke Postiz tool ${toolName}:`, error);
      throw error;
    }
  }
};

export default PostizService;