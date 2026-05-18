// Visual diff helper for PR I.8 — captures free TUI Plus forms previews.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const TARGETS = [
  { page: 'forms/action-panels', slug: 'ap-01-simple',       title: 'Simple preview' },
  { page: 'forms/action-panels', slug: 'ap-02-with-link',    title: 'With link preview' },
  { page: 'forms/comboboxes',    slug: 'cb-01-simple',       title: 'Simple preview' },
  { page: 'forms/comboboxes',    slug: 'cb-02-status',       title: 'With status indicator preview' },
  { page: 'forms/form-layouts',  slug: 'fl-01-stacked',      title: 'Stacked preview' },
  { page: 'forms/form-layouts',  slug: 'fl-02-two-column',   title: 'Two-column preview' },
];

await mkdir('/workspace/tests/e2e/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });

const byPage = {};
for (const t of TARGETS) (byPage[t.page] ||= []).push(t);

for (const [page, items] of Object.entries(byPage)) {
  const p = await ctx.newPage();
  const url = 'https://tailwindcss.com/plus/ui-blocks/application-ui/' + page;
  console.log(`[tui] ${url}`);
  await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  for (const t of items) {
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
  await p.close();
}
await browser.close();
console.log('done');
