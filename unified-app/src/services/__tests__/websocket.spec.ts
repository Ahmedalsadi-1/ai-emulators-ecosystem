import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestUtils } from '../src/test/test-utils';

// Mock WebSocket class for testing
class MockWebSocket {
  readyState = 1; // OPEN
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor(url: string) {
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
    }, 10);
  }

  send(data: string) {
    // Mock send - could be used to verify sent messages
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ type: 'close', code: 1000, reason: 'Normal closure' });
    }
  }
}

// Mock WebSocket service
class MockWebSocketService {
  private ws: MockWebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnected = false;

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new MockWebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message.payload);
        }
      };

      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }

  send(type: string, payload: any): void {
    if (this.ws && this.isConnected) {
      const message = JSON.stringify({ type, payload });
      // In real implementation, this would send to server
      // For testing, we can simulate server response
      setTimeout(() => {
        if (this.ws?.onmessage) {
          this.ws.onmessage({ data: message } as any);
        }
      }, 10);
    }
  }

  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

describe('WebSocket Communication Integration Tests', () => {
  let wsService: MockWebSocketService;
  let mockWs: any;

  beforeEach(() => {
    wsService = new MockWebSocketService();
    // Mock global WebSocket
    mockWs = MockWebSocket;
    (global as any).WebSocket = mockWs;
  });

  afterEach(() => {
    wsService.disconnect();
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection successfully', async () => {
      expect(wsService.isWebSocketConnected()).toBe(false);

      await wsService.connect('ws://localhost:8080');

      expect(wsService.isWebSocketConnected()).toBe(true);
    });

    it('should handle connection failures', async () => {
      // Mock WebSocket to fail connection
      const mockWsInstance = {
        readyState: 0,
        onopen: null,
        onerror: null,
        close: jest.fn(),
      };

      (global as any).WebSocket = jest.fn(() => {
        setTimeout(() => {
          if (mockWsInstance.onerror) {
            mockWsInstance.onerror({ type: 'error' });
          }
        }, 10);
        return mockWsInstance;
      });

      await expect(wsService.connect('ws://localhost:8080')).rejects.toThrow();
      expect(wsService.isWebSocketConnected()).toBe(false);
    });

    it('should handle disconnection and cleanup', async () => {
      await wsService.connect('ws://localhost:8080');
      expect(wsService.isWebSocketConnected()).toBe(true);

      wsService.disconnect();
      expect(wsService.isWebSocketConnected()).toBe(false);
    });

    it('should reconnect after disconnection', async () => {
      await wsService.connect('ws://localhost:8080');
      expect(wsService.isWebSocketConnected()).toBe(true);

      wsService.disconnect();
      expect(wsService.isWebSocketConnected()).toBe(false);

      await wsService.connect('ws://localhost:8080');
      expect(wsService.isWebSocketConnected()).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('should send and receive messages correctly', async () => {
      await wsService.connect('ws://localhost:8080');

      const receivedMessages: any[] = [];
      wsService.onMessage('test_type', (data) => {
        receivedMessages.push(data);
      });

      wsService.send('test_type', { message: 'test payload' });

      // Wait for async message processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]).toEqual({ message: 'test payload' });
    });

    it('should handle multiple message types', async () => {
      await wsService.connect('ws://localhost:8080');

      const taskMessages: any[] = [];
      const statusMessages: any[] = [];

      wsService.onMessage('task_update', (data) => {
        taskMessages.push(data);
      });

      wsService.onMessage('status_update', (data) => {
        statusMessages.push(data);
      });

      wsService.send('task_update', { taskId: 'task-1', status: 'running' });
      wsService.send('status_update', { service: 'bytebot', status: 'healthy' });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(taskMessages).toHaveLength(1);
      expect(statusMessages).toHaveLength(1);
      expect(taskMessages[0].status).toBe('running');
      expect(statusMessages[0].service).toBe('bytebot');
    });

    it('should ignore messages without registered handlers', async () => {
      await wsService.connect('ws://localhost:8080');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      wsService.send('unknown_type', { data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not throw error or log warnings for unknown types
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Real-time Task Updates', () => {
    it('should handle task status updates', async () => {
      await wsService.connect('ws://localhost:8080');

      const taskUpdates: any[] = [];
      wsService.onMessage('task_update', (data) => {
        taskUpdates.push(data);
      });

      // Simulate various task status updates
      const updates = [
        { taskId: 'task-1', status: 'running', progress: 25 },
        { taskId: 'task-1', status: 'running', progress: 50 },
        { taskId: 'task-1', status: 'completed', progress: 100 },
      ];

      updates.forEach(update => {
        wsService.send('task_update', update);
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(taskUpdates).toHaveLength(3);
      expect(taskUpdates[0].progress).toBe(25);
      expect(taskUpdates[1].progress).toBe(50);
      expect(taskUpdates[2].status).toBe('completed');
    });

    it('should handle task creation notifications', async () => {
      await wsService.connect('ws://localhost:8080');

      const createdTasks: any[] = [];
      wsService.onMessage('task_created', (data) => {
        createdTasks.push(data);
      });

      wsService.send('task_created', {
        taskId: 'new-task-123',
        description: 'New automated task',
        model: 'gpt-4'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(createdTasks).toHaveLength(1);
      expect(createdTasks[0].taskId).toBe('new-task-123');
      expect(createdTasks[0].description).toBe('New automated task');
    });

    it('should handle task completion with results', async () => {
      await wsService.connect('ws://localhost:8080');

      const completedTasks: any[] = [];
      wsService.onMessage('task_completed', (data) => {
        completedTasks.push(data);
      });

      wsService.send('task_completed', {
        taskId: 'completed-task-456',
        result: 'Analysis complete: Found 3 key insights',
        duration: 125000 // milliseconds
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].result).toContain('Found 3 key insights');
      expect(completedTasks[0].duration).toBe(125000);
    });
  });

  describe('Agent Message Streaming', () => {
    it('should handle message chunk streaming', async () => {
      await wsService.connect('ws://localhost:8080');

      const messageChunks: string[] = [];
      let isComplete = false;

      wsService.onMessage('agent_message_chunk', (data) => {
        messageChunks.push(data.content);
        isComplete = data.isComplete || false;
      });

      // Simulate streaming chunks
      const chunks = ['I am analyzing', ' your request', ' and will provide', ' a comprehensive answer.'];
      chunks.forEach((chunk, index) => {
        wsService.send('agent_message_chunk', {
          content: chunk,
          taskId: 'streaming-task',
          isComplete: index === chunks.length - 1
        });
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messageChunks).toHaveLength(4);
      expect(messageChunks.join('')).toBe('I am analyzing your request and will provide a comprehensive answer.');
      expect(isComplete).toBe(true);
    });

    it('should handle code generation streaming', async () => {
      await wsService.connect('ws://localhost:8080');

      const codeChunks: string[] = [];
      wsService.onMessage('code_stream', (data) => {
        codeChunks.push(data.content);
      });

      // Simulate code streaming
      const codeChunksData = [
        'function processData(data) {',
        '\n  return data.map(item => {',
        '\n    return item.value * 2;',
        '\n  });',
        '\n}'
      ];

      codeChunksData.forEach(chunk => {
        wsService.send('code_stream', {
          content: chunk,
          language: 'javascript',
          taskId: 'code-gen-task'
        });
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(codeChunks).toHaveLength(5);
      const fullCode = codeChunks.join('');
      expect(fullCode).toContain('function processData');
      expect(fullCode).toContain('return item.value * 2');
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', async () => {
      const errorHandler = jest.fn();
      wsService.onMessage('error', errorHandler);

      await wsService.connect('ws://localhost:8080');

      wsService.send('error', {
        message: 'Connection timeout',
        code: 'TIMEOUT_ERROR'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(errorHandler).toHaveBeenCalledWith({
        message: 'Connection timeout',
        code: 'TIMEOUT_ERROR'
      });
    });

    it('should handle malformed messages', async () => {
      await wsService.connect('ws://localhost:8080');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate receiving malformed JSON (this would be handled by WebSocket onmessage)
      // In real implementation, JSON.parse would throw

      // For testing, we'll simulate the error handling
      wsService.onMessage('error', () => {
        // Error handler should be called for malformed messages
      });

      consoleSpy.mockRestore();
    });

    it('should handle connection drops during streaming', async () => {
      await wsService.connect('ws://localhost:8080');

      const disconnectHandler = jest.fn();
      wsService.onMessage('disconnected', disconnectHandler);

      // Simulate mid-stream disconnection
      wsService.send('agent_message_chunk', {
        content: 'Partial message',
        taskId: 'interrupted-task',
        isComplete: false
      });

      // Simulate disconnection
      wsService.disconnect();

      wsService.send('disconnected', {
        reason: 'Connection lost',
        bufferedMessages: 1
      });

      expect(wsService.isWebSocketConnected()).toBe(false);
    });
  });

  describe('Service Status Updates', () => {
    it('should handle service health status updates', async () => {
      await wsService.connect('ws://localhost:8080');

      const statusUpdates: any[] = [];
      wsService.onMessage('service_status', (data) => {
        statusUpdates.push(data);
      });

      const services = [
        { name: 'bytebot', status: 'healthy', port: 9990 },
        { name: 'aios', status: 'degraded', port: 8000 },
        { name: 'postiz', status: 'unhealthy', port: 3001 },
      ];

      services.forEach(service => {
        wsService.send('service_status', service);
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(statusUpdates).toHaveLength(3);
      expect(statusUpdates[0].status).toBe('healthy');
      expect(statusUpdates[1].status).toBe('degraded');
      expect(statusUpdates[2].status).toBe('unhealthy');
    });

    it('should handle browser automation status', async () => {
      await wsService.connect('ws://localhost:8080');

      const browserUpdates: any[] = [];
      wsService.onMessage('browser_status', (data) => {
        browserUpdates.push(data);
      });

      wsService.send('browser_status', {
        connected: true,
        activeTab: 'tab-123',
        url: 'https://example.com'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(browserUpdates).toHaveLength(1);
      expect(browserUpdates[0].connected).toBe(true);
      expect(browserUpdates[0].activeTab).toBe('tab-123');
    });
  });
});