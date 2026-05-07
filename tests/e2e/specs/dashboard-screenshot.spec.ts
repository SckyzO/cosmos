import { test } from '@playwright/test';

test('verify-dashboard', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=pages-dashboard--default', {
    waitUntil: 'networkidle',
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '../../screenshots/verify-dashboard.png', fullPage: true });
});
