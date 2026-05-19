// Capture the 6 new Flowbite-inspired Card patterns in both themes.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/workspace/tests/screenshots/card';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 760, height: 600 } });
const page = await ctx.newPage();

const stories = ['with-cta', 'with-link', 'user-profile', 'centered-cta', 'with-list', 'with-tabs'];

for (const theme of ['dark', 'light']) {
  for (const id of stories) {
    await page.goto(
      `http://storybook:6006/iframe.html?id=layout-card--${id}&globals=theme:${theme}&viewMode=story`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${id}-${theme}.png`, fullPage: true });
    console.log(`saved ${id}-${theme}.png`);
  }
}
await browser.close();
