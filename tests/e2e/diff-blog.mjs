// Visual diff helper for blog templates — captures free TUI Plus marketing/blog-sections.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const TARGETS = [
  { slug: 'blog-01-three-col', title: 'Three-column preview' },
  { slug: 'blog-02-three-col-images', title: 'Three-column with images preview' },
  { slug: 'blog-03-single-col', title: 'Single-column preview' },
  { slug: 'blog-04-single-col-img', title: 'Single-column with images preview' },
  { slug: 'blog-05-featured-post', title: 'With featured post preview' },
  { slug: 'blog-06-photo-list', title: 'With photo and list preview' },
];

await mkdir('/workspace/tests/e2e/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: 'light',
});
const p = await ctx.newPage();
await p.goto('https://tailwindcss.com/plus/ui-blocks/marketing/sections/blog-sections', {
  waitUntil: 'networkidle',
  timeout: 90000,
});

for (const t of TARGETS) {
  try {
    const sel = `iframe[title="${t.title}"]`;
    await p.locator(sel).first().scrollIntoViewIfNeeded({ timeout: 8000 });
    await p.waitForTimeout(700);
    const out = `/workspace/tests/e2e/screenshots/tui-${t.slug}.png`;
    await p.locator(sel).first().screenshot({ path: out });
    console.log(`  ok ${out}`);
  } catch (e) {
    console.log(`  ✗ ${t.slug}: ${e.message}`);
  }
}
await browser.close();
console.log('done');
