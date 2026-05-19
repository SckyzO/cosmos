// Snap the 3 NEW typography components in both themes.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/workspace/tests/screenshots/typography';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 760, height: 480 } });
const page = await ctx.newPage();

const stories = [
  'typography-blockquote--solid',
  'typography-blockquote--with-icon',
  'typography-blockquote--testimonial-with-avatar',
  'typography-kbd--combo',
  'typography-kbd--inside-paragraph',
  'typography-kbd--shortcut-legend',
  'typography-figure--with-caption',
  'typography-figure--rounded',
  'typography-figure--with-shadow',
];

for (const theme of ['dark', 'light']) {
  for (const id of stories) {
    await page.goto(
      `http://storybook:6006/iframe.html?id=${id}&globals=theme:${theme}&viewMode=story`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );
    await page.waitForTimeout(1200);
    const name = `${id.replace('typography-', '')}-${theme}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    console.log(`saved ${name}`);
  }
}
await browser.close();
