// Visual diff helper for PR I.5 — captures free TUI Plus shells/settings previews.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const TARGETS = [
  { page: 'application-shells/stacked',     slug: 'stk-01-lighter-page-header',  title: 'With lighter page header preview' },
  { page: 'application-shells/stacked',     slug: 'stk-02-bottom-border',        title: 'With bottom border preview' },
  { page: 'application-shells/sidebar',     slug: 'sbr-01-simple',               title: 'Simple sidebar preview' },
  { page: 'application-shells/sidebar',     slug: 'sbr-02-simple-dark',          title: 'Simple dark sidebar preview' },
  { page: 'application-shells/multi-column',slug: 'mc-01-3col-full-width',       title: 'Full-width three-column preview' },
  { page: 'application-shells/multi-column',slug: 'mc-02-secondary-right',       title: 'Full-width secondary column on right preview' },
  { page: 'page-examples/settings-screens', slug: 'set-01-sidebar',              title: 'Sidebar preview' },
  { page: 'page-examples/settings-screens', slug: 'set-02-stacked',              title: 'Stacked preview' },
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
