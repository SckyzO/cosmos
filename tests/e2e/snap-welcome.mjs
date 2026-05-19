// Capture the Welcome story in both themes via the standalone iframe URL
// (bypasses the manager UI so we get a clean fullscreen rendering).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/workspace/tests/screenshots/welcome';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1024 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

for (const theme of ['dark', 'light']) {
  await page.goto(
    `http://storybook:6006/iframe.html?id=welcome--default&globals=theme:${theme}&viewMode=story`,
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/welcome-${theme}.png`, fullPage: true });
  console.log(`saved welcome-${theme}.png`);
}

console.log('\nERRORS:', errors.length === 0 ? 'none' : `\n  ${errors.join('\n  ')}`);
await browser.close();
