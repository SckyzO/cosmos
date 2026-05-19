// Snap the two specific Flowbite Clipboard examples the user wants to
// reproduce — much more reliable than asking an LLM to describe them.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = '/workspace/tests/screenshots/flowbite';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1100, height: 800 },
  // Flowbite cookie banner / theme can flicker — pretend dark from the start.
  colorScheme: 'dark',
});
const page = await ctx.newPage();
await page.goto('https://flowbite.com/docs/components/clipboard/', {
  waitUntil: 'networkidle',
  timeout: 60000,
});
// Dismiss any cookie banner if present.
await page.evaluate(() => {
  document.querySelectorAll('[id*="cookie"], [class*="cookie"]').forEach((el) => el.remove());
});

const targets = [
  { id: 'input-group-with-copy', heading: 'Input group with copy' },
  { id: 'card-with-api-keys', heading: 'Card with API keys' },
];

for (const t of targets) {
  // Find the heading by visible text and screenshot the example block right after it.
  const handle = await page.evaluateHandle((heading) => {
    const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
    const h = headings.find((el) => el.textContent?.trim().startsWith(heading));
    if (!h) return null;
    // The "example tab" preview usually sits 1-3 siblings below the heading.
    let node = h.nextElementSibling;
    while (node) {
      if (node.querySelector('[role="tabpanel"], .code-preview-wrapper, .preview')) return node;
      node = node.nextElementSibling;
    }
    return h.parentElement;
  }, t.heading);
  const el = handle.asElement();
  if (!el) {
    console.log(`!! ${t.id}: heading not found`);
    continue;
  }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await el.screenshot({ path: `${out}/${t.id}.png` });
  console.log(`saved ${t.id}.png`);
}

await browser.close();
