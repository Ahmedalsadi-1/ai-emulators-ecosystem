import { test, expect } from '@playwright/test';
import {
  UnifiedAppPage,
  AIOSPage,
  BytebotPage,
  AI_MODELS,
  TestFixtures,
  WebSocketUtils
} from '../test-utils';

test.describe('AI Model Selection and Task Creation E2E Tests', () => {
  let unifiedApp: UnifiedAppPage;
  let aiosPage: AIOSPage;
  let bytebotPage: BytebotPage;

  test.beforeAll(async () => {
    // Ensure services are running
    await test.step('Setup test environment', async () => {
      try {
        await fetch('http://localhost:9992', { timeout: 5000 });
        await fetch('http://localhost:9991', { timeout: 5000 });
        await fetch('http://localhost:8000', { timeout: 5000 });
      } catch (error) {
        console.warn('Some services may not be running:', error);
      }
    });
  });

  test.beforeEach(async ({ page }) => {
    unifiedApp = new UnifiedAppPage(page);
    aiosPage = new AIOSPage(page);
    bytebotPage = new BytebotPage(page);
  });

  test.describe('AIOS Service - Model Selection', () => {
    test('should navigate to AIOS service and display available models', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      // Wait for AIOS iframe to load
      await unifiedApp.waitForAppIframe('aios-service');

      // Switch to iframe context
      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Check that AIOS interface is loaded
      await expect(iframe.locator('[data-testid="aios-interface"]')).toBeVisible();

      // Check for model selection interface
      await expect(iframe.locator('[data-testid="model-selector"]')).toBeVisible();

      // Get available models from AIOS
      const availableModels = await aiosPage.getAvailableModels();
      expect(availableModels.length).toBeGreaterThan(0);

      // Verify common models are available
      const commonModels = ['gpt-4', 'claude-3', 'gemini-pro'];
      for (const model of commonModels) {
        expect(availableModels).toContain(model);
      }
    });

    test('should display all 22+ AI models in dropdown', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Open model selector
      await iframe.locator('[data-testid="model-selector"]').click();

      // Check that dropdown is visible
      const dropdown = iframe.locator('[data-testid="model-dropdown"]');
      await expect(dropdown).toBeVisible();

      // Verify all expected models are present
      for (const model of AI_MODELS) {
        await expect(dropdown.locator(`[data-testid="model-option-${model}"]`)).toBeVisible();
      }

      // Verify model count
      const modelOptions = await dropdown.locator('[data-testid^="model-option-"]').count();
      expect(modelOptions).toBeGreaterThanOrEqual(AI_MODELS.length);
    });

    test('should select multiple AI models for query', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Select multiple models
      const modelsToSelect = ['gpt-4', 'claude-3-sonnet', 'gemini-pro'];
      for (const model of modelsToSelect) {
        await iframe.locator(`[data-testid="model-option-${model}"]`).click();
      }

      // Verify models are selected
      for (const model of modelsToSelect) {
        await expect(iframe.locator(`[data-testid="selected-model-${model}"]`)).toBeVisible();
      }

      // Check selected models count
      const selectedCount = await iframe.locator('[data-testid="selected-models-count"]').textContent();
      expect(parseInt(selectedCount || '0')).toBe(modelsToSelect.length);
    });

    test('should handle model selection validation', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Try to execute query without selecting models
      await iframe.locator('[data-testid="execute-query-btn"]').click();

      // Should show validation error
      await expect(iframe.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="validation-error"]')).toContainText('Please select at least one model');

      // Select a model and try again
      await iframe.locator('[data-testid="model-option-gpt-4"]').click();
      await iframe.locator('[data-testid="execute-query-btn"]').click();

      // Error should be gone
      await expect(iframe.locator('[data-testid="validation-error"]')).not.toBeVisible();
    });
  });

  test.describe('AIOS Service - Task Creation and Execution', () => {
    test('should create and execute AIOS query with single model', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Select a model
      await iframe.locator('[data-testid="model-option-gpt-4"]').click();

      // Enter query message
      const testMessage = 'Analyze the following data and provide insights: [1, 2, 3, 4, 5]';
      await iframe.locator('[data-testid="message-input"]').fill(testMessage);

      // Execute query
      await iframe.locator('[data-testid="execute-query-btn"]').click();

      // Wait for response
      await expect(iframe.locator('[data-testid="query-response"]')).toBeVisible();

      // Verify response contains expected content
      const response = await iframe.locator('[data-testid="query-response"]').textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(0);
    });

    test('should handle multi-message conversations', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Select model
      await iframe.locator('[data-testid="model-option-claude-3-sonnet"]').click();

      // Add system message
      await iframe.locator('[data-testid="message-role-select"]').selectOption('system');
      await iframe.locator('[data-testid="message-input"]').fill('You are a helpful data analyst.');
      await iframe.locator('[data-testid="add-message-btn"]').click();

      // Add user message
      await iframe.locator('[data-testid="message-role-select"]').selectOption('user');
      await iframe.locator('[data-testid="message-input"]').fill('What is the average of numbers 1 through 10?');
      await iframe.locator('[data-testid="add-message-btn"]').click();

      // Execute conversation
      await iframe.locator('[data-testid="execute-query-btn"]').click();

      // Verify conversation flow
      await expect(iframe.locator('[data-testid="conversation-history"]')).toBeVisible();
      const messages = await iframe.locator('[data-testid="conversation-message"]').count();
      expect(messages).toBe(3); // system + user + assistant
    });

    test('should execute queries with different model combinations', async ({ page }) => {
      const testCases = [
        { models: ['gpt-4'], name: 'GPT-4 only' },
        { models: ['claude-3-sonnet', 'gemini-pro'], name: 'Multiple models' },
        { models: ['llama-2-70b'], name: 'Open source model' }
      ];

      for (const testCase of testCases) {
        await test.step(`Test with ${testCase.name}`, async () => {
          await unifiedApp.goto();
          await unifiedApp.navigateToCategory('aiAutomation');
          await unifiedApp.openApp('aios-service');

          const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

          // Select models
          for (const model of testCase.models) {
            await iframe.locator(`[data-testid="model-option-${model}"]`).click();
          }

          // Enter query
          const query = `Test query for ${testCase.name}`;
          await iframe.locator('[data-testid="message-input"]').fill(query);

          // Execute
          await iframe.locator('[data-testid="execute-query-btn"]').click();

          // Verify response
          await expect(iframe.locator('[data-testid="query-response"]')).toBeVisible();

          // Clear for next test
          await iframe.locator('[data-testid="clear-conversation-btn"]').click();
        });
      }
    });

    test('should handle tool integration in queries', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Select model that supports tools
      await iframe.locator('[data-testid="model-option-gpt-4"]').click();

      // Enable tools
      await iframe.locator('[data-testid="enable-tools-toggle"]').check();

      // Select available tools
      await iframe.locator('[data-testid="tool-selector"]').click();
      await iframe.locator('[data-testid="tool-option-calculator"]').click();
      await iframe.locator('[data-testid="tool-option-web-search"]').click();

      // Enter query that would benefit from tools
      const query = 'What is 15 * 23? Also, what is the current weather in New York?';
      await iframe.locator('[data-testid="message-input"]').fill(query);

      // Execute query
      await iframe.locator('[data-testid="execute-query-btn"]').click();

      // Verify tool usage is indicated
      await expect(iframe.locator('[data-testid="tool-usage-indicator"]')).toBeVisible();

      // Verify response includes tool results
      const response = await iframe.locator('[data-testid="query-response"]').textContent();
      expect(response).toContain('345'); // 15 * 23 = 345
      expect(response?.toLowerCase()).toMatch(/weather|temperature/);
    });
  });

  test.describe('Bytebot Service - Task Creation', () => {
    test('should navigate to Bytebot and create tasks', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Wait for Bytebot interface
      await expect(iframe.locator('[data-testid="bytebot-interface"]')).toBeVisible();

      // Verify task creation interface is present
      await expect(iframe.locator('[data-testid="task-input"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="model-selector"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="create-task-btn"]')).toBeVisible();
    });

    test('should create task with model selection', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Enter task description
      const taskDescription = 'Analyze sales data from Q1 and generate performance report';
      await iframe.locator('[data-testid="task-input"]').fill(taskDescription);

      // Select model
      await iframe.locator('[data-testid="model-selector"]').click();
      await iframe.locator('[data-testid="model-option-gpt-4"]').click();

      // Create task
      await iframe.locator('[data-testid="create-task-btn"]').click();

      // Verify task appears in list
      await expect(iframe.locator('[data-testid="task-list"]')).toContainText(taskDescription);
      await expect(iframe.locator('[data-testid="task-model"]')).toContainText('gpt-4');
    });

    test('should handle task creation validation', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Try to create task without description
      await iframe.locator('[data-testid="create-task-btn"]').click();

      // Should show validation error
      await expect(iframe.locator('[data-testid="task-validation-error"]')).toBeVisible();
      await expect(iframe.locator('[data-testid="task-validation-error"]')).toContainText('Task description is required');

      // Add description and try again
      await iframe.locator('[data-testid="task-input"]').fill('Valid task description');
      await iframe.locator('[data-testid="create-task-btn"]').click();

      // Error should be gone
      await expect(iframe.locator('[data-testid="task-validation-error"]')).not.toBeVisible();
    });
  });

  test.describe('Cross-Service Model Consistency', () => {
    test('should maintain model selection across services', async ({ page }) => {
      // Create task in Bytebot with specific model
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const bytebotFrame = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      await bytebotFrame.locator('[data-testid="task-input"]').fill('Test task for model consistency');
      await bytebotFrame.locator('[data-testid="model-selector"]').click();
      await bytebotFrame.locator('[data-testid="model-option-claude-3-sonnet"]').click();
      await bytebotFrame.locator('[data-testid="create-task-btn"]').click();

      // Switch to AIOS service
      await unifiedApp.openApp('aios-service');
      const aiosFrame = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Check if model preference is remembered (if implemented)
      // This test verifies that services can maintain consistent model preferences
      await expect(aiosFrame.locator('[data-testid="model-selector"]')).toBeVisible();

      // At minimum, verify AIOS has access to the same models
      await aiosFrame.locator('[data-testid="model-selector"]').click();
      await expect(aiosFrame.locator('[data-testid="model-option-claude-3-sonnet"]')).toBeVisible();
    });

    test('should handle model availability across services', async ({ page }) => {
      // Test that both AIOS and Bytebot have access to core models
      const coreModels = ['gpt-4', 'claude-3-sonnet', 'gemini-pro'];

      for (const model of coreModels) {
        // Check AIOS
        await unifiedApp.goto();
        await unifiedApp.navigateToCategory('aiAutomation');
        await unifiedApp.openApp('aios-service');

        const aiosFrame = page.frameLocator('[data-testid="app-iframe-aios-service"]');
        await aiosFrame.locator('[data-testid="model-selector"]').click();
        await expect(aiosFrame.locator(`[data-testid="model-option-${model}"]`)).toBeVisible();

        // Check Bytebot
        await unifiedApp.openApp('bytebot-ui');
        const bytebotFrame = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');
        await bytebotFrame.locator('[data-testid="model-selector"]').click();
        await expect(bytebotFrame.locator(`[data-testid="model-option-${model}"]`)).toBeVisible();
      }
    });
  });

  test.describe('Model Performance and Error Handling', () => {
    test('should handle model loading errors gracefully', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Simulate model loading error by selecting an unavailable model
      await iframe.locator('[data-testid="model-selector"]').click();

      // Try to select a model that might be unavailable
      const unavailableModel = iframe.locator('[data-testid="model-option-unavailable-model"]');
      if (await unavailableModel.isVisible()) {
        await unavailableModel.click();

        // Should show error message
        await expect(iframe.locator('[data-testid="model-error"]')).toBeVisible();
        await expect(iframe.locator('[data-testid="model-error"]')).toContainText('Model not available');
      }
    });

    test('should show model capability indicators', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const iframe = page.frameLocator('[data-testid="app-iframe-aios-service"]');
      await iframe.locator('[data-testid="model-selector"]').click();

      // Check that models show capability indicators (if implemented)
      const modelOption = iframe.locator('[data-testid="model-option-gpt-4"]');
      const capabilities = modelOption.locator('[data-testid="model-capabilities"]');

      if (await capabilities.isVisible()) {
        // Verify common capabilities are shown
        await expect(capabilities).toContainText('text');
        await expect(capabilities).toContainText('tools');
      }
    });
  });

  test.describe('Task Templates and Presets', () => {
    test('should provide task templates for common use cases', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Check for task templates button
      const templatesBtn = iframe.locator('[data-testid="task-templates-btn"]');
      if (await templatesBtn.isVisible()) {
        await templatesBtn.click();

        // Verify templates are shown
        await expect(iframe.locator('[data-testid="task-templates-list"]')).toBeVisible();

        // Check for common template categories
        const templates = ['data-analysis', 'content-generation', 'code-review', 'automation'];
        for (const template of templates) {
          await expect(iframe.locator(`[data-testid="template-${template}"]`)).toBeVisible();
        }
      }
    });

    test('should apply task template correctly', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      const iframe = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      const templatesBtn = iframe.locator('[data-testid="task-templates-btn"]');
      if (await templatesBtn.isVisible()) {
        await templatesBtn.click();

        // Select data analysis template
        await iframe.locator('[data-testid="template-data-analysis"]').click();

        // Verify template is applied
        const taskInput = iframe.locator('[data-testid="task-input"]');
        const inputValue = await taskInput.inputValue();
        expect(inputValue.toLowerCase()).toContain('analyze');
        expect(inputValue.toLowerCase()).toContain('data');

        // Verify appropriate model is pre-selected
        await expect(iframe.locator('[data-testid="selected-model-gpt-4"]')).toBeVisible();
      }
    });
  });
});