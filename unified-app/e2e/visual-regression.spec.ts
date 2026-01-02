import { test, expect } from '@playwright/test';
import {
  UnifiedAppPage,
  VisualUtils
} from '../test-utils';

test.describe('Visual Regression Testing', () => {
  let unifiedApp: UnifiedAppPage;

  test.beforeEach(async ({ page }) => {
    unifiedApp = new UnifiedAppPage(page);
    await unifiedApp.goto();
  });

  test.describe('Layout and UI Consistency', () => {
    test('should maintain consistent navigation sidebar layout', async ({ page }) => {
      // Take baseline screenshot of navigation sidebar
      await VisualUtils.takeScreenshot(page, 'navigation-sidebar-baseline');

      // Test expanded state
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toHaveClass(/w-80/);

      // Collapse sidebar and test
      await unifiedApp.toggleSidebar();
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toHaveClass(/w-16/);
      await VisualUtils.takeScreenshot(page, 'navigation-sidebar-collapsed');

      // Expand again and verify consistency
      await unifiedApp.toggleSidebar();
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toHaveClass(/w-80/);
      await VisualUtils.takeScreenshot(page, 'navigation-sidebar-expanded');
    });

    test('should maintain consistent app grid layout', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');

      // Take screenshot of app grid
      await VisualUtils.takeScreenshot(page, 'app-grid-layout');

      // Verify grid structure
      const apps = await page.locator('[data-testid^="app-card-"]').all();
      expect(apps.length).toBeGreaterThan(0);

      // Check grid responsiveness
      await page.setViewportSize({ width: 768, height: 1024 });
      await VisualUtils.takeScreenshot(page, 'app-grid-tablet');

      await page.setViewportSize({ width: 375, height: 667 });
      await VisualUtils.takeScreenshot(page, 'app-grid-mobile');
    });

    test('should maintain consistent app viewer layout', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Take screenshot of app viewer
      await VisualUtils.takeScreenshot(page, 'app-viewer-layout');

      // Verify header, content, and controls layout
      await expect(page.locator('[data-testid="app-viewer-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="app-iframe-container"]')).toBeVisible();
    });
  });

  test.describe('Component State Visual Regression', () => {
    test('should maintain consistent loading states', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Simulate loading state if possible
      await VisualUtils.takeScreenshot(page, 'app-loading-state');

      // Test category switching loading
      await unifiedApp.navigateToCategory('desktop');
      await VisualUtils.takeScreenshot(page, 'category-switch-loading');
    });

    test('should maintain consistent error states', async ({ page }) => {
      // Navigate to a category and simulate error
      await unifiedApp.navigateToCategory('aiAutomation');

      // This test would need backend cooperation to simulate errors
      // For now, test general error state appearance
      await VisualUtils.takeScreenshot(page, 'general-error-state');
    });

    test('should maintain consistent success states', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Create a task to show success state
      await iframe.locator('[data-testid="task-input"]').fill('Visual regression test task');
      await iframe.locator('[data-testid="create-task-btn"]').click();

      // Take screenshot of success state
      await VisualUtils.takeScreenshot(page, 'task-creation-success');
    });
  });

  test.describe('Interactive Element States', () => {
    test('should maintain consistent button states', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Test button hover states
      const createBtn = iframe.locator('[data-testid="create-task-btn"]');
      await createBtn.hover();
      await VisualUtils.takeScreenshot(page, 'button-hover-state');

      // Test button focus states
      await createBtn.focus();
      await VisualUtils.takeScreenshot(page, 'button-focus-state');

      // Test button active/pressed states
      await createBtn.click();
      await VisualUtils.takeScreenshot(page, 'button-active-state');
    });

    test('should maintain consistent form input states', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      const taskInput = iframe.locator('[data-testid="task-input"]');

      // Test input focus state
      await taskInput.focus();
      await VisualUtils.takeScreenshot(page, 'input-focus-state');

      // Test input with content
      await taskInput.fill('Test input content');
      await VisualUtils.takeScreenshot(page, 'input-with-content');

      // Test input error state (if validation fails)
      await taskInput.clear();
      await iframe.locator('[data-testid="create-task-btn"]').click();
      await VisualUtils.takeScreenshot(page, 'input-error-state');
    });

    test('should maintain consistent modal and overlay states', async ({ page }) => {
      // Test details panel overlay
      await unifiedApp.toggleDetailsPanel();
      await VisualUtils.takeScreenshot(page, 'details-panel-overlay');

      // Test sidebar overlay on mobile (if applicable)
      await page.setViewportSize({ width: 375, height: 667 });
      await unifiedApp.toggleSidebar();
      await VisualUtils.takeScreenshot(page, 'sidebar-mobile-overlay');
    });
  });

  test.describe('Content and Data Visualization', () => {
    test('should maintain consistent task list visualization', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Create multiple tasks for list visualization
      const tasks = ['Task 1', 'Task 2', 'Task 3'];
      for (const task of tasks) {
        await iframe.locator('[data-testid="task-input"]').fill(task);
        await iframe.locator('[data-testid="create-task-btn"]').click();
        await page.waitForTimeout(100);
      }

      // Take screenshot of task list
      await VisualUtils.takeScreenshot(page, 'task-list-visualization');
    });

    test('should maintain consistent chart and graph layouts', async ({ page }) => {
      await unifiedApp.navigateToCategory('infrastructure');
      await unifiedApp.openApp('grafana-monitoring');

      // Take screenshot of monitoring dashboards
      await VisualUtils.takeScreenshot(page, 'monitoring-dashboards');

      // Test different viewport sizes for chart responsiveness
      await page.setViewportSize({ width: 1200, height: 800 });
      await VisualUtils.takeScreenshot(page, 'charts-large-viewport');

      await page.setViewportSize({ width: 768, height: 1024 });
      await VisualUtils.takeScreenshot(page, 'charts-tablet-viewport');
    });

    test('should maintain consistent terminal output formatting', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Open terminal and execute commands
      const terminalToggle = iframe.locator('[data-testid="terminal-toggle"]');
      if (await terminalToggle.isVisible()) {
        await terminalToggle.click();

        // Execute some commands to generate output
        await iframe.locator('[data-testid="terminal-input"]').fill('echo "Test output"');
        await iframe.locator('[data-testid="terminal-input"]').press('Enter');

        await iframe.locator('[data-testid="terminal-input"]').fill('ls -la');
        await iframe.locator('[data-testid="terminal-input"]').press('Enter');

        // Take screenshot of terminal output
        await VisualUtils.takeScreenshot(page, 'terminal-output-formatting');
      }
    });
  });

  test.describe('Animation and Transition States', () => {
    test('should maintain consistent transition animations', async ({ page }) => {
      // Test category switching animation
      await unifiedApp.navigateToCategory('aiAutomation');
      await VisualUtils.takeScreenshot(page, 'category-transition-start');

      await unifiedApp.navigateToCategory('desktop');
      await VisualUtils.takeScreenshot(page, 'category-transition-middle');

      await page.waitForTimeout(300); // Wait for animation to complete
      await VisualUtils.takeScreenshot(page, 'category-transition-end');
    });

    test('should maintain consistent loading animations', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Capture loading animation frames
      await VisualUtils.takeScreenshot(page, 'loading-animation-frame-1');
      await page.waitForTimeout(100);
      await VisualUtils.takeScreenshot(page, 'loading-animation-frame-2');
      await page.waitForTimeout(100);
      await VisualUtils.takeScreenshot(page, 'loading-animation-frame-3');
    });
  });

  test.describe('Cross-Device Visual Consistency', () => {
    test('should maintain visual consistency across devices', async ({ page }) => {
      // Desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await unifiedApp.navigateToCategory('aiAutomation');
      await VisualUtils.takeScreenshot(page, 'desktop-viewport');

      // Laptop viewport
      await page.setViewportSize({ width: 1366, height: 768 });
      await VisualUtils.takeScreenshot(page, 'laptop-viewport');

      // Tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await VisualUtils.takeScreenshot(page, 'tablet-viewport');

      // Mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await VisualUtils.takeScreenshot(page, 'mobile-viewport');
    });

    test('should maintain consistent typography scaling', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await VisualUtils.takeScreenshot(page, `typography-${viewport.name}`);
      }
    });
  });

  test.describe('Theme and Color Consistency', () => {
    test('should maintain consistent color scheme', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Test different UI states for color consistency
      await VisualUtils.takeScreenshot(page, 'color-scheme-default');

      // Test focus states
      const input = page.locator('[data-testid="task-input"]').first();
      await input.focus();
      await VisualUtils.takeScreenshot(page, 'color-scheme-focus');

      // Test hover states
      const button = page.locator('[data-testid="create-task-btn"]').first();
      await button.hover();
      await VisualUtils.takeScreenshot(page, 'color-scheme-hover');
    });

    test('should maintain consistent status indicators', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Create a task to see status indicators
      await iframe.locator('[data-testid="task-input"]').fill('Status indicator test');
      await iframe.locator('[data-testid="create-task-btn"]').click();

      // Capture different status states
      await VisualUtils.takeScreenshot(page, 'status-indicators-default');

      // This would need backend simulation for different statuses
      // pending, running, completed, error
    });
  });
});