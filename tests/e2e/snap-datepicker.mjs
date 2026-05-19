// Capture the new DateRangePicker + new DatePicker patterns in both themes.
// For date picker stories that open a calendar popover, we click the trigger
// before screenshotting so the popover is visible.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/workspace/tests/screenshots/datepicker';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 820, height: 720 } });
const page = await ctx.newPage();

const tasks = [
  // [storyId, openPopover?]
  ['forms-date-range-picker--default', false],
  ['forms-date-range-picker--preselected', false],
  ['forms-date-range-picker--default', true], // popover opened
  ['forms-date-picker--inline-calendar', false],
  ['forms-date-picker--today-and-clear', true],
];

for (const theme of ['dark', 'light']) {
  for (const [id, open] of tasks) {
    await page.goto(
      `http://storybook:6006/iframe.html?id=${id}&globals=theme:${theme}&viewMode=story`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );
    await page.waitForTimeout(1500);
    if (open) {
      // Click the first trigger to open the popover.
      const btn = page.locator('button[aria-haspopup="dialog"]').first();
      if (await btn.count()) await btn.click();
      await page.waitForTimeout(800);
    }
    const name = `${id.replace(/^forms-/, '')}${open ? '-open' : ''}-${theme}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    console.log(`saved ${name}`);
  }
}
await browser.close();
