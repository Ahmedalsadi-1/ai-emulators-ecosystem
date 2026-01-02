// Test utilities for E2E tests
export class TestHelper {
  static async waitForAppLoad(page: any) {
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  }

  static async loginIfNeeded(page: any, username = 'testuser', password = 'testpass') {
    // Implement login logic if authentication is required
    // This is a placeholder - adjust based on your auth system
  }

  static async navigateToScreen(page: any, screenName: string) {
    await page.click(`[data-testid="screen-${screenName}"]`);
    await page.waitForSelector(`[data-testid="screen-${screenName}-loaded"]`);
  }

  static async createTestTask(page: any, taskDescription: string) {
    await page.fill('[data-testid="task-input"]', taskDescription);
    await page.click('[data-testid="create-task-btn"]');
    await page.waitForSelector('[data-testid="task-created"]');
  }

  static async selectModel(page: any, modelName: string) {
    await page.click('[data-testid="model-selector"]');
    await page.click(`[data-testid="model-${modelName}"]`);
  }

  static async waitForWebSocketConnection(page: any) {
    await page.waitForSelector('[data-testid="websocket-connected"]');
  }

  static async waitForTaskCompletion(page: any, taskId: string) {
    await page.waitForSelector(`[data-testid="task-${taskId}-completed"]`, { timeout: 30000 });
  }
}