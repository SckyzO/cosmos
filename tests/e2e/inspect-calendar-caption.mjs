// Full dump of the Calendar header region to understand what's overlapping.
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 600, height: 500 } });
const page = await ctx.newPage();
await page.goto(
  'http://storybook:6006/iframe.html?id=forms-date-picker--inline-calendar&viewMode=story',
  { waitUntil: 'networkidle', timeout: 30000 }
);
await page.waitForTimeout(1500);

const data = await page.evaluate(() => {
  const root = document.querySelector('.rdp-root, [class*="rdp-"]');
  if (!root) return { found: false };
  // Walk the tree and report every element with visible text or distinct class.
  const out = [];
  root.querySelectorAll('*').forEach((el) => {
    const text = (el.textContent || '').trim().slice(0, 30);
    const tag = el.tagName;
    const cls = el.className.toString().slice(0, 60);
    // Only report leaf-ish nodes (containing direct text)
    const directText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3 && n.textContent?.trim())
      .map((n) => n.textContent?.trim())
      .join('');
    if (directText || ['SELECT', 'OPTION', 'BUTTON', 'SPAN'].includes(tag)) {
      out.push({ tag, cls, directText: directText.slice(0, 50), all: text });
    }
  });
  return { found: true, count: out.length, items: out.slice(0, 30) };
});
console.log(JSON.stringify(data, null, 2));

await browser.close();
