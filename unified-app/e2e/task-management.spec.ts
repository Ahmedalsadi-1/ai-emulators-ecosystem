import { test, expect } from '@playwright/test';

test.describe('Task Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to desktop screen for task operations
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');
  });

  test('should create task with different models', async ({ page }) => {
    const testTasks = [
      { description: 'Analyze quarterly sales data', model: 'gpt-4' },
      { description: 'Generate customer insights report', model: 'claude-3' },
      { description: 'Process invoice data', model: 'gemini-pro' },
    ];

    for (const task of testTasks) {
      // Clear input and enter description
      await page.fill('[data-testid="task-input"]', '');

      await page.fill('[data-testid="task-input"]', task.description);

      // Select model
      await page.click('[data-testid="model-selector"]');
      await page.click(`[data-testid="model-${task.model}"]`);

      // Create task
      await page.click('[data-testid="create-task-btn"]');

      // Verify task appears with correct model
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${task.description}")`);
      await expect(page.locator(`[data-testid="task-item"]:has-text("${task.description}")`)).toContainText(task.model);
    }

    // Verify all tasks are listed
    await expect(page.locator('[data-testid="task-item"]')).toHaveCount(testTasks.length);
  });

  test('should handle task status updates', async ({ page }) => {
    // Create a task
    const taskDescription = 'Status update test task';
    await page.fill('[data-testid="task-input"]', taskDescription);
    await page.click('[data-testid="create-task-btn"]');

    // Wait for task to appear
    const taskItem = page.locator(`[data-testid="task-item"]:has-text("${taskDescription}")`);
    await expect(taskItem).toBeVisible();

    // Check initial status
    await expect(taskItem.locator('[data-testid="task-status"]')).toContainText('pending');

    // Simulate task starting (this would normally come from WebSocket)
    await page.evaluate(() => {
      // Mock WebSocket message for task update
      window.dispatchEvent(new CustomEvent('taskUpdate', {
        detail: { taskId: 'test-task-id', status: 'running' }
      }));
    });

    // Check status updated
    await expect(taskItem.locator('[data-testid="task-status"]')).toContainText('running');
  });

  test('should display task progress and completion', async ({ page }) => {
    // Create a task
    const taskDescription = 'Progress test task';
    await page.fill('[data-testid="task-input"]', taskDescription);
    await page.click('[data-testid="create-task-btn"]');

    const taskItem = page.locator(`[data-testid="task-item"]:has-text("${taskDescription}")`);

    // Simulate progress updates
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('taskProgress', {
        detail: { taskId: 'test-task-id', progress: 50, message: 'Processing data...' }
      }));
    });

    // Check progress indicator
    await expect(taskItem.locator('[data-testid="task-progress"]')).toContainText('50%');
    await expect(taskItem.locator('[data-testid="task-progress-message"]')).toContainText('Processing data...');

    // Simulate completion
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('taskUpdate', {
        detail: { taskId: 'test-task-id', status: 'completed', progress: 100 }
      }));
    });

    await expect(taskItem.locator('[data-testid="task-status"]')).toContainText('completed');
    await expect(taskItem.locator('[data-testid="task-progress"]')).toContainText('100%');
  });

  test('should handle task deletion', async ({ page }) => {
    // Create multiple tasks
    const tasks = ['Task to delete 1', 'Task to delete 2', 'Keep this task'];

    for (const taskDesc of tasks) {
      await page.fill('[data-testid="task-input"]', taskDesc);
      await page.click('[data-testid="create-task-btn"]');
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${taskDesc}")`);
    }

    // Delete first task
    const firstTask = page.locator('[data-testid="task-item"]').first();
    await firstTask.locator('[data-testid="task-delete-btn"]').click();

    // Confirm deletion if dialog appears
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    if (await confirmDialog.isVisible()) {
      await page.click('[data-testid="confirm-yes"]');
    }

    // Verify task is removed
    await expect(page.locator('[data-testid="task-item"]')).toHaveCount(tasks.length - 1);
    await expect(page.locator(`[data-testid="task-item"]:has-text("${tasks[0]}")`)).not.toBeVisible();

    // Verify other tasks remain
    await expect(page.locator(`[data-testid="task-item"]:has-text("${tasks[1]}")`)).toBeVisible();
    await expect(page.locator(`[data-testid="task-item"]:has-text("${tasks[2]}")`)).toBeVisible();
  });

  test('should handle task editing', async ({ page }) => {
    // Create a task
    const originalDescription = 'Original task description';
    await page.fill('[data-testid="task-input"]', originalDescription);
    await page.click('[data-testid="create-task-btn"]');

    const taskItem = page.locator(`[data-testid="task-item"]:has-text("${originalDescription}")`);

    // Click edit button
    await taskItem.locator('[data-testid="task-edit-btn"]').click();

    // Edit the description
    const newDescription = 'Updated task description';
    await page.fill('[data-testid="task-edit-input"]', newDescription);
    await page.click('[data-testid="task-save-btn"]');

    // Verify task is updated
    await expect(page.locator(`[data-testid="task-item"]:has-text("${newDescription}")`)).toBeVisible();
    await expect(page.locator(`[data-testid="task-item"]:has-text("${originalDescription}")`)).not.toBeVisible();
  });

  test('should handle concurrent tasks', async ({ page }) => {
    // Create multiple tasks quickly
    const tasks = ['Concurrent task 1', 'Concurrent task 2', 'Concurrent task 3'];

    // Use Promise.all to create tasks concurrently
    await Promise.all(tasks.map(async (taskDesc) => {
      await page.fill('[data-testid="task-input"]', taskDesc);
      await page.click('[data-testid="create-task-btn"]');
    }));

    // Wait for all tasks to appear
    for (const taskDesc of tasks) {
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${taskDesc}")`);
    }

    // Verify all tasks are present
    await expect(page.locator('[data-testid="task-item"]')).toHaveCount(tasks.length);
  });

  test('should persist tasks across page reloads', async ({ page }) => {
    // Create a task
    const taskDescription = 'Persistent task test';
    await page.fill('[data-testid="task-input"]', taskDescription);
    await page.click('[data-testid="create-task-btn"]');

    await page.waitForSelector(`[data-testid="task-item"]:has-text("${taskDescription}")`);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate back to desktop screen
    await page.click('[data-testid="screen-desktop"]');
    await page.waitForSelector('[data-testid="desktop-screen"]');

    // Verify task persists
    await expect(page.locator(`[data-testid="task-item"]:has-text("${taskDescription}")`)).toBeVisible();
  });

  test('should handle task filtering and search', async ({ page }) => {
    // Create tasks with different content
    const tasks = [
      'Analyze sales data',
      'Generate report',
      'Process invoices',
      'Customer insights'
    ];

    for (const taskDesc of tasks) {
      await page.fill('[data-testid="task-input"]', taskDesc);
      await page.click('[data-testid="create-task-btn"]');
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${taskDesc}")`);
    }

    // Test search functionality
    await page.fill('[data-testid="task-search"]', 'sales');
    await expect(page.locator('[data-testid="task-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="task-item"]')).toContainText('Analyze sales data');

    // Test filter by status
    await page.fill('[data-testid="task-search"]', ''); // Clear search
    await page.selectOption('[data-testid="task-status-filter"]', 'pending');
    await expect(page.locator('[data-testid="task-item"]')).toHaveCount(tasks.length);

    // Test clearing filters
    await page.click('[data-testid="clear-filters-btn"]');
    await expect(page.locator('[data-testid="task-item"]')).toHaveCount(tasks.length);
  });
});