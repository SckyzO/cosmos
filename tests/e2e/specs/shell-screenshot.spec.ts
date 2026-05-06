import { test } from '@playwright/test';

test('Shell.Default — capture full layout', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-shell--default', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '../../screenshots/shell-default.png', fullPage: false });
});

test('Shell.CollapsedSidebar — capture', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-shell--collapsed-sidebar', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '../../screenshots/shell-collapsed.png', fullPage: false });
});

test('Sidebar.WithFooter + WithBadges — capture', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-sidebar--with-footer', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '../../screenshots/sidebar-footer.png', fullPage: false });

  await page.goto('/iframe.html?viewMode=story&id=layout-sidebar--with-badges', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '../../screenshots/sidebar-badges.png', fullPage: false });
});

test('Topbar.WithSearch — capture', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=layout-topbar--with-search', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '../../screenshots/topbar-search.png', fullPage: false });
});
