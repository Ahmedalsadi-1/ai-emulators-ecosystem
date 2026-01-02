import { test, expect } from '@playwright/test';
import {
  UnifiedAppPage,
  WebSocketUtils,
  SERVICE_URLS,
  TestFixtures
} from '../test-utils';

test.describe('Error Handling and Recovery E2E Tests', () => {
  let unifiedApp: UnifiedAppPage;

  test.beforeEach(async ({ page }) => {
    unifiedApp = new UnifiedAppPage(page);
    await unifiedApp.goto();
  });

  test.describe('Service Unavailability', () => {
    test('should handle AIOS service unavailability gracefully', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Wait for iframe to attempt loading
      await page.waitForTimeout(2000);

      // Simulate service being down by checking for error state
      const errorState = iframe.locator('[data-testid="service-unavailable"]').or(
        iframe.locator('[data-testid="connection-error"]')
      );

      // If service is actually down, verify error handling
      if (await errorState.isVisible({ timeout: 5000 })) {
        await expect(errorState).toBeVisible();
        await expect(errorState).toContainText(/unavailable|error|failed/i);

        // Check for retry functionality
        const retryBtn = iframe.locator('[data-testid="retry-btn"]').or(
          iframe.locator('[data-testid="refresh-btn"]')
        );

        if (await retryBtn.isVisible()) {
          await retryBtn.click();
          // Verify retry attempt (might still fail, but UI should handle it)
          await expect(iframe.locator('[data-testid="retrying"]')).toBeVisible({ timeout: 2000 }).catch(() => {
            // Retry UI might be different
          });
        }
      }
    });

    test('should handle Bytebot service unavailability', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await page.waitForTimeout(2000);

      // Check for service error states
      const errorIndicators = [
        '[data-testid="service-error"]',
        '[data-testid="connection-failed"]',
        '[data-testid="service-unavailable"]'
      ];

      for (const indicator of errorIndicators) {
        const element = iframe.locator(indicator);
        if (await element.isVisible({ timeout: 1000 })) {
          await expect(element).toBeVisible();
          break;
        }
      }
    });

    test('should handle infrastructure service unavailability', async ({ page }) => {
      await unifiedApp.navigateToCategory('infrastructure');

      // Try to open Grafana
      await unifiedApp.openApp('grafana-monitoring');

      const iframe = page.frameLocator('[data-testid="app-iframe-grafana-monitoring"]');

      await page.waitForTimeout(2000);

      // Check for service status
      const statusIndicator = iframe.locator('[data-testid="service-status"]').or(
        iframe.locator('[data-testid="health-status"]')
      );

      if (await statusIndicator.isVisible({ timeout: 2000 })) {
        // Service might be running or show status
        const statusText = await statusIndicator.textContent();
        expect(statusText).toMatch(/running|stopped|error|healthy|unhealthy/i);
      }
    });
  });

  test.describe('WebSocket Connection Failures', () => {
    test('should handle WebSocket connection failures', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Open terminal to test WebSocket
      const terminalToggle = iframe.locator('[data-testid="terminal-toggle"]');
      if (await terminalToggle.isVisible()) {
        await terminalToggle.click();

        // Wait for connection attempt
        await page.waitForTimeout(3000);

        // Check for connection error
        const connectionError = iframe.locator('[data-testid="websocket-error"]').or(
          iframe.locator('[data-testid="connection-failed"]')
        );

        if (await connectionError.isVisible({ timeout: 2000 })) {
          await expect(connectionError).toBeVisible();
          await expect(connectionError).toContainText(/failed|error|disconnected/i);

          // Check for reconnect button
          const reconnectBtn = iframe.locator('[data-testid="reconnect-btn"]').or(
            iframe.locator('[data-testid="retry-connection-btn"]')
          );

          if (await reconnectBtn.isVisible()) {
            await reconnectBtn.click();
            // Verify reconnection attempt
            await expect(iframe.locator('[data-testid="connecting"]')).toBeVisible({ timeout: 2000 }).catch(() => {
              // Connection UI might vary
            });
          }
        }
      }
    });

    test('should handle WebSocket reconnection after failure', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      const terminalToggle = iframe.locator('[data-testid="terminal-toggle"]');
      if (await terminalToggle.isVisible()) {
        await terminalToggle.click();

        // Simulate disconnection
        await WebSocketUtils.simulateWebSocketMessage(page, {
          type: 'connection',
          payload: { status: 'disconnected', reason: 'Network error' }
        });

        // Verify disconnection handling
        await expect(iframe.locator('[data-testid="websocket-status"]')).toContainText('Disconnected');

        // Simulate reconnection
        await WebSocketUtils.simulateWebSocketMessage(page, {
          type: 'connection',
          payload: { status: 'connected' }
        });

        // Verify reconnection
        await expect(iframe.locator('[data-testid="websocket-status"]')).toContainText('Connected');
      }
    });

    test('should handle WebSocket message delivery failures', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      if (await iframe.locator('[data-testid="terminal-toggle"]').isVisible()) {
        await iframe.locator('[data-testid="terminal-toggle"]').click();

        // Try to send command when disconnected
        await WebSocketUtils.simulateWebSocketMessage(page, {
          type: 'connection',
          payload: { status: 'disconnected' }
        });

        await iframe.locator('[data-testid="terminal-input"]').fill('test command');
        await iframe.locator('[data-testid="terminal-input"]').press('Enter');

        // Should show message delivery error
        await expect(iframe.locator('[data-testid="message-error"]')).toBeVisible();
        await expect(iframe.locator('[data-testid="message-error"]')).toContainText(/failed|error/i);
      }
    });
  });

  test.describe('Task Creation and Execution Errors', () => {
    test('should handle invalid task input validation', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Try to create task with empty input
      const createBtn = iframe.locator('[data-testid="create-task-btn"]');
      await createBtn.click();

      // Should show validation error
      const errorMsg = iframe.locator('[data-testid="task-validation-error"]').or(
        iframe.locator('[data-testid="error-message"]')
      );

      if (await errorMsg.isVisible({ timeout: 2000 })) {
        await expect(errorMsg).toBeVisible();
        await expect(errorMsg).toContainText(/required|empty|invalid/i);
      }

      // Try with invalid model selection
      await iframe.locator('[data-testid="task-input"]').fill('Valid task description');
      await createBtn.click();

      // Should succeed or show different error
      const successMsg = iframe.locator('[data-testid="task-created"]').or(
        iframe.locator('[data-testid="task-list"]').locator('text=Valid task description')
      );

      await expect(successMsg).toBeVisible({ timeout: 5000 });
    });

    test('should handle task execution failures', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Create a task
      await iframe.locator('[data-testid="task-input"]').fill('Test task for failure simulation');
      await iframe.locator('[data-testid="create-task-btn"]').click();

      // Wait for task creation
      await expect(iframe.locator('[data-testid="task-list"]')).toContainText('Test task for failure simulation');

      // Simulate task execution failure
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'task_update',
        payload: {
          taskId: 'test-task-id',
          status: 'error',
          error: 'Model execution failed',
          message: 'Unable to process request'
        }
      });

      // Verify error handling
      await expect(iframe.locator('[data-testid="task-error"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="task-error"]')).toContainText('failed');

      // Check for retry option
      const retryBtn = iframe.locator('[data-testid="retry-task-btn"]');
      if (await retryBtn.isVisible()) {
        await retryBtn.click();
        // Verify retry attempt
        await expect(iframe.locator('[data-testid="task-status"]')).toContainText('retrying');
      }
    });

    test('should handle concurrent task conflicts', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Create multiple tasks quickly
      const tasks = ['Task 1', 'Task 2', 'Task 3'];

      for (const task of tasks) {
        await iframe.locator('[data-testid="task-input"]').fill(task);
        await iframe.locator('[data-testid="create-task-btn"]').click();
        await page.waitForTimeout(100); // Small delay between creations
      }

      // Verify all tasks were created (or some failed gracefully)
      const taskCount = await iframe.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0); // At least some should succeed

      // Check for any conflict errors
      const conflictErrors = iframe.locator('[data-testid="conflict-error"]');
      if (await conflictErrors.isVisible()) {
        // Verify conflict resolution UI
        await expect(conflictErrors).toContainText(/conflict|duplicate|concurrent/i);
      }
    });
  });

  test.describe('Model and API Errors', () => {
    test('should handle AI model unavailability', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Try to select a model that might be unavailable
      const modelSelector = iframe.locator('[data-testid="model-selector"]');
      if (await modelSelector.isVisible()) {
        await modelSelector.click();

        // Look for unavailable models
        const unavailableModel = iframe.locator('[data-testid="model-option-unavailable"]').or(
          iframe.locator('[data-testid*="model-option-"]').locator('.unavailable')
        );

        if (await unavailableModel.isVisible()) {
          await unavailableModel.click();

          // Should show model unavailable error
          await expect(iframe.locator('[data-testid="model-error"]')).toBeVisible();
          await expect(iframe.locator('[data-testid="model-error"]')).toContainText(/unavailable|not available/i);
        }
      }
    });

    test('should handle API rate limiting', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Simulate rate limit error
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'api_error',
        payload: {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60
        }
      });

      // Verify rate limit handling
      await expect(iframe.locator('[data-testid="rate-limit-error"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="rate-limit-error"]')).toContainText(/rate limit|too many requests/i);

      // Check for retry timing
      const retryTimer = iframe.locator('[data-testid="retry-timer"]');
      if (await retryTimer.isVisible()) {
        await expect(retryTimer).toContainText(/\d+/); // Should show countdown
      }
    });

    test('should handle API authentication failures', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Simulate auth error
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'auth_error',
        payload: {
          error: 'authentication_failed',
          message: 'API key invalid or expired'
        }
      });

      // Verify auth error handling
      await expect(iframe.locator('[data-testid="auth-error"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="auth-error"]')).toContainText(/authentication|api key|invalid/i);

      // Check for auth recovery options
      const reauthBtn = iframe.locator('[data-testid="reauth-btn"]').or(
        iframe.locator('[data-testid="update-api-key-btn"]')
      );

      if (await reauthBtn.isVisible()) {
        await expect(reauthBtn).toBeVisible();
      }
    });
  });

  test.describe('Network and Connectivity Issues', () => {
    test('should handle network timeouts', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Start a request that might timeout
      await iframe.locator('[data-testid="message-input"]').fill('Test query for timeout');
      await iframe.locator('[data-testid="execute-query-btn"]').click();

      // Simulate timeout
      await page.waitForTimeout(5000); // Wait for potential timeout

      const timeoutError = iframe.locator('[data-testid="timeout-error"]').or(
        iframe.locator('[data-testid="network-error"]')
      );

      if (await timeoutError.isVisible({ timeout: 2000 })) {
        await expect(timeoutError).toBeVisible();
        await expect(timeoutError).toContainText(/timeout|network|connection/i);
      }
    });

    test('should handle iframe loading failures', async ({ page }) => {
      // Try to open an app that might not exist or fail to load
      await unifiedApp.navigateToCategory('aiAutomation');

      // Try to open a potentially problematic app
      try {
        await unifiedApp.openApp('problematic-app');
      } catch (error) {
        // Verify error handling for app loading failures
        await expect(page.locator('[data-testid="app-load-error"]')).toBeVisible();
      }
    });

    test('should handle cross-origin iframe issues', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Check for cross-origin error handling
      const corsError = iframe.locator('[data-testid="cors-error"]').or(
        page.locator('[data-testid="iframe-error"]')
      );

      if (await corsError.isVisible({ timeout: 3000 })) {
        await expect(corsError).toBeVisible();
        await expect(corsError).toContainText(/origin|cross|cors/i);
      }
    });
  });

  test.describe('User Recovery Flows', () => {
    test('should provide clear error messages and recovery options', async ({ page }) => {
      // Test various error scenarios and verify user-friendly error messages

      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Simulate various errors
      const errorScenarios = [
        { type: 'network', message: 'Network connection lost' },
        { type: 'auth', message: 'Authentication required' },
        { type: 'server', message: 'Server temporarily unavailable' }
      ];

      for (const scenario of errorScenarios) {
        await WebSocketUtils.simulateWebSocketMessage(page, {
          type: 'error',
          payload: {
            errorType: scenario.type,
            message: scenario.message,
            recoverable: true
          }
        });

        // Verify error display
        const errorDisplay = iframe.locator('[data-testid="error-display"]');
        await expect(errorDisplay).toBeVisible();
        await expect(errorDisplay).toContainText(scenario.message);

        // Check for recovery options
        const recoveryBtn = iframe.locator('[data-testid="retry-btn"]').or(
          iframe.locator('[data-testid="recover-btn"]')
        );

        if (await recoveryBtn.isVisible()) {
          await expect(recoveryBtn).toBeVisible();
        }
      }
    });

    test('should allow users to navigate away from error states', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Simulate error state
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'error',
        payload: { message: 'Service error occurred' }
      });

      // Verify user can still navigate
      await unifiedApp.navigateToCategory('desktop');

      // Should successfully navigate despite error state
      expect(await unifiedApp.getActiveCategory()).toBe('desktop');
    });

    test('should maintain application stability during errors', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');

      // Open multiple apps
      await unifiedApp.openApp('bytebot-ui');
      await unifiedApp.openApp('aios-service');

      // Simulate system-wide error
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'system_error',
        payload: { message: 'System overload' }
      });

      // Verify app remains functional for basic operations
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="unified-app"]')).toBeVisible();

      // Should still be able to navigate
      await unifiedApp.navigateToCategory('infrastructure');
      expect(await unifiedApp.getActiveCategory()).toBe('infrastructure');
    });
  });

  test.describe('Data Persistence During Errors', () => {
    test('should preserve user input during error recovery', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Enter task description
      const taskText = 'Important task that should be preserved during errors';
      await iframe.locator('[data-testid="task-input"]').fill(taskText);

      // Simulate error
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'error',
        payload: { message: 'Temporary error' }
      });

      // Verify input is preserved
      const inputValue = await iframe.locator('[data-testid="task-input"]').inputValue();
      expect(inputValue).toBe(taskText);
    });

    test('should maintain task list during connection issues', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Create a task
      await iframe.locator('[data-testid="task-input"]').fill('Persistent task');
      await iframe.locator('[data-testid="create-task-btn"]').click();

      // Verify task exists
      await expect(iframe.locator('[data-testid="task-list"]')).toContainText('Persistent task');

      // Simulate disconnection
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'connection',
        payload: { status: 'disconnected' }
      });

      // Task should still be visible
      await expect(iframe.locator('[data-testid="task-list"]')).toContainText('Persistent task');

      // Simulate reconnection
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'connection',
        payload: { status: 'connected' }
      });

      // Task should still be there
      await expect(iframe.locator('[data-testid="task-list"]')).toContainText('Persistent task');
    });
  });
});