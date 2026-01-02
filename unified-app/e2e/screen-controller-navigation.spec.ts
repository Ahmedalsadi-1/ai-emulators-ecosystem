import { test, expect } from '@playwright/test';
import {
  UnifiedAppPage,
  NAVIGATION_CATEGORIES,
  SERVICE_URLS,
  EnvironmentUtils
} from '../test-utils';

test.describe('Screen Controller Navigation E2E Tests', () => {
  let unifiedApp: UnifiedAppPage;

  test.beforeAll(async () => {
    await EnvironmentUtils.setupTestEnvironment();
  });

  test.beforeEach(async ({ page }) => {
    unifiedApp = new UnifiedAppPage(page);
    await unifiedApp.goto();
  });

  test.describe('Unified App Initialization', () => {
    test('should load the unified app successfully', async ({ page }) => {
      // Check that the main app container is visible
      await expect(page.locator('[data-testid="unified-app"]')).toBeVisible();

      // Check that navigation sidebar is present
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();

      // Check that main content area is present
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Check that header is present
      await expect(page.locator('[data-testid="app-header"]')).toBeVisible();
    });

    test('should display navigation categories', async ({ page }) => {
      const sidebar = page.locator('[data-testid="navigation-sidebar"]');

      // Check that all main navigation categories are visible
      for (const category of Object.values(NAVIGATION_CATEGORIES)) {
        await expect(sidebar.locator(`[data-testid="nav-${category}"]`)).toBeVisible();
      }
    });

    test('should show app counts for each category', async ({ page }) => {
      // Each navigation item should show a count
      const navItems = await page.locator('[data-testid^="nav-"]').all();

      for (const item of navItems) {
        const countElement = item.locator('[data-testid="nav-count"]');
        await expect(countElement).toBeVisible();

        const count = await countElement.textContent();
        expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Category Navigation', () => {
    test('should navigate to Automation category and display apps', async ({ page }) => {
      await unifiedApp.navigateToCategory('automation');

      // Verify active category
      expect(await unifiedApp.getActiveCategory()).toBe(NAVIGATION_CATEGORIES.automation);

      // Check that automation apps are displayed
      const visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps.length).toBeGreaterThan(0);

      // Should contain unified automation app
      expect(visibleApps).toContain('unified-automation');
    });

    test('should navigate to AI Automation category', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');

      expect(await unifiedApp.getActiveCategory()).toBe(NAVIGATION_CATEGORIES.aiAutomation);

      const visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps).toContain('bytebot-ui');
      expect(visibleApps).toContain('factif-ai');
      expect(visibleApps).toContain('aios-service');
    });

    test('should navigate to Desktop category', async ({ page }) => {
      await unifiedApp.navigateToCategory('desktop');

      expect(await unifiedApp.getActiveCategory()).toBe(NAVIGATION_CATEGORIES.desktop);

      const visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps).toContain('bytebot-vnc-desktop');
      expect(visibleApps).toContain('gbox-sandbox-environment');
    });

    test('should navigate to Social Media category', async ({ page }) => {
      await unifiedApp.navigateToCategory('socialMedia');

      expect(await unifiedApp.getActiveCategory()).toBe(NAVIGATION_CATEGORIES.socialMedia);

      const visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps).toContain('postiz-app');
    });

    test('should navigate to Content Creation category', async ({ page }) => {
      await unifiedApp.navigateToCategory('contentCreation');

      expect(await unifiedApp.getActiveCategory()).toBe(NAVIGATION_CATEGORIES.contentCreation);

      const visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps).toContain('wan2gp-video-generation');
      expect(visibleApps).toContain('postiz-social-media');
    });

    test('should navigate to Infrastructure category', async ({ page }) => {
      await unifiedApp.navigateToCategory('infrastructure');

      expect(await unifiedApp.getActiveCategory()).toBe(NAVIGATION_CATEGORIES.infrastructure);

      const visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps).toContain('grafana-monitoring');
      expect(visibleApps).toContain('docker-management');
    });
  });

  test.describe('App Opening and Iframe Loading', () => {
    test('should open Bytebot UI app and load iframe', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Wait for app viewer to load
      await expect(page.locator('[data-testid="app-viewer-bytebot-ui"]')).toBeVisible();

      // Check app header information
      await expect(page.locator('[data-testid="app-title"]')).toContainText('ByteBot UI');
      await expect(page.locator('[data-testid="app-description"]')).toBeVisible();

      // Wait for iframe to load
      await unifiedApp.waitForAppIframe('bytebot-ui');

      // Verify iframe src points to correct service
      const iframe = page.locator('[data-testid="app-iframe-bytebot-ui"]');
      const src = await iframe.getAttribute('src');
      expect(src).toBe(SERVICE_URLS.bytebotAgent);
    });

    test('should open AIOS service app', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('aios-service');

      await expect(page.locator('[data-testid="app-viewer-aios-service"]')).toBeVisible();
      await expect(page.locator('[data-testid="app-title"]')).toContainText('AIOS Service');

      await unifiedApp.waitForAppIframe('aios-service');

      const iframe = page.locator('[data-testid="app-iframe-aios-service"]');
      const src = await iframe.getAttribute('src');
      expect(src).toBe(SERVICE_URLS.aios);
    });

    test('should open Factif AI app', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('factif-ai');

      await expect(page.locator('[data-testid="app-viewer-factif-ai"]')).toBeVisible();
      await expect(page.locator('[data-testid="app-title"]')).toContainText('Factif AI');

      await unifiedApp.waitForAppIframe('factif-ai');

      const iframe = page.locator('[data-testid="app-iframe-factif-ai"]');
      const src = await iframe.getAttribute('src');
      expect(src).toBe(SERVICE_URLS.factif);
    });

    test('should open Bytebot VNC Desktop', async ({ page }) => {
      await unifiedApp.navigateToCategory('desktop');
      await unifiedApp.openApp('bytebot-vnc-desktop');

      await expect(page.locator('[data-testid="app-viewer-bytebot-vnc-desktop"]')).toBeVisible();
      await expect(page.locator('[data-testid="app-title"]')).toContainText('ByteBot VNC Desktop');

      await unifiedApp.waitForAppIframe('bytebot-vnc-desktop');

      const iframe = page.locator('[data-testid="app-iframe-bytebot-vnc-desktop"]');
      const src = await iframe.getAttribute('src');
      expect(src).toBe('http://localhost:3000/vnc');
    });

    test('should open GBox Sandbox Environment', async ({ page }) => {
      await unifiedApp.navigateToCategory('desktop');
      await unifiedApp.openApp('gbox-sandbox-environment');

      await expect(page.locator('[data-testid="app-viewer-gbox-sandbox-environment"]')).toBeVisible();
      await expect(page.locator('[data-testid="app-title"]')).toContainText('GBox Sandbox Environment');

      await unifiedApp.waitForAppIframe('gbox-sandbox-environment');

      const iframe = page.locator('[data-testid="app-iframe-gbox-sandbox-environment"]');
      const src = await iframe.getAttribute('src');
      expect(src).toBe(SERVICE_URLS.turix); // GBox runs on port 3000
    });
  });

  test.describe('UI Responsiveness and Navigation', () => {
    test('should handle sidebar toggle', async ({ page }) => {
      const sidebar = page.locator('[data-testid="navigation-sidebar"]');

      // Initially expanded
      await expect(sidebar).toHaveClass(/w-80/);

      // Toggle to collapsed
      await unifiedApp.toggleSidebar();
      await expect(sidebar).toHaveClass(/w-16/);

      // Toggle back to expanded
      await unifiedApp.toggleSidebar();
      await expect(sidebar).toHaveClass(/w-80/);
    });

    test('should handle details panel toggle', async ({ page }) => {
      const detailsPanel = page.locator('[data-testid="details-panel"]');

      // Initially closed
      await expect(detailsPanel).toHaveCSS('width', '0px');

      // Open details panel
      await unifiedApp.toggleDetailsPanel();
      await expect(detailsPanel).toHaveCSS('width', '384px'); // 96 * 4 = 384px (w-96)

      // Close details panel
      await unifiedApp.toggleDetailsPanel();
      await expect(detailsPanel).toHaveCSS('width', '0px');
    });

    test('should handle app search functionality', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');

      // Initially should show all AI automation apps
      let visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps.length).toBeGreaterThan(1);

      // Search for 'bytebot'
      await unifiedApp.searchApps('bytebot');
      await page.waitForTimeout(300);

      visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps).toContain('bytebot-ui');
      expect(visibleApps).not.toContain('factif-ai');

      // Clear search
      await unifiedApp.searchApps('');
      await page.waitForTimeout(300);

      visibleApps = await unifiedApp.getVisibleApps();
      expect(visibleApps.length).toBeGreaterThan(1);
    });
  });

  test.describe('App Status and Health Monitoring', () => {
    test('should display app status indicators', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Check that status indicator is present
      const statusIndicator = page.locator('[data-testid="app-status-indicator"]');
      await expect(statusIndicator).toBeVisible();

      // Status should be one of: running, stopped, error
      const statusClass = await statusIndicator.getAttribute('class');
      expect(statusClass).toMatch(/status-(running|stopped|error)/);
    });

    test('should show app port information', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Check port display
      const portDisplay = page.locator('[data-testid="app-port"]');
      await expect(portDisplay).toContainText('9991'); // Bytebot agent port
    });

    test('should handle app loading states', async ({ page }) => {
      await unifiedApp.navigateToCategory('aiAutomation');
      await unifiedApp.openApp('bytebot-ui');

      // Check for loading indicator initially
      const loadingIndicator = page.locator('[data-testid="app-loading"]').first();
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();
        // Wait for loading to complete
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
      }

      // App should be loaded
      await expect(page.locator('[data-testid="app-iframe-bytebot-ui"]')).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should handle keyboard shortcuts', async ({ page }) => {
      // Test sidebar toggle with Ctrl+B
      const sidebar = page.locator('[data-testid="navigation-sidebar"]');

      // Initially expanded
      await expect(sidebar).toHaveClass(/w-80/);

      // Press Ctrl+B to toggle sidebar
      await page.keyboard.press('Control+b');
      await expect(sidebar).toHaveClass(/w-16/);

      // Press Ctrl+B again to expand
      await page.keyboard.press('Control+b');
      await expect(sidebar).toHaveClass(/w-80/);

      // Test details panel toggle with Ctrl+D
      const detailsPanel = page.locator('[data-testid="details-panel"]');

      // Initially closed
      await expect(detailsPanel).toHaveCSS('width', '0px');

      // Press Ctrl+D to open
      await page.keyboard.press('Control+d');
      await expect(detailsPanel).toHaveCSS('width', '384px');

      // Press Ctrl+D again to close
      await page.keyboard.press('Control+d');
      await expect(detailsPanel).toHaveCSS('width', '0px');
    });

    test('should handle escape key to close panels', async ({ page }) => {
      // Open details panel
      await unifiedApp.toggleDetailsPanel();
      await expect(page.locator('[data-testid="details-panel"]')).toHaveCSS('width', '384px');

      // Press Escape to close
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="details-panel"]')).toHaveCSS('width', '0px');
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work on different viewport sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });
  });
});