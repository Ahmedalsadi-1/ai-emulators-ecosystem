import { test, expect } from '@playwright/test';
import {
  UnifiedAppPage,
  AIOSPage,
  BytebotPage,
  WebSocketUtils,
  TestFixtures,
  SERVICE_URLS
} from '../test-utils';

test.describe('Complete User Workflow E2E Tests', () => {
  let unifiedApp: UnifiedAppPage;
  let aiosPage: AIOSPage;
  let bytebotPage: BytebotPage;

  test.beforeEach(async ({ page }) => {
    unifiedApp = new UnifiedAppPage(page);
    aiosPage = new AIOSPage(page);
    bytebotPage = new BytebotPage(page);
  });

  test.describe('Data Analysis Workflow', () => {
    test('should complete full data analysis workflow from start to finish', async ({ page }) => {
      // Step 1: Navigate to the application
      await unifiedApp.goto();

      // Step 2: Navigate to AI Automation category
      await unifiedApp.navigateToCategory('aiAutomation');

      // Step 3: Open AIOS service for AI model selection
      await unifiedApp.openApp('aios-service');
      const aiosFrame = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Step 4: Select appropriate AI model for data analysis
      await aiosFrame.locator('[data-testid="model-selector"]').click();
      await aiosFrame.locator('[data-testid="model-option-gpt-4"]').click();

      // Step 5: Create analysis query
      const analysisQuery = 'Analyze this sales data and identify trends: Q1: $120K, Q2: $150K, Q3: $180K, Q4: $200K';
      await aiosFrame.locator('[data-testid="message-input"]').fill(analysisQuery);
      await aiosFrame.locator('[data-testid="execute-query-btn"]').click();

      // Step 6: Wait for AI analysis result
      await expect(aiosFrame.locator('[data-testid="query-response"]')).toBeVisible();
      const analysisResult = await aiosFrame.locator('[data-testid="query-response"]').textContent();
      expect(analysisResult?.toLowerCase()).toMatch(/trend|increase|growth|analysis/i);

      // Step 7: Switch to Bytebot for task creation
      await unifiedApp.openApp('bytebot-ui');
      const bytebotFrame = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Step 8: Create task based on analysis
      const taskDescription = `Generate quarterly sales report based on analysis: ${analysisResult?.substring(0, 100)}...`;
      await bytebotFrame.locator('[data-testid="task-input"]').fill(taskDescription);
      await bytebotFrame.locator('[data-testid="model-selector"]').click();
      await bytebotFrame.locator('[data-testid="model-option-claude-3-sonnet"]').click();
      await bytebotFrame.locator('[data-testid="create-task-btn"]').click();

      // Step 9: Verify task creation and monitor progress
      await expect(bytebotFrame.locator('[data-testid="task-list"]')).toContainText('sales report');

      // Step 10: Open terminal to check system resources
      await bytebotFrame.locator('[data-testid="terminal-toggle"]').click();
      await WebSocketUtils.waitForWebSocketConnection(page);

      // Step 11: Execute terminal command to check system status
      await bytebotFrame.locator('[data-testid="terminal-input"]').fill('df -h');
      await bytebotFrame.locator('[data-testid="terminal-input"]').press('Enter');

      // Step 12: Verify workflow completion
      await expect(bytebotFrame.locator('[data-testid="task-status"]')).toContainText('completed');
    });
  });

  test.describe('Content Creation Workflow', () => {
    test('should complete full content creation workflow', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('contentCreation');

      // Open video generation service
      await unifiedApp.openApp('wan2gp-video-generation');
      const videoFrame = page.frameLocator('[data-testid="app-iframe-wan2gp-video-generation"]');

      // Configure video generation parameters
      await videoFrame.locator('[data-testid="prompt-input"]').fill('A beautiful sunset over mountains with flowing water');
      await videoFrame.locator('[data-testid="duration-select"]').selectOption('5');
      await videoFrame.locator('[data-testid="generate-btn"]').click();

      // Monitor generation progress
      await expect(videoFrame.locator('[data-testid="generation-progress"]')).toBeVisible();

      // Wait for completion (this would be a long operation in real scenario)
      // For testing, we'll simulate completion
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'generation_complete',
        payload: { videoId: 'test-video-123', url: '/videos/generated.mp4' }
      });

      // Verify video generation result
      await expect(videoFrame.locator('[data-testid="video-result"]')).toBeVisible();

      // Switch to Postiz for social media scheduling
      await unifiedApp.openApp('postiz-social-media');
      const postizFrame = page.frameLocator('[data-testid="app-iframe-postiz-social-media"]');

      // Create social media post with generated video
      await postizFrame.locator('[data-testid="post-content"]').fill('Check out this amazing AI-generated video! #AI #VideoGeneration');
      await postizFrame.locator('[data-testid="attach-media-btn"]').click();
      await postizFrame.locator('[data-testid="schedule-post-btn"]').click();

      // Verify post scheduling
      await expect(postizFrame.locator('[data-testid="post-scheduled"]')).toBeVisible();
    });
  });

  test.describe('Automation Workflow', () => {
    test('should create and execute cross-environment automation workflow', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('automation');

      // Open unified automation service
      await unifiedApp.openApp('unified-automation');
      const automationFrame = page.frameLocator('[data-testid="app-iframe-unified-automation"]');

      // Navigate to workflows section
      await automationFrame.locator('[data-testid="workflows-tab"]').click();

      // Create new workflow
      await automationFrame.locator('[data-testid="create-workflow-btn"]').click();
      await automationFrame.locator('[data-testid="workflow-name"]').fill('Data Processing Pipeline');
      await automationFrame.locator('[data-testid="workflow-description"]').fill('Automated data processing from collection to reporting');
      await automationFrame.locator('[data-testid="save-workflow-btn"]').click();

      // Add workflow steps
      const steps = [
        { service: 'bytebot-ui', action: 'collect_data', environment: 'desktop' },
        { service: 'aios-service', action: 'process_data', environment: 'ai' },
        { service: 'postiz-app', action: 'generate_report', environment: 'content' }
      ];

      for (let i = 0; i < steps.length; i++) {
        await automationFrame.locator('[data-testid="add-step-btn"]').click();
        await automationFrame.locator(`[data-testid="step-${i}-service"]`).selectOption(steps[i].service);
        await automationFrame.locator(`[data-testid="step-${i}-action"]`).fill(steps[i].action);
        await automationFrame.locator(`[data-testid="step-${i}-environment"]`).selectOption(steps[i].environment);
      }

      // Execute workflow
      await automationFrame.locator('[data-testid="execute-workflow-btn"]').click();

      // Monitor workflow progress
      await expect(automationFrame.locator('[data-testid="workflow-status"]')).toContainText('running');

      // Simulate step completions
      for (let i = 0; i < steps.length; i++) {
        await WebSocketUtils.simulateWebSocketMessage(page, {
          type: 'workflow_step_complete',
          payload: { workflowId: 'test-workflow', stepIndex: i, status: 'completed' }
        });
      }

      // Verify workflow completion
      await expect(automationFrame.locator('[data-testid="workflow-status"]')).toContainText('completed');
    });
  });

  test.describe('Desktop Environment Workflow', () => {
    test('should complete desktop automation workflow', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('desktop');

      // Open VNC desktop environment
      await unifiedApp.openApp('bytebot-vnc-desktop');
      const vncFrame = page.frameLocator('[data-testid="app-iframe-bytebot-vnc-desktop"]');

      // Wait for VNC connection
      await expect(vncFrame.locator('[data-testid="vnc-connected"]')).toBeVisible();

      // Start recording automation
      await vncFrame.locator('[data-testid="record-automation-btn"]').click();
      await expect(vncFrame.locator('[data-testid="recording-indicator"]')).toBeVisible();

      // Simulate user interactions (mouse clicks, typing)
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'automation_action',
        payload: { action: 'click', x: 100, y: 100 }
      });

      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'automation_action',
        payload: { action: 'type_text', text: 'Hello World' }
      });

      // Stop recording
      await vncFrame.locator('[data-testid="stop-recording-btn"]').click();

      // Save automation script
      await vncFrame.locator('[data-testid="save-script-btn"]').click();
      await vncFrame.locator('[data-testid="script-name"]').fill('Test Automation');
      await vncFrame.locator('[data-testid="confirm-save-btn"]').click();

      // Verify script saved
      await expect(vncFrame.locator('[data-testid="script-saved"]')).toBeVisible();

      // Play back automation
      await vncFrame.locator('[data-testid="play-script-btn"]').click();

      // Monitor playback
      await expect(vncFrame.locator('[data-testid="playback-progress"]')).toBeVisible();

      // Verify playback completion
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'playback_complete',
        payload: { scriptId: 'test-script', status: 'completed' }
      });

      await expect(vncFrame.locator('[data-testid="playback-completed"]')).toBeVisible();
    });
  });

  test.describe('Cross-Service Communication Workflow', () => {
    test('should demonstrate service integration and data flow', async ({ page }) => {
      // Start with AIOS for initial data analysis
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      const aiosFrame = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      // Create analysis request
      await aiosFrame.locator('[data-testid="model-selector"]').click();
      await aiosFrame.locator('[data-testid="model-option-gpt-4"]').click();
      await aiosFrame.locator('[data-testid="message-input"]').fill('Extract key metrics from: Revenue $2.5M, Users 150K, Growth 25%');
      await aiosFrame.locator('[data-testid="execute-query-btn"]').click();

      // Wait for analysis
      await expect(aiosFrame.locator('[data-testid="query-response"]')).toBeVisible();

      // Export results to Bytebot
      await aiosFrame.locator('[data-testid="export-results-btn"]').click();
      await aiosFrame.locator('[data-testid="export-target"]').selectOption('bytebot-ui');
      await aiosFrame.locator('[data-testid="confirm-export-btn"]').click();

      // Switch to Bytebot and verify data import
      await unifiedApp.openApp('bytebot-ui');
      const bytebotFrame = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Check for imported data
      await expect(bytebotFrame.locator('[data-testid="imported-data"]')).toBeVisible();
      await expect(bytebotFrame.locator('[data-testid="imported-data"]')).toContainText('Revenue');
      await expect(bytebotFrame.locator('[data-testid="imported-data"]')).toContainText('150K');

      // Create visualization task using imported data
      await bytebotFrame.locator('[data-testid="task-input"]').fill('Create dashboard visualization for the imported metrics');
      await bytebotFrame.locator('[data-testid="model-selector"]').click();
      await bytebotFrame.locator('[data-testid="model-option-claude-3-sonnet"]').click();
      await bytebotFrame.locator('[data-testid="create-task-btn"]').click();

      // Verify task uses imported data
      await expect(bytebotFrame.locator('[data-testid="task-list"]')).toContainText('dashboard visualization');

      // Export final result to Postiz for social sharing
      await bytebotFrame.locator('[data-testid="export-task-result-btn"]').click();
      await bytebotFrame.locator('[data-testid="export-target"]').selectOption('postiz-app');

      // Switch to Postiz and verify content import
      await unifiedApp.navigateToCategory('social-media');
      await unifiedApp.openApp('postiz-app');
      const postizFrame = page.frameLocator('[data-testid="app-iframe-postiz-app"]');

      // Verify automated content creation
      await expect(postizFrame.locator('[data-testid="auto-generated-content"]')).toBeVisible();
      await expect(postizFrame.locator('[data-testid="content-preview"]')).toContainText('dashboard');
    });
  });

  test.describe('Infrastructure Monitoring Workflow', () => {
    test('should complete infrastructure health check workflow', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('infrastructure');

      // Open Grafana monitoring
      await unifiedApp.openApp('grafana-monitoring');
      const grafanaFrame = page.frameLocator('[data-testid="app-iframe-grafana-monitoring"]');

      // Check system metrics
      await expect(grafanaFrame.locator('[data-testid="system-metrics"]')).toBeVisible();

      // Verify service health indicators
      const services = ['frontend', 'bytebot-agent', 'aios', 'database'];
      for (const service of services) {
        await expect(grafanaFrame.locator(`[data-testid="service-${service}-health"]`)).toBeVisible();
      }

      // Open Docker management
      await unifiedApp.openApp('docker-management');
      const dockerFrame = page.frameLocator('[data-testid="app-iframe-docker-management"]');

      // Check container status
      await expect(dockerFrame.locator('[data-testid="container-list"]')).toBeVisible();

      // Verify key containers are running
      const containers = ['bytebot-agent', 'aios-service', 'frontend'];
      for (const container of containers) {
        await expect(dockerFrame.locator(`[data-testid="container-${container}"]`)).toHaveClass(/running/);
      }

      // Test container restart functionality
      await dockerFrame.locator('[data-testid="container-aios-service-actions"]').click();
      await dockerFrame.locator('[data-testid="restart-container-btn"]').click();

      // Verify restart operation
      await expect(dockerFrame.locator('[data-testid="container-aios-service"]')).toHaveClass(/restarting/);

      // Wait for restart completion
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'container_restart_complete',
        payload: { container: 'aios-service', status: 'running' }
      });

      await expect(dockerFrame.locator('[data-testid="container-aios-service"]')).toHaveClass(/running/);
    });
  });

  test.describe('Error Recovery Workflow', () => {
    test('should handle and recover from service failures during workflow', async ({ page }) => {
      await unifiedApp.goto();
      await unifiedApp.navigateToCategory('aiAutomation');

      // Start workflow with AIOS
      await unifiedApp.openApp('aios-service');
      const aiosFrame = page.frameLocator('[data-testid="app-iframe-aios-service"]');

      await aiosFrame.locator('[data-testid="model-selector"]').click();
      await aiosFrame.locator('[data-testid="model-option-gpt-4"]').click();
      await aiosFrame.locator('[data-testid="message-input"]').fill('Test query for error recovery');
      await aiosFrame.locator('[data-testid="execute-query-btn"]').click();

      // Simulate service failure during processing
      await WebSocketUtils.simulateWebSocketMessage(page, {
        type: 'service_error',
        payload: { service: 'aios', error: 'Model temporarily unavailable' }
      });

      // Verify error handling
      await expect(aiosFrame.locator('[data-testid="service-error"]')).toBeVisible();
      await expect(aiosFrame.locator('[data-testid="retry-btn"]')).toBeVisible();

      // Attempt retry with different model
      await aiosFrame.locator('[data-testid="retry-btn"]').click();
      await aiosFrame.locator('[data-testid="model-selector"]').click();
      await aiosFrame.locator('[data-testid="model-option-claude-3-sonnet"]').click();
      await aiosFrame.locator('[data-testid="retry-execute-btn"]').click();

      // Verify successful recovery
      await expect(aiosFrame.locator('[data-testid="query-response"]')).toBeVisible();

      // Continue workflow with Bytebot
      await unifiedApp.openApp('bytebot-ui');
      const bytebotFrame = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Create task using recovered data
      await bytebotFrame.locator('[data-testid="task-input"]').fill('Process data from recovered AIOS query');
      await bytebotFrame.locator('[data-testid="create-task-btn"]').click();

      // Verify workflow continuation despite initial failure
      await expect(bytebotFrame.locator('[data-testid="task-list"]')).toContainText('recovered');
    });
  });

  test.describe('Performance and Scalability Workflow', () => {
    test('should handle concurrent multi-service operations', async ({ page }) => {
      await unifiedApp.goto();

      // Start multiple services concurrently
      await unifiedApp.navigateToCategory('aiAutomation');

      // Open AIOS and Bytebot simultaneously
      const [aiosPromise, bytebotPromise] = await Promise.all([
        unifiedApp.openApp('aios-service'),
        unifiedApp.openApp('bytebot-ui')
      ]);

      // Work with both services
      const aiosFrame = page.frameLocator('[data-testid="app-iframe-aios-service"]');
      const bytebotFrame = page.frameLocator('[data-testid="app-iframe-bytebot-ui"]');

      // Execute concurrent operations
      await Promise.all([
        // AIOS query
        aiosFrame.locator('[data-testid="message-input"]').fill('Concurrent analysis request'),
        aiosFrame.locator('[data-testid="execute-query-btn"]').click(),

        // Bytebot task creation
        bytebotFrame.locator('[data-testid="task-input"]').fill('Concurrent processing task'),
        bytebotFrame.locator('[data-testid="create-task-btn"]').click()
      ]);

      // Verify both operations completed
      await expect(aiosFrame.locator('[data-testid="query-response"]')).toBeVisible();
      await expect(bytebotFrame.locator('[data-testid="task-list"]')).toContainText('Concurrent processing task');

      // Test resource monitoring during concurrent operations
      await unifiedApp.navigateToCategory('infrastructure');
      await unifiedApp.openApp('grafana-monitoring');

      const grafanaFrame = page.frameLocator('[data-testid="app-iframe-grafana-monitoring"]');

      // Check resource usage during concurrent operations
      await expect(grafanaFrame.locator('[data-testid="cpu-usage-chart"]')).toBeVisible();
      await expect(grafanaFrame.locator('[data-testid="memory-usage-chart"]')).toBeVisible();
    });
  });
});