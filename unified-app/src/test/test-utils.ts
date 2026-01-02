// Base test utilities for unified app
export class TestUtils {
  static createMockTask(id: string = 'test-task', description: string = 'Test task') {
    return {
      id,
      description,
      status: 'pending',
      model: 'gpt-4',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static createMockMessage(taskId: string, content: string, role: 'user' | 'assistant' = 'user') {
    return {
      id: `msg-${Date.now()}`,
      taskId,
      content,
      role,
      timestamp: new Date(),
    };
  }

  static createMockModel(name: string, provider: string = 'openai') {
    return {
      id: `model-${name}`,
      name,
      provider,
      version: '1.0',
      isActive: true,
    };
  }

  static mockApiResponse(data: any, status = 200) {
    return {
      data,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
    };
  }

  static mockWebSocketMessage(type: string, payload: any) {
    return {
      type,
      payload,
      timestamp: new Date(),
    };
  }

  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

// Test data fixtures
export const TestFixtures = {
  tasks: [
    TestUtils.createMockTask('task-1', 'Analyze quarterly sales data'),
    TestUtils.createMockTask('task-2', 'Generate monthly report'),
    TestUtils.createMockTask('task-3', 'Process customer feedback'),
  ],

  models: [
    TestUtils.createMockModel('gpt-4', 'openai'),
    TestUtils.createMockModel('claude-3', 'anthropic'),
    TestUtils.createMockModel('gemini-pro', 'google'),
  ],

  messages: [
    TestUtils.createMockMessage('task-1', 'Please analyze the sales data', 'user'),
    TestUtils.createMockMessage('task-1', 'I have analyzed the data and found...', 'assistant'),
  ],
};

// Mock service responses
export const MockResponses = {
  taskCreated: TestUtils.mockApiResponse({ success: true, taskId: 'task-123' }),
  taskList: TestUtils.mockApiResponse(TestFixtures.tasks),
  modelList: TestUtils.mockApiResponse(TestFixtures.models),
  websocketConnected: TestUtils.mockWebSocketMessage('connection', { status: 'connected' }),
  taskUpdated: TestUtils.mockWebSocketMessage('task_update', {
    taskId: 'task-1',
    status: 'completed'
  }),
};