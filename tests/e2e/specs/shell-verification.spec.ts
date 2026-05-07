import { test } from '@playwright/test';

const cases = [
  ['layout-shell--default', 'verify-shell-default-v2'],
  ['layout-shell--starts-collapsed', 'verify-shell-collapsed-v2'],
  ['layout-shell--no-sidebar', 'verify-shell-no-sidebar-v2'],
  ['layout-topbar--with-hamburger', 'verify-topbar-builtin-hamburger'],
  ['layout-sidebar--full-example', 'verify-sidebar-full-v2'],
  ['layout-sidebar--sub-menu-expanded', 'verify-sidebar-submenu-v2'],
] as const;

for (const [storyId, name] of cases) {
  test(name, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=story&id=${storyId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `../../screenshots/${name}.png`, fullPage: false });
  });
}
