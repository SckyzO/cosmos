// Visual diff helper for PR I.3 — captures free TUI Plus atom previews.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const TARGETS = [
  { page: 'elements/buttons',  slug: 'btn-01-primary',           title: 'Primary buttons preview' },
  { page: 'elements/buttons',  slug: 'btn-02-secondary',         title: 'Secondary buttons preview' },
  { page: 'elements/dropdowns',slug: 'dd-01-simple',             title: 'Simple preview' },
  { page: 'elements/dropdowns',slug: 'dd-02-with-dividers',      title: 'With dividers preview' },
  { page: 'layout/cards',      slug: 'card-01-basic',            title: 'Basic card preview' },
  { page: 'layout/cards',      slug: 'card-02-edge-to-edge',     title: 'Card, edge-to-edge on mobile preview' },
  { page: 'layout/dividers',   slug: 'div-01-with-label',        title: 'With label preview' },
  { page: 'layout/dividers',   slug: 'div-02-with-icon',         title: 'With icon preview' },
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
