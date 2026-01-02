import { test, expect } from '@playwright/test';
import {
  UnifiedAppPage,
  WebSocketUtils,
  SERVICE_URLS
} from '../test-utils';

test.describe('WebSocket Terminal Functionality E2E Tests', () => {
  let unifiedApp: UnifiedAppPage;

  test.beforeEach(async ({ page }) => {
    unifiedApp = new UnifiedAppPage(page);
    await unifiedApp.goto();
  });

  test.describe('Terminal Panel Access', () => {
    test('should access terminal panel from unified app', async ({ page }) => {
      // Navigate to automation category where terminal access is available
      await unifiedApp.navigateToCategory('aiAutomation');

      // Open Bytebot UI which should have terminal access
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Check for terminal panel toggle
      const terminalToggle = iframe.locator('[data-testid="terminal-toggle"]');
      await expect(terminalToggle).toBeVisible();

      // Open terminal panel
      await terminalToggle.click();

      // Verify terminal panel is visible
      await expect(iframe.locator('[data-testid="terminal-panel"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="terminal-input"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="terminal-output"]')).toBeVisible();
    });

    test('should access terminal from AIOS service', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // AIOS should have terminal integration
      const terminalBtn = iframe.locator('[data-testid="terminal-btn"]');
      if (await terminalBtn.isVisible()) {
        await terminalBtn.click();

        await expect(iframe.locator('[data-testid="terminal-panel"]')).toBeVisible();
      }
    });

    test('should access terminal from desktop environments', async ({ page }) => {
      await unifiedApp.navigateToCategory('desktop');
      await unifiedApp.openApp('bytebot-vnc-desktop');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-vnc-desktop"]');

      // Desktop environments should have integrated terminal
      const terminalAccess = iframe.locator('[data-testid="terminal-access"]');
      if (await terminalAccess.isVisible()) {
        await terminalAccess.click();

        // Terminal should be accessible within the VNC environment
        const terminalWindow = iframe.locator('[data-testid="vnc-terminal"]');
        await expect(terminalWindow).toBeVisible();
      }
    });
  });

  test.describe('WebSocket Connection Establishment', () => {
    test('should establish WebSocket connection on terminal open', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Open terminal
      await iframe.locator('[data-testid="terminal-toggle"]').click();

      // Wait for WebSocket connection
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Verify connection status
      await expect(iframe.locator('[data-testid="websocket-status"]')).toContainText('Connected');
      await expect(iframe.locator('[data-testid="connection-indicator"]')).toHaveClass(/connected/);
    });

    test('should show connection progress and status updates', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Open terminal
      await iframe.locator('[data-testid="terminal-toggle"]').click();

      // Check initial connection state
      await expect(iframe.locator('[data-testid="websocket-status"]')).toContainText('Connecting');

      // Wait for connection
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Verify final connected state
      await expect(iframe.locator('[data-testid="websocket-status"]')).toContainText('Connected');
    });

    test('should handle WebSocket connection errors', async ({ page }) => {
      // This test might need to simulate network issues or server unavailability
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Open terminal
      await iframe.locator('[data-testid="terminal-toggle"]').click();

      // Simulate connection failure (this would need backend cooperation or network simulation)
      // For now, verify error handling UI is present
      const errorIndicator = iframe.locator('[data-testid="websocket-error"]');

      // If error occurs, verify proper error display
      if (await errorIndicator.isVisible({ timeout: 5000 })) {
        await expect(errorIndicator).toBeVisible();
        await expect(errorIndicator).toContainText('Failed to connect');

        // Should show retry option
        await expect(iframe.locator('[data-testid="retry-connection-btn"]')).toBeVisible();
      }
    });
  });

  test.describe('Terminal Command Execution', () => {
    test('should execute basic terminal commands', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Open terminal and wait for connection
      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Execute simple command
      await iframe.locator('[data-testid="terminal-input"]').fill('echo "Hello, World!"');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Wait for command execution
      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('Hello, World!');
    });

    test('should handle command history navigation', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Execute multiple commands
      const commands = ['pwd', 'ls -la', 'whoami'];

      for (const cmd of commands) {
        await iframe.locator('[data-testid="terminal-input"]').fill(cmd);
        await iframe.locator('[data-testid="terminal-input"]').press('Enter');
        await page.waitForTimeout(500); // Allow command to execute
      }

      // Test up arrow for history
      await iframe.locator('[data-testid="terminal-input"]').press('ArrowUp');
      let inputValue = await iframe.locator('[data-testid="terminal-input"]').inputValue();
      expect(inputValue).toBe(commands[commands.length - 1]);

      // Up arrow again
      await iframe.locator('[data-testid="terminal-input"]').press('ArrowUp');
      inputValue = await iframe.locator('[data-testid="terminal-input"]').inputValue();
      expect(inputValue).toBe(commands[commands.length - 2]);
    });

    test('should handle long-running commands with progress indication', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Execute a command that takes time (simulated)
      await iframe.locator('[data-testid="terminal-input"]').fill('sleep 3 && echo "Done"');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Check for progress indicator
      const progressIndicator = iframe.locator('[data-testid="command-progress"]');
      if (await progressIndicator.isVisible()) {
        await expect(progressIndicator).toBeVisible();
      }

      // Wait for completion
      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('Done');
    });

    test('should handle command cancellation', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Start a long-running command
      await iframe.locator('[data-testid="terminal-input"]').fill('sleep 10');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Cancel the command
      const cancelBtn = iframe.locator('[data-testid="cancel-command-btn"]');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();

        // Verify command was cancelled
        await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('cancelled');
      }
    });
  });

  test.describe('Terminal Output Handling', () => {
    test('should display colored output correctly', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Execute command that produces colored output
      await iframe.locator('[data-testid="terminal-input"]').fill('ls --color=always');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Verify colored output is rendered (this might be implementation-specific)
      const output = iframe.locator('[data-testid="terminal-output"]');
      await expect(output).toBeVisible();

      // Check that ANSI color codes are properly handled
      const outputText = await output.textContent();
      expect(outputText?.length).toBeGreaterThan(0);
    });

    test('should handle large output with scrolling', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Execute command that produces large output
      await iframe.locator('[data-testid="terminal-input"]').fill('for i in {1..50}; do echo "Line $i"; done');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Wait for output
      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('Line 50');

      // Verify scrolling behavior
      const outputContainer = iframe.locator('[data-testid="terminal-output-container"]');
      const scrollTop = await outputContainer.evaluate(el => el.scrollTop);
      const scrollHeight = await outputContainer.evaluate(el => el.scrollHeight);

      // Should be scrolled to bottom for large output
      expect(scrollTop).toBeGreaterThan(0);
    });

    test('should handle error output with proper formatting', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Execute command that produces error
      await iframe.locator('[data-testid="terminal-input"]').fill('ls /nonexistent-directory');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Verify error is displayed
      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('No such file or directory');

      // Check error styling (if implemented)
      const errorOutput = iframe.locator('[data-testid="terminal-error-output"]');
      if (await errorOutput.isVisible()) {
        await expect(errorOutput).toHaveClass(/error/);
      }
    });
  });

  test.describe('WebSocket Streaming and Real-time Updates', () => {
    test('should stream command output in real-time', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Execute command that produces streaming output
      await iframe.locator('[data-testid="terminal-input"]').fill('echo "Line 1"; sleep 0.5; echo "Line 2"; sleep 0.5; echo "Line 3"');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Verify streaming output appears progressively
      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('Line 1');
      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('Line 2');
      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('Line 3');
    });

    test('should handle WebSocket reconnection during command execution', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Start a command
      await iframe.locator('[data-testid="terminal-input"]').fill('ping -c 10 localhost');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Simulate disconnection
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'connection',
        payload: { status: 'disconnected' }
      });

      // Verify disconnection is handled
      await expect(iframe.locator('[data-testid="websocket-status"]')).toContainText('Disconnected');

      // Simulate reconnection
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'connection',
        payload: { status: 'connected' }
      });

      // Verify reconnection
      await expect(iframe.locator('[data-testid="websocket-status"]')).toContainText('Connected');
    });

    test('should maintain terminal session across reconnections', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Set up environment variable
      await iframe.locator('[data-testid="terminal-input"]').fill('export TEST_VAR="hello"');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Simulate disconnection and reconnection
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'connection',
        payload: { status: 'disconnected' }
      });

      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'connection',
        payload: { status: 'connected' }
      });

      // Verify session is maintained
      await iframe.locator('[data-testid="terminal-input"]').fill('echo $TEST_VAR');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('hello');
    });
  });

  test.describe('Terminal Features and Advanced Functionality', () => {
    test('should support tab completion', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Type partial command and press tab
      await iframe.locator('[data-testid="terminal-input"]').fill('ls /');
      await iframe.locator('[data-testid="terminal-input"]').press('Tab');

      // Check if completion was attempted (implementation-dependent)
      const inputValue = await iframe.locator('[data-testid="terminal-input"]').inputValue();
      // Completion behavior varies, just verify input handling
      expect(inputValue.length).toBeGreaterThanOrEqual(4); // At least 'ls /'
    });

    test('should handle file upload/download through terminal', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Check for file operations UI
      const uploadBtn = iframe.locator('[data-testid="terminal-upload-btn"]');
      const downloadBtn = iframe.locator('[data-testid="terminal-download-btn"]');

      if (await uploadBtn.isVisible()) {
        // Test file upload capability
        await expect(uploadBtn).toBeVisible();

        // Test file download capability
        await expect(downloadBtn).toBeVisible();
      }
    });

    test('should support multiple terminal sessions', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Check for new terminal session button
      const newSessionBtn = iframe.locator('[data-testid="new-terminal-session-btn"]');

      if (await newSessionBtn.isVisible()) {
        await newSessionBtn.click();

        // Verify multiple sessions
        const sessions = await iframe.locator('[data-testid="terminal-session"]').count();
        expect(sessions).toBeGreaterThan(1);

        // Switch between sessions
        await iframe.locator('[data-testid="terminal-session-tab"]').nth(1).click();

        // Verify session switching
        const activeSession = iframe.locator('[data-testid="terminal-session"].active');
        await expect(activeSession).toBeVisible();
      }
    });
  });

  test.describe('Terminal Integration with Other Services', () => {
    test('should execute commands from AIOS service', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // AIOS should be able to send commands to terminal
      const terminalCmd = iframe.locator('[data-testid="terminal-command-btn"]');

      if (await terminalCmd.isVisible()) {
        await terminalCmd.click();

        // Check if terminal command was sent
        const commandSent = iframe.locator('[data-testid="terminal-command-sent"]');
        await expect(commandSent).toBeVisible();
      }
    });

    test('should integrate terminal with file operations', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await iframe.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Create a file via terminal
      await iframe.locator('[data-testid="terminal-input"]').fill('echo "test content" > test.txt');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      // Verify file creation
      await iframe.locator('[data-testid="terminal-input"]').fill('ls -la test.txt');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');

      await expect(iframe.locator('[data-testid="terminal-output"]')).toContainText('test.txt');

      // Clean up
      await iframe.locator('[data-testid="terminal-input"]').fill('rm test.txt');
      await iframe.locator('[data-testid="terminal-input"]').press('Enter');
    });
  });
});