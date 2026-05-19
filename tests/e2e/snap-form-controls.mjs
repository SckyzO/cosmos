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
  // ConfirmationModal — debugging report
  { id: 'overlays-confirmation-modal--unsaved-changes', name: 'confirm-unsaved' },
  { id: 'overlays-confirmation-modal--confirm-delete', name: 'confirm-delete' },
  { id: 'overlays-confirmation-modal--saving-in-progress', name: 'confirm-saving' },
  { id: 'overlays-confirmation-modal--triggered-from-button', name: 'confirm-trigger' },
  // Drawer — debugging report
  { id: 'overlays-drawer--sides', name: 'drawer-sides' },
  { id: 'overlays-drawer--empty-slide-over-no-backdrop', name: 'drawer-noback' },
  // Docs-page reports
  { id: 'overlays-modal', name: 'docs-modal' },
  { id: 'overlays-drawer', name: 'docs-drawer' },
  { id: 'overlays-confirmation-modal', name: 'docs-confirm' },
  { id: 'overlays-notifications-panel', name: 'docs-notifications' },
  // Pages/Form Elements rendering — to see them in real form context
  { id: 'pages-form-elements--default', name: 'pages-formelements' },
];

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://storybook:6006';
const MODE = process.env.MODE ?? 'story'; // 'story' or 'docs'

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

for (const s of STORIES) {
  // In docs mode, use the manager URL (not iframe.html) so the docs wrapper renders.
  const url =
    MODE === 'docs'
      ? `${STORYBOOK_URL}/?path=/docs/${s.id}`
      : `${STORYBOOK_URL}/iframe.html?id=${s.id}&viewMode=story`;
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
