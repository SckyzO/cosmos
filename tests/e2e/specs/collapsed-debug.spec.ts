import { test } from '@playwright/test';

// Static collapsed states
test('debug-sidebar-collapsed', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-sidebar--collapsed', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '../../screenshots/debug-sidebar-collapsed.png', fullPage: false });
});

test('debug-shell-starts-collapsed', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-shell--starts-collapsed', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: '../../screenshots/debug-shell-starts-collapsed.png',
    fullPage: false,
  });
});

// Click hamburger to collapse, then screenshot
test('debug-shell-default-after-toggle', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-shell--default', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '../../screenshots/debug-shell-before-toggle.png' });

  // Click the hamburger
  await page.locator('button[aria-label="Collapse sidebar"]').first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '../../screenshots/debug-shell-after-toggle.png' });
});

// Click hamburger on starts-collapsed to expand
test('debug-shell-starts-collapsed-then-expand', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-shell--starts-collapsed', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.locator('button[aria-label="Expand sidebar"]').first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '../../screenshots/debug-shell-expanded-from-collapsed.png' });
});
