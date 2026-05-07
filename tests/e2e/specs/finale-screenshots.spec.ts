import { test } from '@playwright/test';

const stories = [
  ['ui-page-actions--action-buttons', 'finale-page-actions'],
  ['ui-page-actions--refresh-split-button', 'finale-refresh-button'],
  ['ui-primitives--spinner-sizes', 'finale-spinner'],
  ['ui-primitives--icon-boxes', 'finale-iconbox'],
  ['ui-primitives--alerts', 'finale-alertbanner'],
  ['ui-primitives--native-select', 'finale-selectinput'],
  ['ui-settings--save-cycle', 'finale-statefulsave'],
  ['ui-settings--confirmation', 'finale-confirmation'],
  ['forms-advanced--steppers', 'finale-steppers'],
  ['forms-advanced--zoom-control', 'finale-zoombar'],
  ['forms-advanced--form-rows', 'finale-formrow'],
  ['feedback-skeleton--presets', 'finale-skeleton'],
  ['data-visualization--kpi-grid', 'finale-kpicard'],
  ['data-visualization--timelines', 'finale-timeline'],
  ['data-visualization--calendar', 'finale-calendar'],
  ['table-datatable--alerts', 'finale-datatable'],
  ['pages-templates--not-found', 'finale-errorpage-404'],
  ['pages-templates--maintenance', 'finale-errorpage-503'],
  ['pages-templates--sticky-nav-example', 'finale-stickynav'],
  ['ui-modal--confirmation', 'finale-modal-compound'],
  ['ui-drawer--sides', 'finale-drawer-compound'],
  ['charts-gallery--line-area', 'finale-chart-linearea'],
  ['charts-gallery--radials', 'finale-chart-radials'],
  ['charts-gallery--donuts', 'finale-chart-donuts'],
  ['charts-gallery--sparklines', 'finale-chart-sparklines'],
  ['charts-gallery--treemap', 'finale-chart-treemap'],
] as const;

for (const [storyId, screenshotName] of stories) {
  test(screenshotName, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=story&id=${storyId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `../../screenshots/${screenshotName}.png`, fullPage: false });
  });
}
