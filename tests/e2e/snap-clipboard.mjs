// Capture the new Flowbite-inspired Clipboard stories in both themes.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/workspace/tests/screenshots/clipboard';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 760, height: 480 } });
const page = await ctx.newPage();

const stories = ['inside-input', 'input-group-url', 'api-keys-card'];

for (const theme of ['dark', 'light']) {
  for (const id of stories) {
    await page.goto(
      `http://storybook:6006/iframe.html?id=atoms-clipboard--${id}&globals=theme:${theme}&viewMode=story`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${id}-${theme}.png`, fullPage: true });
    console.log(`saved ${id}-${theme}.png`);
  }
}
await browser.close();
