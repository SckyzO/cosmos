import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://storybook:6006/?path=/story/atoms-button--variants', {
  waitUntil: 'networkidle',
  timeout: 30_000,
});
await p.waitForTimeout(3_000);
// Storybook 10 toolbar buttons : look for any button with viewport-related title
const candidates = await p.locator('button[title], a[title]').all();
const matches = [];
for (const c of candidates) {
  const title = await c.getAttribute('title');
  if (title && /viewport|size|preview|responsive/i.test(title)) {
    matches.push(title);
  }
}
console.log(`toolbar buttons matching viewport/size: ${matches.length}`);
matches.forEach((t) => console.log(`  - "${t}"`));
await p.screenshot({ path: '/tmp/viewport-toolbar.png', fullPage: false });
console.log('screenshot saved to /tmp/viewport-toolbar.png');
await b.close();
