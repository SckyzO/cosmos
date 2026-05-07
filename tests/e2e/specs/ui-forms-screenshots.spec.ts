import { test } from '@playwright/test';

const stories = [
  ['ui-button--variants', 'ui-button-variants'],
  ['ui-button--with-icons', 'ui-button-icons'],
  ['ui-button--states', 'ui-button-states'],
  ['ui-card--plain', 'ui-card-plain'],
  ['ui-card--composed', 'ui-card-composed'],
  ['ui-badge--all-variants', 'ui-badge'],
  ['ui-avatar--initials-and-image', 'ui-avatar'],
  ['ui-tooltip--positions-and-variants', 'ui-tooltip'],
  ['ui-dropdown--single-select', 'ui-dropdown'],
  ['ui-modal--confirmation', 'ui-modal-trigger'],
  ['ui-drawer--sides', 'ui-drawer-trigger'],
  ['ui-tabs--three-tabs', 'ui-tabs'],
  ['ui-codeblock--with-copy-button', 'ui-codeblock'],
  ['forms-controls--text-inputs', 'forms-text-inputs'],
  ['forms-controls--selects', 'forms-selects'],
  ['forms-controls--toggles', 'forms-toggles'],
  ['forms-controls--pills-and-segmented', 'forms-pills-segmented'],
] as const;

for (const [storyId, screenshotName] of stories) {
  test(screenshotName, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=story&id=${storyId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `../../screenshots/${screenshotName}.png`, fullPage: false });
  });
}
