import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { testDb } from '../src/test/test-database';
import { TestUtils } from '../src/test/test-utils';

describe('Unified App Services Integration Tests', () => {
  beforeEach(() => {
    testDb.reset();
  });

  afterEach(() => {
    testDb.reset();
  });

  describe('Task Management Integration', () => {
    it('should create and retrieve tasks', () => {
      const taskData = TestUtils.createMockTask('integration-task', 'Integration test task');

      const createdTask = testDb.createTask(taskData);
      expect(createdTask.id).toBe('integration-task');
      expect(createdTask.description).toBe('Integration test task');

      const retrievedTask = testDb.getTaskById('integration-task');
      expect(retrievedTask).toEqual(createdTask);
    });

    it('should handle task status updates', () => {
      const task = testDb.createTask(TestUtils.createMockTask('status-test', 'Status test'));
      expect(task.status).toBe('pending');

      const updatedTask = testDb.updateTask('status-test', { status: 'running' });
      expect(updatedTask.status).toBe('running');
      expect(updatedTask.updatedAt).not.toBe(task.updatedAt);
    });

    it('should list all tasks', () => {
      const tasks = [
        TestUtils.createMockTask('task-1', 'First task'),
        TestUtils.createMockTask('task-2', 'Second task'),
        TestUtils.createMockTask('task-3', 'Third task'),
      ];

      tasks.forEach(task => testDb.createTask(task));

      const allTasks = testDb.getTasks();
      expect(allTasks).toHaveLength(3);
      expect(allTasks.map(t => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('should delete tasks', () => {
      testDb.createTask(TestUtils.createMockTask('delete-me', 'Task to delete'));

      expect(testDb.getTasks()).toHaveLength(1);

      const deleted = testDb.deleteTask('delete-me');
      expect(deleted).toBe(true);

      expect(testDb.getTasks()).toHaveLength(0);
      expect(testDb.getTaskById('delete-me')).toBeNull();
    });
  });

  describe('Model Management Integration', () => {
    it('should provide available models', () => {
      const models = testDb.getModels();
      expect(models.length).toBeGreaterThan(0);

      const gpt4Model = models.find(m => m.name === 'GPT-4');
      expect(gpt4Model).toBeDefined();
      expect(gpt4Model?.provider).toBe('OpenAI');
    });

    it('should retrieve specific models', () => {
      const gpt4Model = testDb.getModelById('gpt-4');
      expect(gpt4Model).toBeDefined();
      expect(gpt4Model?.name).toBe('GPT-4');

      const nonExistentModel = testDb.getModelById('non-existent');
      expect(nonExistentModel).toBeUndefined();
    });
  });

  describe('Message Management Integration', () => {
    it('should store and retrieve messages by task', () => {
      const taskId = 'message-test-task';

      const messages = [
        TestUtils.createMockMessage(taskId, 'User message 1', 'user'),
        TestUtils.createMockMessage(taskId, 'Assistant response 1', 'assistant'),
        TestUtils.createMockMessage(taskId, 'User message 2', 'user'),
      ];

      messages.forEach(msg => testDb.createMessage(msg));

      const retrievedMessages = testDb.getMessagesByTaskId(taskId);
      expect(retrievedMessages).toHaveLength(3);
      expect(retrievedMessages[0].content).toBe('User message 1');
      expect(retrievedMessages[1].role).toBe('assistant');
    });

    it('should handle empty message lists', () => {
      const messages = testDb.getMessagesByTaskId('non-existent-task');
      expect(messages).toHaveLength(0);
    });
  });

  describe('Service Management Integration', () => {
    it('should track service status', () => {
      const services = testDb.getServices();
      expect(services.length).toBeGreaterThan(0);

      const bytebotService = services.find(s => s.id === 'bytebot');
      expect(bytebotService).toBeDefined();
      expect(bytebotService?.status).toBe('running');
    });

    it('should update service status', () => {
      const updatedService = testDb.updateServiceStatus('bytebot', 'stopped');
      expect(updatedService.status).toBe('stopped');

      const retrievedService = testDb.getServiceById('bytebot');
      expect(retrievedService?.status).toBe('stopped');
    });

    it('should handle invalid service updates', () => {
      const result = testDb.updateServiceStatus('non-existent', 'running');
      expect(result).toBeNull();
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle task with messages and model', () => {
      // Create a task
      const task = testDb.createTask({
        ...TestUtils.createMockTask('complex-task', 'Complex integration task'),
        modelId: 'gpt-4',
      });

      // Add messages to the task
      testDb.createMessage(TestUtils.createMockMessage(task.id, 'Process this data', 'user'));
      testDb.createMessage(TestUtils.createMockMessage(task.id, 'I will analyze the data', 'assistant'));

      // Verify model exists
      const model = testDb.getModelById(task.modelId);
      expect(model).toBeDefined();

      // Verify messages are linked to task
      const messages = testDb.getMessagesByTaskId(task.id);
      expect(messages).toHaveLength(2);

      // Update task status
      testDb.updateTask(task.id, { status: 'completed' });
      const updatedTask = testDb.getTaskById(task.id);
      expect(updatedTask?.status).toBe('completed');
    });

    it('should handle concurrent operations', () => {
      // Simulate concurrent task creation
      const taskPromises = Array.from({ length: 5 }, (_, i) =>
        Promise.resolve(testDb.createTask(TestUtils.createMockTask(`concurrent-${i}`, `Task ${i}`)))
      );

      return Promise.all(taskPromises).then(() => {
        const allTasks = testDb.getTasks();
        expect(allTasks).toHaveLength(5);
        expect(allTasks.every(task => task.id.startsWith('concurrent-'))).toBe(true);
      });
    });

    it('should maintain data consistency across operations', () => {
      // Create task
      const task = testDb.createTask(TestUtils.createMockTask('consistency-test', 'Consistency test'));

      // Add messages
      testDb.createMessage(TestUtils.createMockMessage(task.id, 'Message 1'));
      testDb.createMessage(TestUtils.createMockMessage(task.id, 'Message 2'));

      // Update task
      testDb.updateTask(task.id, { status: 'running' });

      // Verify everything is consistent
      const retrievedTask = testDb.getTaskById(task.id);
      const messages = testDb.getMessagesByTaskId(task.id);

      expect(retrievedTask?.status).toBe('running');
      expect(messages).toHaveLength(2);
      expect(messages[0].taskId).toBe(task.id);
      expect(messages[1].taskId).toBe(task.id);
    });
  });
});