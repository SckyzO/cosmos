import { test, expect } from '@playwright/test';

test.describe('Storybook smoke test', () => {
  test('homepage renders and shows Welcome doc', async ({ page }) => {
    await page.goto('/');
    // Storybook iframe loads the Welcome MDX page by default — title check
    await expect(page).toHaveTitle(/Cosmos|Storybook/);
  });

  test('Welcome story renders', async ({ page }) => {
    await page.goto('/?path=/docs/welcome--docs');
    const iframe = page.frameLocator('#storybook-preview-iframe');
    await expect(iframe.locator('h1', { hasText: 'Cosmos' })).toBeVisible({ timeout: 10000 });
  });
});
