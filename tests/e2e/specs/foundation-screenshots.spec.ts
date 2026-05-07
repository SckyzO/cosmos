import { test } from '@playwright/test';

const stories = [
  ['templates-overview--full-page-example', 'foundation-templates-fullpage'],
  ['templates-overview--page-card-centered', 'foundation-templates-pagecard'],
  ['templates-overview--column-layouts', 'foundation-templates-columns'],
  ['feedback-states--all-three', 'foundation-feedback'],
  ['status-indicators--status-badge-matrix', 'foundation-status-badges'],
  ['status-indicators--health-badge-all', 'foundation-health-badges'],
  ['lists-rows--status-rows', 'foundation-lists-status'],
  ['navigation-breadcrumb--with-icons', 'foundation-breadcrumb'],
] as const;

for (const [storyId, screenshotName] of stories) {
  test(screenshotName, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=story&id=${storyId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `../../screenshots/${screenshotName}.png`, fullPage: false });
  });
}
