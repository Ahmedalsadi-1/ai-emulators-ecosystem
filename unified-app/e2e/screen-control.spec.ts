import { test, expect } from '@playwright/test';

test.describe('Screen Control E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the unified app successfully', async ({ page }) => {
    // Check that the main app container is visible
    await expect(page.locator('[data-testid="unified-app"]')).toBeVisible();

    // Check that navigation sidebar is present
    await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();

    // Check that screen selector is available
    await expect(page.locator('[data-testid="screen-selector"]')).toBeVisible();
  });

  test('should display all available screens in selector', async ({ page }) => {
    const screenSelector = page.locator('[data-testid="screen-selector"]');
    await expect(screenSelector).toBeVisible();

    // Check for main screen options
    await expect(page.locator('[data-testid="screen-desktop"]')).toBeVisible();
    await expect(page.locator('[data-testid="screen-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="screen-agent"]')).toBeVisible();
    await expect(page.locator('[data-testid="screen-web"]')).toBeVisible();
    await expect(page.locator('[data-testid="screen-settings"]')).toBeVisible();
  });

  test('should switch to Desktop screen and show task interface', async ({ page }) => {
    // Click on Desktop screen selector
    await page.click('[data-testid="screen-desktop"]');

    // Wait for desktop screen to load
    await page.waitForSelector('[data-testid="desktop-screen"]');

    // Check that desktop screen elements are visible
    await expect(page.locator('[data-testid="task-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-task-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="model-selector"]')).toBeVisible();
  });

  test('should create a new task on Desktop screen', async ({ page }) => {
    // Navigate to desktop screen
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');

    // Enter task description
    const taskDescription = 'Test task: Analyze sales data and generate report';
    await page.fill('[data-testid="task-input"]', taskDescription);

    // Select a model
    await page.click('[data-testid="model-selector"]');
    await page.click('[data-testid="model-gpt-4"]');

    // Create the task
    await page.click('[data-testid="create-task-btn"]');

    // Wait for task to be created and appear in list
    await page.waitForSelector('[data-testid="task-list"]');
    await expect(page.locator('[data-testid="task-list"]')).toContainText(taskDescription);

    // Check that task has the selected model
    await expect(page.locator('[data-testid="task-model"]')).toContainText('gpt-4');
  });

  test('should switch between different screens', async ({ page }) => {
    // Test switching to Code screen
    await page.click('[data-testid="screen-code"]');
    await page.waitForSelector('[data-testid="code-screen"]');
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();

    // Test switching to Agent screen
    await page.click('[data-testid="screen-agent"]');
    await page.waitForSelector('[data-testid="agent-screen"]');
    await expect(page.locator('[data-testid="agent-chat"]')).toBeVisible();

    // Test switching back to Desktop
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');
    await expect(page.locator('[data-testid="task-input"]')).toBeVisible();
  });

  test('should handle model selection across screens', async ({ page }) => {
    // Navigate to desktop and select a model
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');

    await page.click('[data-testid="model-selector"]');
    await page.click('[data-testid="model-claude-3"]');
    await expect(page.locator('[data-testid="selected-model"]')).toContainText('claude-3');

    // Switch to agent screen and check model persists or can be changed
    await page.click('[data-testid="screen-agent"]');
    await page.waitForSelector('[data-testid="agent-screen"]');

    // Agent screen should have its own model selector
    await expect(page.locator('[data-testid="agent-model-selector"]')).toBeVisible();
  });

  test('should maintain task state when switching screens', async ({ page }) => {
    // Create a task on desktop
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');

    const taskDescription = 'Persistent test task';
    await page.fill('[data-testid="task-input"]', taskDescription);
    await page.click('[data-testid="create-task-btn"]');

    await page.waitForSelector(`text=${taskDescription}`);

    // Switch to another screen
    await page.click('[data-testid="screen-code"]');
    await page.waitForSelector('[data-testid="code-screen"]');

    // Switch back to desktop
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');

    // Task should still be visible
    await expect(page.locator('[data-testid="task-list"]')).toContainText(taskDescription);
  });

  test('should handle screen selector in different viewport sizes', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.locator('[data-testid="screen-selector"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.locator('[data-testid="screen-selector"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await expect(page.locator('[data-testid="screen-selector"]')).toBeVisible();
  });

  test('should show loading states during screen transitions', async ({ page }) => {
    // Click on a screen and check for loading indicator
    await page.click('[data-testid="screen-desktop"]');

    // Check for loading state (if implemented)
    const loadingIndicator = page.locator('[data-testid="screen-loading"]').first();
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
      // Wait for loading to complete
      await loadingIndicator.waitFor({ state: 'hidden' });
    }

    await expect(page.locator('[data-testid="desktop-screen"]')).toBeVisible();
  });
});