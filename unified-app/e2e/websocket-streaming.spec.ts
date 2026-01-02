import { test, expect } from '@playwright/test';

test.describe('WebSocket Streaming E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure WebSocket connection is established
    await page.waitForSelector('[data-testid="websocket-connected"]');
  });

  test('should establish WebSocket connection on app load', async ({ page }) => {
    // Check connection indicator
    await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');

    // Check that connection is maintained
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');
  });

  test('should receive real-time task status updates', async ({ page }) => {
    // Navigate to desktop screen and create a task
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');

    const taskDescription = 'WebSocket status test task';
    await page.fill('[data-testid="task-input"]', taskDescription);
    await page.click('[data-testid="create-task-btn"]');

    const taskItem = page.locator(`[data-testid="task-item"]:has-text("${taskDescription}")`);
    await expect(taskItem).toBeVisible();

    // Wait for initial pending status
    await expect(taskItem.locator('[data-testid="task-status"]')).toContainText('pending');

    // Simulate WebSocket message for task starting
    await page.evaluate(() => {
      // Mock WebSocket message
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'task_update',
          payload: {
            taskId: 'test-task-id',
            status: 'running',
            progress: 10,
            message: 'Task started'
          }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify status update
    await expect(taskItem.locator('[data-testid="task-status"]')).toContainText('running');
    await expect(taskItem.locator('[data-testid="task-progress"]')).toContainText('10%');
  });

  test('should stream messages to Code tab in real-time', async ({ page }) => {
    // Navigate to Code screen
    await page.click('[data-testid="screen-code"]');
    await page.waitForSelector('[data-testid="code-screen"]');

    // Check that code editor is ready
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();

    // Simulate WebSocket message with code content
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'code_stream',
          payload: {
            content: 'function analyzeData(data) {\n  return data.map(item => item.value);\n}',
            language: 'javascript',
            taskId: 'code-task-1'
          }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify code appears in editor
    await expect(page.locator('[data-testid="code-editor"]')).toContainText('function analyzeData');
    await expect(page.locator('[data-testid="code-editor"]')).toContainText('return data.map');
  });

  test('should stream messages to Agent tab in real-time', async ({ page }) => {
    // Navigate to Agent screen
    await page.click('[data-testid="screen-agent"]');
    await page.waitForSelector('[data-testid="agent-screen"]');

    // Check that agent chat is ready
    await expect(page.locator('[data-testid="agent-chat"]')).toBeVisible();

    // Simulate WebSocket message with agent response
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'agent_message',
          payload: {
            content: 'I have analyzed the data and found some interesting patterns.',
            role: 'assistant',
            taskId: 'agent-task-1',
            timestamp: new Date().toISOString()
          }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify message appears in chat
    await expect(page.locator('[data-testid="agent-chat-messages"]')).toContainText('analyzed the data');
    await expect(page.locator('[data-testid="agent-chat-messages"]')).toContainText('interesting patterns');
  });

  test('should handle streaming message chunks correctly', async ({ page }) => {
    // Navigate to Agent screen
    await page.click('[data-testid="screen-agent"]');
    await page.waitForSelector('[data-testid="agent-screen"]');

    // Simulate chunked message streaming
    const messageChunks = [
      'I am analyzing',
      ' your request',
      ' and will provide',
      ' a comprehensive answer.'
    ];

    for (const chunk of messageChunks) {
      await page.evaluate((chunk) => {
        const wsEvent = new CustomEvent('websocket-message', {
          detail: {
            type: 'agent_message_chunk',
            payload: {
              content: chunk,
              taskId: 'streaming-task-1',
              isComplete: false
            }
          }
        });
        window.dispatchEvent(wsEvent);
      }, chunk);

      // Small delay to simulate real streaming
      await page.waitForTimeout(100);
    }

    // Send completion chunk
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'agent_message_chunk',
          payload: {
            content: '',
            taskId: 'streaming-task-1',
            isComplete: true
          }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify complete message
    const fullMessage = messageChunks.join('');
    await expect(page.locator('[data-testid="agent-chat-messages"]')).toContainText(fullMessage);
  });

  test('should handle WebSocket reconnection', async ({ page }) => {
    // Check initial connection
    await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');

    // Simulate disconnection
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'connection',
          payload: { status: 'disconnected' }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify disconnected state
    await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Disconnected');

    // Simulate reconnection
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'connection',
          payload: { status: 'connected' }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify reconnected state
    await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');
  });

  test('should handle WebSocket errors gracefully', async ({ page }) => {
    // Simulate WebSocket error
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'error',
          payload: {
            message: 'Connection failed',
            code: 'CONNECTION_ERROR'
          }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify error is displayed
    await expect(page.locator('[data-testid="websocket-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="websocket-error"]')).toContainText('Connection failed');

    // Verify app continues to function
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');
    await expect(page.locator('[data-testid="task-input"]')).toBeVisible();
  });

  test('should handle multiple concurrent WebSocket streams', async ({ page }) => {
    // Navigate to a screen that can handle multiple streams
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');

    // Create multiple tasks
    const tasks = ['Task 1', 'Task 2', 'Task 3'];
    for (const taskDesc of tasks) {
      await page.fill('[data-testid="task-input"]', taskDesc);
      await page.click('[data-testid="create-task-btn"]');
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${taskDesc}")`);
    }

    // Simulate concurrent updates for different tasks
    await page.evaluate(() => {
      const updates = [
        { taskId: 'task-1', status: 'running', progress: 25 },
        { taskId: 'task-2', status: 'running', progress: 50 },
        { taskId: 'task-3', status: 'completed', progress: 100 }
      ];

      updates.forEach(update => {
        const wsEvent = new CustomEvent('websocket-message', {
          detail: {
            type: 'task_update',
            payload: update
          }
        });
        window.dispatchEvent(wsEvent);
      });
    });

    // Verify all tasks show correct status
    await expect(page.locator('[data-testid="task-item"]').nth(0).locator('[data-testid="task-status"]')).toContainText('running');
    await expect(page.locator('[data-testid="task-item"]').nth(1).locator('[data-testid="task-status"]')).toContainText('running');
    await expect(page.locator('[data-testid="task-item"]').nth(2).locator('[data-testid="task-status"]')).toContainText('completed');

    // Verify progress indicators
    await expect(page.locator('[data-testid="task-item"]').nth(0).locator('[data-testid="task-progress"]')).toContainText('25%');
    await expect(page.locator('[data-testid="task-item"]').nth(1).locator('[data-testid="task-progress"]')).toContainText('50%');
    await expect(page.locator('[data-testid="task-item"]').nth(2).locator('[data-testid="task-progress"]')).toContainText('100%');
  });

  test('should maintain message order in streaming', async ({ page }) => {
    // Navigate to Agent screen
    await page.click('[data-testid="screen-agent"]');
    await page.waitForSelector('[data-testid="agent-screen"]');

    // Simulate out-of-order message chunks (real WebSocket might deliver out of order)
    const messages = [
      { id: 1, content: 'First message', order: 1 },
      { id: 3, content: 'Third message', order: 3 },
      { id: 2, content: 'Second message', order: 2 }
    ];

    for (const msg of messages) {
      await page.evaluate((msg) => {
        const wsEvent = new CustomEvent('websocket-message', {
          detail: {
            type: 'ordered_message',
            payload: msg
          }
        });
        window.dispatchEvent(wsEvent);
      }, msg);

      await page.waitForTimeout(50);
    }

    // Verify messages appear in correct order
    const chatMessages = page.locator('[data-testid="agent-chat-messages"] [data-testid="chat-message"]');
    await expect(chatMessages.nth(0)).toContainText('First message');
    await expect(chatMessages.nth(1)).toContainText('Second message');
    await expect(chatMessages.nth(2)).toContainText('Third message');
  });

  test('should handle WebSocket message buffering during disconnection', async ({ page }) => {
    // Navigate to Agent screen
    await page.click('[data-testid="screen-agent"]');
    await page.waitForSelector('[data-testid="agent-screen"]');

    // Simulate disconnection
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'connection',
          payload: { status: 'disconnected' }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Send messages while disconnected (should be buffered)
    await page.evaluate(() => {
      const messages = [
        { content: 'Buffered message 1', id: 'buffered-1' },
        { content: 'Buffered message 2', id: 'buffered-2' }
      ];

      messages.forEach(msg => {
        const wsEvent = new CustomEvent('websocket-message', {
          detail: {
            type: 'buffered_message',
            payload: msg
          }
        });
        window.dispatchEvent(wsEvent);
      });
    });

    // Simulate reconnection
    await page.evaluate(() => {
      const wsEvent = new CustomEvent('websocket-message', {
        detail: {
          type: 'connection',
          payload: { status: 'connected', bufferedMessages: 2 }
        }
      });
      window.dispatchEvent(wsEvent);
    });

    // Verify buffered messages are processed
    await expect(page.locator('[data-testid="agent-chat-messages"]')).toContainText('Buffered message 1');
    await expect(page.locator('[data-testid="agent-chat-messages"]')).toContainText('Buffered message 2');
  });
});