import { test } from '@playwright/test';

const cases = [
  ['forms-basic-controls--text-inputs', 'verify-input-icon'],
  ['feedback-tooltip--positions', 'verify-tooltip-positions'],
  ['feedback-tooltip--variants', 'verify-tooltip-variants'],
  ['overlays-drawer--sides', 'verify-drawer-canvas'],
  ['layout-shell--default', 'verify-shell-default'],
  ['layout-shell--collapsed-sidebar', 'verify-shell-collapsed'],
  ['layout-sidebar--full-example', 'verify-sidebar-full'],
  ['layout-sidebar--collapsed', 'verify-sidebar-collapsed'],
  ['layout-sidebar--sub-menu-expanded', 'verify-sidebar-submenu'],
  ['layout-topbar--collapse-button-and-page-title', 'verify-topbar-default'],
] as const;

for (const [storyId, name] of cases) {
  test(name, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=story&id=${storyId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `../../screenshots/${name}.png`, fullPage: false });
  });
}

test('verify-welcome-page', async ({ page }) => {
  await page.goto('/?path=/docs/welcome--docs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '../../screenshots/verify-welcome-page.png', fullPage: false });
});

test('verify-manager-dark', async ({ page }) => {
  await page.goto('/?path=/story/atoms-button--variants', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '../../screenshots/verify-manager-dark.png', fullPage: false });
});
