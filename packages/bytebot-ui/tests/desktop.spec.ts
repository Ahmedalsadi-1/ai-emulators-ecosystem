import { test, expect } from '@playwright/test';

test('desktop page renders core panels', async ({ page }) => {
  await page.goto('/desktop');

  await expect(page.getByText('Controllers')).toBeVisible();
  await expect(page.getByText('Agent Feed')).toBeVisible();
});
