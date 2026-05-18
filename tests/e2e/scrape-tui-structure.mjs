import { chromium } from '@playwright/test';

const url = process.argv[2];
const tag = process.argv[3] ?? 'ul';
if (!url) {
  console.error('usage: scrape-tui-structure.mjs <url> [tag]');
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

const out = [];
for (const f of page.frames()) {
  if (f === page.mainFrame()) continue;
  try {
    const root = f.locator(tag).first();
    const rootClass = await root.getAttribute('class').catch(() => '');
    const liCount = await f
      .locator(tag + ' > li, ' + tag + ' > div, ' + tag + ' > section')
      .count()
      .catch(() => 0);
    const firstChild = f.locator(tag + ' > *').first();
    const childInnerHTML = await firstChild.innerHTML().catch(() => '');
    if (rootClass !== null) {
      out.push({
        rootTag: tag,
        rootClass,
        childCount: liCount,
        childInnerHTML: childInnerHTML.slice(0, 8000),
      });
    }
  } catch {
    // Best-effort: any selector mismatch or stale frame is silently skipped.
  }
}

const headings = await page.locator('h2').allTextContents();
console.log(JSON.stringify({ url, headings, examples: out }, null, 2));
await browser.close();
