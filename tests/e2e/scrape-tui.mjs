import { chromium } from '@playwright/test';

const url = process.argv[2];
const tag = process.argv[3] ?? 'ul';

if (!url) {
  console.error('usage: scrape-tui.mjs <url> [tag]');
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

// Tailwind UI Plus renders each example inside an iframe whose body
// contains the actual demo markup. Walk every iframe and grab the
// matching tag's outerHTML.
const out = [];
for (const f of page.frames()) {
  if (f === page.mainFrame()) continue;
  try {
    const html = await f.locator(tag).first().innerHTML().catch(() => '');
    const outerTag = await f.locator(tag).first().getAttribute('class').catch(() => '');
    if (html) {
      out.push({
        src: f.url(),
        rootClass: outerTag,
        innerHTML: html.slice(0, 6000),
      });
    }
  } catch {
    // skip frames without the tag
  }
}

const headings = await page.locator('h2, h3').allTextContents();
console.log(JSON.stringify({ url, headings, examples: out }, null, 2));

await browser.close();
