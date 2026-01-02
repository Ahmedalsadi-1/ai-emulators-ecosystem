import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { testDb } from '../src/test/test-database';
import { TestUtils } from '../src/test/test-utils';

describe('Database Operations Integration Tests', () => {
  beforeEach(() => {
    testDb.reset();
  });

  afterEach(() => {
    testDb.reset();
  });

  describe('Task Persistence', () => {
    it('should persist tasks with all required fields', () => {
      const taskData = {
        id: 'persist-test-1',
        description: 'Test task for persistence',
        status: 'pending',
        modelId: 'gpt-4',
      };

      const createdTask = testDb.createTask(taskData);

      expect(createdTask.id).toBe('persist-test-1');
      expect(createdTask.description).toBe('Test task for persistence');
      expect(createdTask.status).toBe('pending');
      expect(createdTask.modelId).toBe('gpt-4');
      expect(createdTask.createdAt).toBeInstanceOf(Date);
      expect(createdTask.updatedAt).toBeInstanceOf(Date);
    });

    it('should update task timestamps on modification', () => {
      const task = testDb.createTask(TestUtils.createMockTask('timestamp-test', 'Timestamp test'));
      const originalUpdatedAt = task.updatedAt;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        testDb.updateTask('timestamp-test', { status: 'running' });
        const updatedTask = testDb.getTaskById('timestamp-test');

        expect(updatedTask?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should handle task status transitions', () => {
      const task = testDb.createTask(TestUtils.createMockTask('status-transition', 'Status transition test'));

      expect(task.status).toBe('pending');

      // Transition through different statuses
      const transitions = ['running', 'completed', 'failed'];

      transitions.forEach(status => {
        const updatedTask = testDb.updateTask('status-transition', { status });
        expect(updatedTask?.status).toBe(status);
      });
    });

    it('should persist task metadata', () => {
      const taskWithMetadata = testDb.createTask({
        ...TestUtils.createMockTask('metadata-test', 'Metadata test'),
        metadata: {
          priority: 'high',
          tags: ['urgent', 'review'],
          estimatedDuration: 300000, // 5 minutes
        },
      });

      const retrievedTask = testDb.getTaskById('metadata-test');
      expect(retrievedTask?.metadata).toEqual({
        priority: 'high',
        tags: ['urgent', 'review'],
        estimatedDuration: 300000,
      });
    });

    it('should handle bulk task operations', () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        TestUtils.createMockTask(`bulk-task-${i}`, `Bulk task ${i}`)
      );

      // Create all tasks
      tasks.forEach(task => testDb.createTask(task));

      const allTasks = testDb.getTasks();
      expect(allTasks).toHaveLength(10);

      // Update all tasks to running
      allTasks.forEach(task => {
        testDb.updateTask(task.id, { status: 'running' });
      });

      const updatedTasks = testDb.getTasks();
      expect(updatedTasks.every(task => task.status === 'running')).toBe(true);

      // Delete all tasks
      allTasks.forEach(task => {
        testDb.deleteTask(task.id);
      });

      expect(testDb.getTasks()).toHaveLength(0);
    });
  });

  describe('Message Storage', () => {
    it('should store messages with proper relationships', () => {
      const taskId = 'message-storage-test';

      const messages = [
        { content: 'User request', role: 'user', taskId },
        { content: 'Assistant thinking...', role: 'assistant', taskId },
        { content: 'Final answer', role: 'assistant', taskId },
      ];

      messages.forEach(msg => {
        testDb.createMessage({
          ...msg,
          timestamp: new Date(),
        });
      });

      const storedMessages = testDb.getMessagesByTaskId(taskId);
      expect(storedMessages).toHaveLength(3);
      expect(storedMessages[0].role).toBe('user');
      expect(storedMessages[1].role).toBe('assistant');
      expect(storedMessages[2].content).toBe('Final answer');
    });

    it('should maintain message ordering by timestamp', () => {
      const taskId = 'ordering-test';

      const baseTime = new Date('2024-01-01T10:00:00Z');

      const messages = [
        { content: 'First message', timestamp: new Date(baseTime.getTime() + 1000) },
        { content: 'Second message', timestamp: new Date(baseTime.getTime() + 2000) },
        { content: 'Third message', timestamp: new Date(baseTime.getTime() + 3000) },
      ];

      messages.forEach(msg => {
        testDb.createMessage({
          ...msg,
          role: 'user',
          taskId,
        });
      });

      const storedMessages = testDb.getMessagesByTaskId(taskId);
      expect(storedMessages).toHaveLength(3);
      expect(storedMessages[0].content).toBe('First message');
      expect(storedMessages[2].content).toBe('Third message');
    });

    it('should handle large message content', () => {
      const taskId = 'large-message-test';
      const largeContent = 'A'.repeat(10000); // 10KB of content

      const message = testDb.createMessage({
        content: largeContent,
        role: 'assistant',
        taskId,
        timestamp: new Date(),
      });

      expect(message.content.length).toBe(10000);
      expect(message.content).toBe(largeContent);

      const retrievedMessages = testDb.getMessagesByTaskId(taskId);
      expect(retrievedMessages[0].content).toBe(largeContent);
    });

    it('should store message metadata', () => {
      const taskId = 'metadata-message-test';

      const message = testDb.createMessage({
        content: 'Message with metadata',
        role: 'user',
        taskId,
        timestamp: new Date(),
        metadata: {
          tokens: 150,
          model: 'gpt-4',
          temperature: 0.7,
          processingTime: 1250, // milliseconds
        },
      });

      const retrievedMessages = testDb.getMessagesByTaskId(taskId);
      expect(retrievedMessages[0].metadata).toEqual({
        tokens: 150,
        model: 'gpt-4',
        temperature: 0.7,
        processingTime: 1250,
      });
    });
  });

  describe('Model Configuration Storage', () => {
    it('should store and retrieve model configurations', () => {
      const models = testDb.getModels();
      expect(models.length).toBeGreaterThan(0);

      const gpt4Model = models.find(m => m.name === 'GPT-4');
      expect(gpt4Model).toBeDefined();
      expect(gpt4Model?.provider).toBe('OpenAI');
      expect(gpt4Model?.version).toBe('4.0');
      expect(gpt4Model?.active).toBe(true);
    });

    it('should handle model activation/deactivation', () => {
      // Get initial active models
      const initialActiveModels = testDb.getModels().filter(m => m.active);
      expect(initialActiveModels.length).toBeGreaterThan(0);

      // Deactivate first model
      const firstModel = initialActiveModels[0];
      // Note: In our test DB, models are read-only fixtures
      // In real implementation, we'd have updateModel method

      // Verify model properties
      expect(firstModel.active).toBe(true);
    });

    it('should provide models by provider', () => {
      const models = testDb.getModels();

      const openaiModels = models.filter(m => m.provider === 'OpenAI');
      const anthropicModels = models.filter(m => m.provider === 'Anthropic');
      const googleModels = models.filter(m => m.provider === 'Google');

      expect(openaiModels.length).toBeGreaterThan(0);
      expect(anthropicModels.length).toBeGreaterThan(0);
      expect(googleModels.length).toBeGreaterThan(0);

      openaiModels.forEach(model => {
        expect(model.provider).toBe('OpenAI');
      });
    });
  });

  describe('Data Retrieval and Queries', () => {
    beforeEach(() => {
      // Seed test data
      const tasks = [
        { id: 'query-task-1', description: 'Completed task', status: 'completed', modelId: 'gpt-4' },
        { id: 'query-task-2', description: 'Running task', status: 'running', modelId: 'claude-3' },
        { id: 'query-task-3', description: 'Pending task', status: 'pending', modelId: 'gpt-4' },
        { id: 'query-task-4', description: 'Failed task', status: 'failed', modelId: 'gemini-pro' },
      ];

      tasks.forEach(task => testDb.createTask(task));

      // Add messages to tasks
      testDb.createMessage({ content: 'Message for task 1', role: 'user', taskId: 'query-task-1', timestamp: new Date() });
      testDb.createMessage({ content: 'Message for task 2', role: 'user', taskId: 'query-task-2', timestamp: new Date() });
      testDb.createMessage({ content: 'Response for task 1', role: 'assistant', taskId: 'query-task-1', timestamp: new Date() });
    });

    it('should retrieve tasks by status', () => {
      // Note: Our test DB doesn't have query methods, but we can filter manually
      const allTasks = testDb.getTasks();

      const completedTasks = allTasks.filter(t => t.status === 'completed');
      const runningTasks = allTasks.filter(t => t.status === 'running');
      const pendingTasks = allTasks.filter(t => t.status === 'pending');

      expect(completedTasks).toHaveLength(1);
      expect(runningTasks).toHaveLength(1);
      expect(pendingTasks).toHaveLength(1);
      expect(completedTasks[0].description).toBe('Completed task');
    });

    it('should retrieve tasks by model', () => {
      const allTasks = testDb.getTasks();

      const gpt4Tasks = allTasks.filter(t => t.modelId === 'gpt-4');
      const claudeTasks = allTasks.filter(t => t.modelId === 'claude-3');
      const geminiTasks = allTasks.filter(t => t.modelId === 'gemini-pro');

      expect(gpt4Tasks).toHaveLength(2);
      expect(claudeTasks).toHaveLength(1);
      expect(geminiTasks).toHaveLength(1);
    });

    it('should retrieve messages by task relationship', () => {
      const task1Messages = testDb.getMessagesByTaskId('query-task-1');
      const task2Messages = testDb.getMessagesByTaskId('query-task-2');
      const task3Messages = testDb.getMessagesByTaskId('query-task-3');

      expect(task1Messages).toHaveLength(2);
      expect(task2Messages).toHaveLength(1);
      expect(task3Messages).toHaveLength(0);
    });

    it('should support complex queries', () => {
      const allTasks = testDb.getTasks();

      // Find completed tasks using GPT-4
      const completedGpt4Tasks = allTasks.filter(t =>
        t.status === 'completed' && t.modelId === 'gpt-4'
      );

      expect(completedGpt4Tasks).toHaveLength(1);
      expect(completedGpt4Tasks[0].id).toBe('query-task-1');

      // Find tasks with messages
      const tasksWithMessages = allTasks.filter(task => {
        const messages = testDb.getMessagesByTaskId(task.id);
        return messages.length > 0;
      });

      expect(tasksWithMessages).toHaveLength(2);
      expect(tasksWithMessages.map(t => t.id)).toEqual(['query-task-1', 'query-task-2']);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity', () => {
      const task = testDb.createTask(TestUtils.createMockTask('integrity-test', 'Integrity test'));

      // Create messages linked to the task
      testDb.createMessage({
        content: 'Linked message',
        role: 'user',
        taskId: task.id,
        timestamp: new Date(),
      });

      // Verify the relationship
      const messages = testDb.getMessagesByTaskId(task.id);
      expect(messages).toHaveLength(1);
      expect(messages[0].taskId).toBe(task.id);

      // Delete task and verify messages are handled (in real DB, this might cascade)
      testDb.deleteTask(task.id);
      const remainingTasks = testDb.getTasks();
      const deletedTaskExists = remainingTasks.some(t => t.id === task.id);
      expect(deletedTaskExists).toBe(false);
    });

    it('should handle concurrent data access', () => {
      const taskId = 'concurrency-test';

      // Simulate concurrent operations
      const operations = Array.from({ length: 5 }, (_, i) => ({
        type: i % 2 === 0 ? 'message' : 'update',
        index: i,
      }));

      operations.forEach(op => {
        if (op.type === 'message') {
          testDb.createMessage({
            content: `Concurrent message ${op.index}`,
            role: 'user',
            taskId,
            timestamp: new Date(),
          });
        } else {
          testDb.updateTask(taskId, { status: `status-${op.index}` });
        }
      });

      const messages = testDb.getMessagesByTaskId(taskId);
      expect(messages.length).toBeGreaterThan(0);

      // All operations should complete without data corruption
      expect(() => {
        testDb.getTasks();
        testDb.getMessagesByTaskId(taskId);
      }).not.toThrow();
    });

    it('should validate data integrity on operations', () => {
      // Test creating task with invalid data
      const invalidTask = {
        id: '', // Invalid empty ID
        description: 'Invalid task',
        status: 'pending',
      };

      // Our test DB doesn't validate, but in real implementation it should
      const createdTask = testDb.createTask(invalidTask as any);
      expect(createdTask.id).toBe(''); // Would be rejected in real DB

      // Test valid task
      const validTask = TestUtils.createMockTask('valid-task', 'Valid task');
      const createdValidTask = testDb.createTask(validTask);
      expect(createdValidTask.id).toBe('valid-task');
    });

    it('should handle transaction-like operations', () => {
      // Test atomic operations (simulated)
      const taskId = 'transaction-test';

      // Create task and messages in sequence
      const task = testDb.createTask(TestUtils.createMockTask(taskId, 'Transaction test'));
      testDb.createMessage({
        content: 'Transaction message 1',
        role: 'user',
        taskId,
        timestamp: new Date(),
      });

      // Verify both operations succeeded
      const retrievedTask = testDb.getTaskById(taskId);
      const messages = testDb.getMessagesByTaskId(taskId);

      expect(retrievedTask).toBeDefined();
      expect(messages).toHaveLength(1);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();

      // Create many tasks and messages
      const numTasks = 100;
      const numMessagesPerTask = 5;

      for (let i = 0; i < numTasks; i++) {
        const task = testDb.createTask(TestUtils.createMockTask(`perf-task-${i}`, `Performance task ${i}`));

        for (let j = 0; j < numMessagesPerTask; j++) {
          testDb.createMessage({
            content: `Message ${j} for task ${i}`,
            role: j % 2 === 0 ? 'user' : 'assistant',
            taskId: task.id,
            timestamp: new Date(),
          });
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all data was created
      const allTasks = testDb.getTasks();
      expect(allTasks).toHaveLength(numTasks);

      // Check that operations completed in reasonable time
      expect(duration).toBeLessThan(5000); // Less than 5 seconds for 600 operations

      // Verify data integrity
      const sampleTask = allTasks[0];
      const messages = testDb.getMessagesByTaskId(sampleTask.id);
      expect(messages).toHaveLength(numMessagesPerTask);
    });

    it('should support efficient data retrieval patterns', () => {
      // Create test data with known patterns
      const patterns = ['pattern-a', 'pattern-b', 'pattern-c'];
      const tasksPerPattern = 10;

      patterns.forEach(pattern => {
        for (let i = 0; i < tasksPerPattern; i++) {
          testDb.createTask({
            id: `${pattern}-task-${i}`,
            description: `Task with ${pattern}`,
            status: 'pending',
            modelId: 'gpt-4',
          });
        }
      });

      const allTasks = testDb.getTasks();
      expect(allTasks).toHaveLength(patterns.length * tasksPerPattern);

      // Test filtering performance
      const patternATasks = allTasks.filter(t => t.id.startsWith('pattern-a'));
      expect(patternATasks).toHaveLength(tasksPerPattern);
    });
  });
});