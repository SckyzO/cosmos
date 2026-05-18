// Visual diff helper for PR I.2 — captures free TUI Plus overlay previews.
// Run from inside cosmos-playwright container (cwd = tests/e2e).
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Free patterns only (first 2 per page in TUI gallery).
const TARGETS = [
  { page: 'overlays/drawers',         slug: 'drawer-01-close-outside',     title: 'With close button on outside preview' },
  { page: 'overlays/drawers',         slug: 'drawer-02-empty',             title: 'Empty preview' },
  { page: 'overlays/modal-dialogs',   slug: 'modal-01-simple-gray-footer', title: 'Simple with gray footer preview' },
  { page: 'overlays/modal-dialogs',   slug: 'modal-02-centered-single',    title: 'Centered with single action preview' },
  { page: 'overlays/notifications',   slug: 'notif-01-simple',             title: 'Simple preview' },
  { page: 'overlays/notifications',   slug: 'notif-02-condensed',          title: 'Condensed preview' },
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
