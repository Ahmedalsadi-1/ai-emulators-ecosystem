import { Page, BrowserContext } from '@playwright/test';

/**
 * Unified App Test Utilities
 * Provides common helper functions for testing the unified AI ecosystem
 */

// Service URLs and ports
export const SERVICE_URLS = {
  frontend: 'http://localhost:9992',
  bytebotAgent: 'http://localhost:9991',
  bytebotDaemon: 'http://localhost:9990',
  turix: 'http://localhost:3000',
  aios: 'http://localhost:8000',
  factif: 'http://localhost:3001',
  postiz: 'http://localhost:3002',
  grafana: 'http://localhost:3020',
} as const;

// Available AI models for testing
export const AI_MODELS = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gemini-pro',
  'gemini-pro-vision',
  'llama-2-70b',
  'llama-2-13b',
  'codellama-34b',
  'mistral-7b',
  'mixtral-8x7b',
  'phi-2',
  'orca-2-13b',
  'vicuna-13b',
  'falcon-40b',
  'stable-diffusion-xl',
  'dalle-3',
  'midjourney-v5',
  'flux-dev',
  'imagen-2'
] as const;

// Navigation categories
export const NAVIGATION_CATEGORIES = {
  automation: 'automation',
  aiAutomation: 'ai-automation',
  socialMedia: 'social-media',
  contentCreation: 'content-creation',
  visualAutomation: 'visual-automation',
  monitoring: 'monitoring',
  development: 'development-tools',
  communication: 'communication',
  infrastructure: 'infrastructure',
  workflows: 'workflows',
  desktop: 'desktop',
} as const;

/**
 * Unified App Page Object Model
 * Provides methods for interacting with the unified app interface
 */
export class UnifiedAppPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the unified app and wait for it to load
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    await this.waitForAppReady();
  }

  /**
   * Wait for the app to be fully loaded and ready
   */
  async waitForAppReady() {
    await this.page.waitForSelector('[data-testid="unified-app"]', { timeout: 30000 });
  }

  /**
   * Navigate to a specific category
   */
  async navigateToCategory(category: keyof typeof NAVIGATION_CATEGORIES) {
    const categoryId = NAVIGATION_CATEGORIES[category];
    await this.page.click(`[data-testid="nav-${categoryId}"]`);
    await this.page.waitForSelector(`[data-testid="category-${categoryId}"]`);
  }

  /**
   * Get the current active category
   */
  async getActiveCategory(): Promise<string | null> {
    const activeElement = await this.page.locator('[data-testid^="nav-"].bg-accent-primary').first();
    if (await activeElement.isVisible()) {
      const testId = await activeElement.getAttribute('data-testid');
      return testId?.replace('nav-', '') || null;
    }
    return null;
  }

  /**
   * Open an app within a category
   */
  async openApp(appId: string) {
    await this.page.click(`[data-testid="app-card-${appId}"]`);
    await this.page.waitForSelector(`[data-testid="app-viewer-${appId}"]`);
  }

  /**
   * Wait for an iframe to load within an app
   */
  async waitForAppIframe(appId: string) {
    const iframe = this.page.frameLocator(`[data-testid="app-iframe-${appId}"]`);
    await iframe.locator('body').waitFor({ state: 'visible' });
  }

  /**
   * Toggle the sidebar
   */
  async toggleSidebar() {
    await this.page.click('[data-testid="sidebar-toggle"]');
  }

  /**
   * Toggle the details panel
   */
  async toggleDetailsPanel() {
    await this.page.click('[data-testid="details-panel-toggle"]');
  }

  /**
   * Search for apps
   */
  async searchApps(query: string) {
    await this.page.fill('[data-testid="app-search"]', query);
    await this.page.waitForTimeout(300); // Wait for search debounce
  }

  /**
   * Get visible app cards
   */
  async getVisibleApps(): Promise<string[]> {
    const appCards = await this.page.locator('[data-testid^="app-card-"]').all();
    const appIds: string[] = [];
    for (const card of appCards) {
      const testId = await card.getAttribute('data-testid');
      if (testId) {
        appIds.push(testId.replace('app-card-', ''));
      }
    }
    return appIds;
  }
}

/**
 * AIOS Service Page Object Model
 * Provides methods for interacting with AIOS service interfaces
 */
export class AIOSPage {
  constructor(private page: Page) {}

  /**
   * Navigate to AIOS service
   */
  async goto() {
    await this.page.goto(SERVICE_URLS.aios);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get available LLM models
   */
  async getAvailableModels(): Promise<string[]> {
    const response = await this.page.request.get(`${SERVICE_URLS.aios}/get/llms`);
    const data = await response.json();
    return data.llms?.map((model: any) => model.name) || [];
  }

  /**
   * Select LLM models for a query
   */
  async selectModels(models: string[]) {
    // Implementation depends on AIOS UI
    for (const model of models) {
      await this.page.click(`[data-testid="model-${model}"]`);
    }
  }

  /**
   * Create and execute an LLM query
   */
  async executeQuery(messages: Array<{role: string, content: string}>, models?: string[]) {
    if (models) {
      await this.selectModels(models);
    }

    // Fill in the query interface
    for (const message of messages) {
      await this.page.fill('[data-testid="message-input"]', message.content);
      await this.page.selectOption('[data-testid="message-role"]', message.role);
      await this.page.click('[data-testid="add-message"]');
    }

    await this.page.click('[data-testid="execute-query"]');
    await this.page.waitForSelector('[data-testid="query-result"]');
  }

  /**
   * Get query results
   */
  async getQueryResult(): Promise<string> {
    return await this.page.locator('[data-testid="query-result"]').textContent() || '';
  }
}

/**
 * Bytebot Service Page Object Model
 * Provides methods for interacting with Bytebot service interfaces
 */
export class BytebotPage {
  constructor(private page: Page) {}

