import { test } from '@playwright/test';

const cases = [
  ['forms-basic-controls--text-inputs', 'bug-input-icon'],
  ['feedback-tooltip--positions-and-variants', 'bug-tooltip'],
  ['overlays-drawer--sides', 'bug-drawer-canvas'],
  ['welcome--docs', 'bug-welcome'],
  ['atoms-button--variants', 'bug-bg-dark'],
] as const;

for (const [storyId, name] of cases) {
  test(name, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=story&id=${storyId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `../../screenshots/${name}.png`, fullPage: false });
  });
}
