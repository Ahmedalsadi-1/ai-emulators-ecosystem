import { test, expect } from '@playwright/test';

test('web page renders BrowserOS view', async ({ page }) => {
  await page.goto('/web');

  await expect(page.getByText('BrowserOS View')).toBeVisible();
  await expect(page.getByText('Agent Feed')).toBeVisible();
});
