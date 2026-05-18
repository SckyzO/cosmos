// Snapshot every TailAdmin demo page we want to compare against Cosmos.
// Run from inside the cosmos-playwright container:
//   docker compose run --rm playwright node scripts/analyze-tailadmin.mjs
//
// For each URL: navigate, wait, run an in-page evaluate that captures
// the page structure (headings, buttons, links, inputs, tables…) inside
// the *main content area* (skipping the sidebar nav so we don't duplicate
// the same 80 links on every page). Output is one JSON file per URL.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('./tailadmin-snapshots');

const URLS = {
  pages: [
    'task-list',
    'form-elements',
    'form-layout',
    'basic-tables',
    'data-tables',
    'faq',
    'integrations',
  ],
  charts: ['line-chart', 'bar-chart', 'pie-chart'],
  ui: [
    'alerts',
    'avatars',
    'badge',
    'breadcrumb',
    'buttons',
    'buttons-group',
    'cards',
    'carousel',
    'dropdowns',
    'images',
    'links',
    'list',
    'modals',
    'notifications',
    'pagination',
    'popovers',
    'progress-bar',
    'ribbons',
    'spinners',
    'tabs',
    'tooltips',
    'videos',
  ],
  auth: ['signin', 'signup', 'reset-password', 'two-step-verification'],
};

const ALL_URLS = Object.entries(URLS).flatMap(([cat, slugs]) =>
  slugs.map((slug) => ({ cat, slug, url: `https://demo.tailadmin.com/${slug}` }))
);

async function snapshot(page) {
  return page.evaluate(() => {
    // Find the main content container — TailAdmin uses <main>; if absent
    // fall back to the largest non-aside non-header container.
    const main = document.querySelector('main') || document.body;
    const sel = (q) => Array.from(main.querySelectorAll(q));
    const text = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140);
    const cls = (el) =>
      el.className && typeof el.className === 'string'
        ? el.className.replace(/\s+/g, ' ').slice(0, 200)
        : '';

    return {
      title: document.title,
      h1: sel('h1').map(text),
      h2: sel('h2').map(text),
      h3: sel('h3').map(text),
      h4: sel('h4').map(text),
      h5: sel('h5').map(text),
      buttons: sel('button')
        .map((el) => ({ text: text(el) || '(icon)', cls: cls(el) }))
        .slice(0, 80),
      links: sel('a')
        .map((el) => ({ text: text(el), href: el.getAttribute('href') || '' }))
        .filter((l) => l.text)
        .slice(0, 50),
      inputs: sel('input,textarea,select').map((el) => ({
        type: el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : ''),
        placeholder:
          el.placeholder || el.getAttribute('aria-label') || el.getAttribute('name') || '',
        cls: cls(el),
      })),
      labels: sel('label').map(text).slice(0, 40),
      tables: sel('table').length,
      dialogs: sel('[role="dialog"], dialog').length,
      tabs: sel('[role="tab"]').length,
      images: sel('img').length,
      svgs: sel('svg').length,
      // Sample distinctive container classes — useful to spot patterns
      // unique to TailAdmin (ribbons, carousels, etc.)
      sampleDivClasses: sel('div[class*="rounded"], div[class*="absolute"], div[class*="dropdown"]')
        .slice(0, 30)
        .map(cls)
        .filter((c, i, arr) => arr.indexOf(c) === i),
    };
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const { cat, slug, url } of ALL_URLS) {
    process.stdout.write(`[${cat}] ${slug} … `);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
      const data = await snapshot(page);
      await fs.writeFile(path.join(OUT_DIR, `${cat}-${slug}.json`), JSON.stringify(data, null, 2));
      console.log(
        `✓ h2=${data.h2.length} h3=${data.h3.length} buttons=${data.buttons.length} inputs=${data.inputs.length}`
      );
    } catch (err) {
      console.log(`✗ ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
  console.log(`\nDone. Snapshots in ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
