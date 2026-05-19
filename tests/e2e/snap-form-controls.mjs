// Quick capture script — screenshots DatePicker + NumberInput in isolation
// to inspect their default rendering. Run via the playwright container:
//   docker compose run --rm playwright node tests/e2e/snap-form-controls.mjs

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/workspace/screenshots/inspect-form-controls';
mkdirSync(OUT, { recursive: true });

const STORIES = [
  // DatePicker stories
  { id: 'forms-date-picker--default', name: 'datepicker-default' },
  { id: 'forms-date-picker--with-label', name: 'datepicker-with-label' },
  // NumberInput stories
  { id: 'forms-number-input--default', name: 'numberinput-default' },
  { id: 'forms-number-input--with-unit', name: 'numberinput-with-unit' },
  // Timeline variants
  { id: 'data-timeline--dot', name: 'timeline-dot' },
  { id: 'data-timeline--avatar', name: 'timeline-avatar' },
  { id: 'data-timeline--card', name: 'timeline-card' },
  { id: 'data-timeline--stepper', name: 'timeline-stepper' },
  // Pages/Form Elements rendering — to see them in real form context
  { id: 'pages-form-elements--default', name: 'pages-formelements' },
];

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://storybook:6006';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

for (const s of STORIES) {
  const url = `${STORYBOOK_URL}/iframe.html?id=${s.id}&viewMode=story`;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);
    const path = join(OUT, `${s.name}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log('✓', s.name, '→', path);
  } catch (err) {
    console.error('✗', s.name, err.message);
  }
}

await browser.close();