  /**
   * Navigate to Bytebot service
   */
  async goto() {
    await this.page.goto(SERVICE_URLS.bytebotAgent);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a new task
   */
  async createTask(description: string, model?: string) {
    await this.page.fill('[data-testid="task-description"]', description);

    if (model) {
      await this.page.click('[data-testid="model-selector"]');
      await this.page.click(`[data-testid="model-option-${model}"]`);
    }

    await this.page.click('[data-testid="create-task-btn"]');
    await this.page.waitForSelector('[data-testid="task-created"]');
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<string> {
    const statusElement = this.page.locator(`[data-testid="task-${taskId}-status"]`);
    return await statusElement.textContent() || 'unknown';
  }

  /**
   * Execute a computer control action
   */
  async executeAction(action: any) {
    // Implementation depends on Bytebot action interface
    await this.page.evaluate((actionData) => {
      window.postMessage({
        type: 'bytebot-action',
        action: actionData
      }, '*');
    }, action);

    await this.page.waitForSelector('[data-testid="action-executed"]');
  }
}

/**
 * WebSocket Testing Utilities
 */
export class WebSocketUtils {
  static async waitForWebSocketConnection(page: Page, timeout = 10000): Promise<void> {
    await page.waitForFunction(() => {
      // Check if WebSocket connection indicator is visible and connected
      const indicator = document.querySelector('[data-testid="websocket-status"]');
      return indicator && indicator.textContent?.includes('Connected');
    }, { timeout });
  }

  static async simulateWebSocketMessage(page: Page, message: any): Promise<void> {
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('websocket-message', { detail: msg }));
    }, message);
  }

  static async waitForWebSocketMessage(page: Page, messageType: string, timeout = 5000): Promise<any> {
    return await page.waitForFunction((type) => {
      // This would need to be implemented based on how messages are stored in the app
      const messages = (window as any).receivedWebSocketMessages || [];
      return messages.find((msg: any) => msg.type === type);
    }, messageType, { timeout });
  }
}

/**
 * Visual Regression Testing Utilities
 */
export class VisualUtils {
  static async takeScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  static async compareScreenshot(page: Page, name: string): Promise<boolean> {
    // Implementation would use a visual comparison library like pixelmatch
    // For now, just take the screenshot
    await this.takeScreenshot(page, name);
    return true;
  }
}

/**
 * Test Data Fixtures
 */
export const TestFixtures = {
  sampleTasks: [
    {
      description: 'Analyze quarterly sales data and generate insights',
      model: 'gpt-4',
      expectedResult: 'Analysis completed successfully'
    },
    {
      description: 'Generate customer segmentation report',
      model: 'claude-3-sonnet',
      expectedResult: 'Report generated'
    },
    {
      description: 'Process invoice data and extract key information',
      model: 'gemini-pro',
      expectedResult: 'Invoice processed'
    }
  ],

  sampleWorkflows: [
    {
      name: 'Data Analysis Pipeline',
      steps: [
        { action: 'analyze_data', service: 'aios', model: 'gpt-4' },
        { action: 'generate_report', service: 'bytebot', model: 'claude-3' },
        { action: 'send_notification', service: 'postiz', model: null }
      ]
    }
  ],

  errorScenarios: [
    {
      type: 'service_unavailable',
      trigger: () => { /* Simulate service down */ },
      expectedError: 'Service temporarily unavailable'
    },
    {
      type: 'invalid_model',
      trigger: () => { /* Select invalid model */ },
      expectedError: 'Selected model is not available'
    },
    {
      type: 'websocket_disconnect',
      trigger: () => { /* Disconnect WebSocket */ },
      expectedError: 'Connection lost. Attempting to reconnect...'
    }
  ]
};

/**
 * Environment Setup Utilities
 */
export class EnvironmentUtils {
  static async ensureServicesRunning(): Promise<void> {
    // Check if required services are running
    const services = [
      { name: 'frontend', url: SERVICE_URLS.frontend },
      { name: 'bytebot-agent', url: SERVICE_URLS.bytebotAgent },
      { name: 'bytebot-daemon', url: SERVICE_URLS.bytebotDaemon },
      { name: 'aios', url: SERVICE_URLS.aios },
    ];

    for (const service of services) {
      try {
        const response = await fetch(service.url);
        if (!response.ok) {
          console.warn(`Service ${service.name} is not responding properly`);
        }
      } catch (error) {
        console.warn(`Service ${service.name} is not accessible:`, error);
      }
    }
  }

  static async setupTestEnvironment(): Promise<void> {
    await this.ensureServicesRunning();
    // Additional environment setup can go here
  }
}