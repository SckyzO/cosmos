// Capture the unified DatePicker (single + range modes) and a few representative
// stories. Range now lives inside DatePicker via `mode="range"` — the former
// DateRangePicker stories are gone.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/workspace/tests/screenshots/datepicker';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 820, height: 720 } });
const page = await ctx.newPage();

const tasks = [
  // [storyId, openPopover?]
  ['forms-date-picker--default', false],
  ['forms-date-picker--default', true],
  ['forms-date-picker--range', false],
  ['forms-date-picker--range-preselected', false],
  ['forms-date-picker--range', true],
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
