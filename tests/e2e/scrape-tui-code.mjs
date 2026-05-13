import { chromium } from '@playwright/test';

const url = process.argv[2];
if (!url) { console.error('usage: scrape-tui-code.mjs <url>'); process.exit(2); }

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

// Each example preview has a toolbar with a "Code" toggle. Click them all,
// then read the code panel content. Try multiple selector patterns.
const codeBtns = await page.locator('button:has-text("Code")').all();
console.error(`# Code buttons found: ${codeBtns.length}`);

const results = [];
for (let i = 0; i < codeBtns.length; i++) {
  try {
    await codeBtns[i].scrollIntoViewIfNeeded();
    await codeBtns[i].click();
    await page.waitForTimeout(200);
  } catch (e) {
    console.error(`# btn ${i} click failed: ${e.message}`);
  }
}

// After clicking all, read every code panel (look for <pre> blocks in code mode).
const blocks = await page.locator('pre').all();
console.error(`# pre blocks: ${blocks.length}`);

for (let i = 0; i < blocks.length; i++) {
  const txt = await blocks[i].textContent();
  if (txt && txt.length > 100) {
    results.push({ idx: i, len: txt.length, preview: txt.slice(0, 400), full: txt });
  }
}

const headings = await page.locator('h2, h3').allTextContents();
console.log(JSON.stringify({ url, headings, count: results.length, blocks: results }, null, 2));

await browser.close();
