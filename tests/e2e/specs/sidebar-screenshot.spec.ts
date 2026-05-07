import { test } from '@playwright/test';

test('sidebar reorganization', async ({ page }) => {
  await page.goto('/?path=/docs/welcome--docs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '../../screenshots/sidebar-reorg.png', fullPage: false });
});
