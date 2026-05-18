// Visual diff helper for PR I.1 — pairs each TUI Plus iframe with a Cosmos story.
// Run from inside cosmos-playwright container (has @playwright/test + browsers).
//
// Usage:
//   node diff-i1.mjs <componentKey>
//     componentKey ∈ { stacked, content, card, narrow }
//
// Outputs in tests/e2e/screenshots/:
//   tui-<key>-<n>-<slug>.png + cos-<key>-<n>-<slug>.png

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const PAIRS = {
  stacked: {
    tuiUrl: 'https://tailwindcss.com/plus/ui-blocks/application-ui/lists/stacked-lists',
    cases: [
      { slug: 'simple', tuiTitle: 'Simple preview', storyId: 'lists-stacked-list--simple' },
      {
        slug: 'with-links',
        tuiTitle: 'With links preview',
        storyId: 'lists-stacked-list--with-links',
      },
      // Cosmos-only extensions (variants of Pattern 1/2, no direct TUI equivalent):
      {
        slug: 'with-actions-menu',
        tuiTitle: 'Simple preview',
        storyId: 'lists-stacked-list--with-actions-menu',
      },
      {
        slug: 'no-subtitle',
        tuiTitle: 'Simple preview',
        storyId: 'lists-stacked-list--no-subtitle',
      },
      { slug: 'no-avatar', tuiTitle: 'Simple preview', storyId: 'lists-stacked-list--no-avatar' },
      {
        slug: 'with-leading-icon',
        tuiTitle: 'Simple preview',
        storyId: 'lists-stacked-list--with-leading-icon',
      },
    ],
  },
  content: {
    tuiUrl: 'https://tailwindcss.com/plus/ui-blocks/application-ui/lists/stacked-lists',
    cases: [
      {
        slug: 'issues-with-avatar-group',
        tuiTitle: 'With inline links and avatar group preview',
        storyId: 'lists-content-stacked-list--issues-with-avatar-group',
      },
      {
        slug: 'projects-with-badge-and-actions',
        tuiTitle: 'With badges, button, and actions menu preview',
        storyId: 'lists-content-stacked-list--projects-with-badge-and-actions',
      },
      {
        slug: 'title-without-link',
        tuiTitle: 'With inline links and avatar group preview',
        storyId: 'lists-content-stacked-list--title-without-link',
      },
      {
        slug: 'title-only-no-meta',
        tuiTitle: 'With inline links and avatar group preview',
        storyId: 'lists-content-stacked-list--title-only-no-meta',
      },
      {
        slug: 'single-meta-item',
        tuiTitle: 'With inline links and actions menu preview',
        storyId: 'lists-content-stacked-list--single-meta-item',
      },
    ],
  },
  card: {
    tuiUrl: 'https://tailwindcss.com/plus/ui-blocks/application-ui/lists/stacked-lists',
    cases: [
      {
        slug: 'default',
        tuiTitle: 'In card with links preview',
        storyId: 'lists-stacked-list-in-card--default',
      },
      {
        slug: 'no-links',
        tuiTitle: 'In card with links preview',
        storyId: 'lists-stacked-list-in-card--no-links',
      },
      {
        slug: 'with-leading-icon',
        tuiTitle: 'In card with links preview',
        storyId: 'lists-stacked-list-in-card--with-leading-icon',
      },
      {
        slug: 'inside-container',
        tuiTitle: 'In card with links preview',
        storyId: 'lists-stacked-list-in-card--inside-container',
      },
    ],
  },
  narrow: {
    tuiUrl: 'https://tailwindcss.com/plus/ui-blocks/application-ui/lists/stacked-lists',
    cases: [
      { slug: 'narrow', tuiTitle: 'Narrow preview', storyId: 'lists-narrow-stacked-list--narrow' },
      {
        slug: 'sticky-headings',
        tuiTitle: 'Narrow with sticky headings preview',
        storyId: 'lists-narrow-stacked-list--sticky-headings',
      },
      {
        slug: 'with-actions',
        tuiTitle: 'Narrow with actions preview',
        storyId: 'lists-narrow-stacked-list--with-actions',
      },
      {
        slug: 'with-truncated-description',
        tuiTitle: 'Narrow with truncated content preview',
        storyId: 'lists-narrow-stacked-list--with-truncated-description',
      },
    ],
  },
};

const key = process.argv[2];
if (!key || !PAIRS[key]) {
  console.error(`usage: node diff-i1.mjs <key>  (${Object.keys(PAIRS).join('|')})`);
  process.exit(2);
}
const cfg = PAIRS[key];

await mkdir('/workspace/tests/e2e/screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
});

// --- TUI page ---
const tuiPage = await ctx.newPage();
console.log(`[tui] loading ${cfg.tuiUrl}`);
await tuiPage.goto(cfg.tuiUrl, { waitUntil: 'networkidle', timeout: 90000 });

// Each iframe title can be duplicated (preview + ?), .first() picks the rendered one.
for (const [i, c] of cfg.cases.entries()) {
  const sel = `iframe[title="${c.tuiTitle}"]`;
  try {
    await tuiPage.locator(sel).first().scrollIntoViewIfNeeded({ timeout: 8000 });
    await tuiPage.waitForTimeout(600);
    const out = `/workspace/tests/e2e/screenshots/tui-${key}-${String(i + 1).padStart(2, '0')}-${c.slug}.png`;
    await tuiPage.locator(sel).first().screenshot({ path: out });
    console.log(`  ok ${out}`);
  } catch (e) {
    console.log(`  ✗ tui ${c.slug}: ${e.message}`);
  }
}

// --- Cosmos stories ---
const cosPage = await ctx.newPage();
for (const [i, c] of cfg.cases.entries()) {
  const url = `http://storybook:6006/iframe.html?id=${c.storyId}&viewMode=story&globals=theme:light`;
  try {
    await cosPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await cosPage.waitForTimeout(400);
    const out = `/workspace/tests/e2e/screenshots/cos-${key}-${String(i + 1).padStart(2, '0')}-${c.slug}.png`;
    await cosPage.screenshot({ path: out, fullPage: false });
    console.log(`  ok ${out}`);
  } catch (e) {
    console.log(`  ✗ cos ${c.slug}: ${e.message}`);
  }
}

await browser.close();
console.log('done');
