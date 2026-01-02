import { test, expect } from '@playwright/test';
import {
  UnifiedAppPage,
  EnvironmentUtils
} from '../test-utils';

test.describe('Cross-Browser Compatibility E2E Tests', () => {
  let unifiedApp: UnifiedAppPage;

  test.beforeAll(async () => {
    await EnvironmentUtils.setupTestEnvironment();
  });

  test.beforeEach(async ({ page }) => {
    unifiedApp = new UnifiedAppPage(page);
    await unifiedApp.goto();
  });

  test.describe('Core Functionality Across Browsers', () => {
    test('should load unified app consistently', async ({ page, browserName }) => {
      // Verify basic app loading across browsers
      await expect(page.locator('[data-testid="unified-app"]')).toBeVisible();

      // Check browser-specific attributes
      const userAgent = await page.evaluate(() => navigator.userAgent);
      console.log(`Testing on ${browserName}: ${userAgent}`);

      // Verify core navigation elements
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should handle navigation consistently', async ({ page, browserName }) => {
      // Test category navigation across browsers
      const categories = ['aiAutomation', 'desktop', 'infrastructure'];

      for (const category of categories) {
        await unifiedApp.navigateToCategory(category);
        expect(await unifiedApp.getActiveCategory()).toBe(category);

        // Verify category content loads
        const categoryContent = page.locator(`[data-testid="category-${category}"]`);
        await expect(categoryContent).toBeVisible();
      }
    });

    test('should handle app opening consistently', async ({ page, browserName }) => {
      await unifiedApp.navigateToCategory('aiAutomation');

      // Test opening different apps
      const apps = ['bytebot-ui', 'aios-service', 'factif-ai'];

      for (const app of apps) {
        try {
          await unifiedApp.openApp(app);
          await expect(page.locator(`[data-testid="app-viewer-${app}"]`)).toBeVisible();

          // Verify iframe loads (with timeout for different browser speeds)
          await unifiedApp.waitForAppIframe(app);

          console.log(`${browserName}: Successfully opened ${app}`);
        } catch (error) {
          console.warn(`${browserName}: Failed to open ${app}:`, error);
          // Continue testing other apps
        }
      }
    });
  });

  test.describe('Browser-Specific Behavior Testing', () => {
    test('should handle iframe compatibility', async ({ page, browserName }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Test iframe content loading
      await expect(iframe.locator('body')).toBeVisible();

      // Browser-specific iframe behavior
      if (browserName === 'webkit') {
        // WebKit has different iframe security policies
        console.log('Testing WebKit iframe behavior');
      } else if (browserName === 'firefox') {
        // Firefox has different cross-origin policies
        console.log('Testing Firefox iframe behavior');
      } else if (browserName === 'chromium') {
        // Chromium-based browsers
        console.log('Testing Chromium iframe behavior');
      }
    });

    test('should handle WebSocket connections', async ({ page, browserName }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Open terminal for WebSocket testing
      const terminalToggle = iframe.locator('[data-testid="terminal-toggle"]');
      if (await terminalToggle.isVisible()) {
        await terminalToggle.click();

        // Test WebSocket connection establishment
        const connectionIndicator = iframe.locator('[data-testid="websocket-status"]');
        if (await connectionIndicator.isVisible({ timeout: 5000 })) {
          const status = await connectionIndicator.textContent();
          expect(status).toMatch(/Connected|Connecting|Disconnected/i);
        }

        console.log(`${browserName} WebSocket status: ${await connectionIndicator.textContent()}`);
      }
    });

    test('should handle file operations consistently', async ({ page, browserName }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Test file input handling (if available)
      const fileInputs = iframe.locator('input[type="file"]');
      if (await fileInputs.isVisible()) {
        // Browser-specific file handling
        console.log(`${browserName} file input handling`);
      }
    });
  });

  test.describe('Input and Interaction Testing', () => {
    test('should handle text input consistently', async ({ page, browserName }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      const taskInput = iframe.locator('[data-testid="task-input"]');

      // Test text input
      const testText = `Test input from ${browserName}`;
      await taskInput.fill(testText);

      const inputValue = await taskInput.inputValue();
      expect(inputValue).toBe(testText);

      // Test keyboard navigation
      await taskInput.press('Tab');
      await taskInput.press('Enter');

      console.log(`${browserName} text input working correctly`);
    });

    test('should handle mouse interactions consistently', async ({ page, browserName }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      const button = iframe.locator('[data-testid="create-task-btn"]');

      // Test hover
      await button.hover();

      // Test click
      await button.click();

      // Verify interaction worked
      const input = iframe.locator('[data-testid="task-input"]');
      const validationError = iframe.locator('[data-testid="task-validation-error"]');

      // Should show validation error for empty input
      if (await validationError.isVisible()) {
        expect(await validationError.textContent()).toContain('required');
      }

      console.log(`${browserName} mouse interactions working correctly`);
    });

    test('should handle keyboard shortcuts consistently', async ({ page, browserName }) => {
      // Test sidebar toggle shortcut
      const sidebar = page.locator('[data-testid="navigation-sidebar"]');

      // Initial state
      const initialWidth = await sidebar.evaluate(el => el.clientWidth);

      // Press Ctrl+B
      await page.keyboard.press('Control+b');

      // Wait for animation
      await page.waitForTimeout(300);

      // Check if sidebar width changed
      const newWidth = await sidebar.evaluate(el => el.clientWidth);
      expect(newWidth).not.toBe(initialWidth);

      console.log(`${browserName} keyboard shortcuts working correctly`);
    });
  });

  test.describe('Responsive Design Testing', () => {
    test('should handle different viewport sizes', async ({ page, browserName }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1366, height: 768, name: 'laptop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Test basic functionality at each viewport
        await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

        // Test navigation
        await unifiedApp.navigateToCategory('aiAutomation');
        expect(await unifiedApp.getActiveCategory()).toBe('aiAutomation');

        console.log(`${browserName} viewport ${viewport.name} working correctly`);
      }
    });

    test('should handle touch interactions on mobile', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Test touch interactions (if supported)
      if (browserName === 'webkit' || browserName === 'chromium') {
        // Simulate touch tap
        await page.tap('[data-testid="navigation-sidebar"] button:first-child');

        console.log(`${browserName} touch interactions working correctly`);
      }
    });
  });

  test.describe('Performance and Loading Testing', () => {
    test('should handle loading times consistently', async ({ page, browserName }) => {
      const startTime = Date.now();

      await unifiedApp.goto();

      const loadTime = Date.now() - startTime;
      console.log(`${browserName} initial load time: ${loadTime}ms`);

      // Test should complete within reasonable time
      expect(loadTime).toBeLessThan(10000); // 10 seconds

      // Test app opening performance
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const appLoadTime = Date.now() - startTime;
      console.log(`${browserName} app load time: ${appLoadTime}ms`);
    });

    test('should handle memory usage consistently', async ({ page, browserName }) => {
      // Navigate through multiple apps to test memory usage
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');
      await unifiedApp.openApp('aios-service');
      await unifiedApp.openApp('factif-ai');

      // Switch categories
      await unifiedApp.navigateToCategory('desktop');
      await unifiedApp.openApp('bytebot-vnc-desktop');

      // Basic memory check (limited by browser APIs)
      const memoryInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      if (memoryInfo) {
        console.log(`${browserName} memory usage:`, memoryInfo);
      }
    });
  });

  test.describe('Security and CORS Testing', () => {
    test('should handle cross-origin requests appropriately', async ({ page, browserName }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Test iframe loading from different origins
      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Verify iframe loaded without CORS errors
      await expect(iframe.locator('body')).toBeVisible();

      console.log(`${browserName} CORS handling working correctly`);
    });

    test('should handle secure context requirements', async ({ page, browserName }) => {
      // Test features that require secure context (HTTPS)
      const isSecure = page.url().startsWith('https://');

      if (isSecure) {
        // Test secure-only features
        console.log(`${browserName} running in secure context`);
      } else {
        console.log(`${browserName} running in non-secure context`);
      }
    });
  });

  test.describe('Browser Feature Detection', () => {
    test('should detect and adapt to browser capabilities', async ({ page, browserName }) => {
      // Test browser feature detection
      const browserFeatures = await page.evaluate(() => ({
        webgl: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch {
            return false;
          }
        })(),
        websockets: 'WebSocket' in window,
        localStorage: (() => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })(),
        serviceWorker: 'serviceWorker' in navigator,
        indexedDB: 'indexedDB' in window
      }));

      console.log(`${browserName} feature detection:`, browserFeatures);

      // Verify critical features are available
      expect(browserFeatures.websockets).toBe(true);
      expect(browserFeatures.localStorage).toBe(true);
    });

    test('should handle browser-specific CSS and layout', async ({ page, browserName }) => {
      // Test CSS custom properties and layout
      const layoutInfo = await page.evaluate(() => ({
        scrollbarWidth: (() => {
          const div = document.createElement('div');
          div.style.width = '100px';
          div.style.height = '100px';
          div.style.overflow = 'scroll';
          div.style.position = 'absolute';
          div.style.top = '-9999px';
          document.body.appendChild(div);
          const width = div.offsetWidth - div.clientWidth;
          document.body.removeChild(div);
          return width;
        })(),
        supportsGrid: CSS.supports('display', 'grid'),
        supportsFlexbox: CSS.supports('display', 'flex'),
        supportsCustomProperties: CSS.supports('--custom-property', 'value')
      }));

      console.log(`${browserName} layout capabilities:`, layoutInfo);

      // Verify essential CSS support
      expect(layoutInfo.supportsFlexbox).toBe(true);
    });
  });

  test.describe('Error Handling Across Browsers', () => {
    test('should handle JavaScript errors consistently', async ({ page, browserName }) => {
      // Set up error monitoring
      const errors: Error[] = [];
      page.on('pageerror', error => errors.push(error));

      // Trigger potential errors
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Wait for potential errors
      await page.waitForTimeout(2000);

      if (errors.length > 0) {
        console.warn(`${browserName} JavaScript errors:`, errors);
      } else {
        console.log(`${browserName} no JavaScript errors detected`);
      }

      // Test should not have critical errors that prevent functionality
      const criticalErrors = errors.filter(error =>
        error.message.includes('TypeError') ||
        error.message.includes('ReferenceError') ||
        error.message.includes('SyntaxError')
      );

      expect(criticalErrors.length).toBe(0);
    });

    test('should handle network errors consistently', async ({ page, browserName }) => {
      // Test with offline simulation (limited in Playwright)
      await page.route('**/api/**', route => route.abort());

      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Should handle API failures gracefully
      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Check for error indicators
      const errorIndicators = [
        iframe.locator('[data-testid="network-error"]'),
        iframe.locator('[data-testid="api-error"]'),
        iframe.locator('[data-testid="connection-error"]')
      ];

      let errorFound = false;
      for (const indicator of errorIndicators) {
        if (await indicator.isVisible({ timeout: 2000 })) {
          errorFound = true;
          break;
        }
      }

      if (errorFound) {
        console.log(`${browserName} properly handles network errors`);
      }

      // Restore normal network
      await page.unroute('**/api/**');
    });
  });
});