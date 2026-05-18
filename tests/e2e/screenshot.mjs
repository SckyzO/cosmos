import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const url = process.argv[2];
const out = process.argv[3];
const selector = process.argv[4]; // optional CSS selector to clip
if (!url || !out) {
  console.error('usage: screenshot.mjs <url> <out.png> [selector]');
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

const outPath = resolve(out);
await mkdir(dirname(outPath), { recursive: true });

if (selector) {
  await page.locator(selector).first().screenshot({ path: outPath });
} else {
  await page.screenshot({ path: outPath, fullPage: false });
}

console.log(`saved: ${outPath}`);
await browser.close();
