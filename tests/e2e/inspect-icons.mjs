import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => {
  if (m.type() === 'error') errs.push('error: ' + m.text().slice(0, 140));
});
await p.goto('http://storybook:6006/iframe.html?id=foundations-icons--gallery', {
  waitUntil: 'networkidle',
  timeout: 30_000,
});
await p.waitForTimeout(4_000);
const tiles = await p.locator('button.group').count();
const svgs = await p.locator('button.group svg').count();
console.log(`gallery default: tiles=${tiles} svgs=${svgs} errors=${errs.length}`);

// search filter
const input = p.locator('input[type="text"]').first();
await input.fill('rocket');
await p.waitForTimeout(800);
const afterSearch = await p.locator('button.group').count();
console.log(`after search "rocket": tiles=${afterSearch}`);

errs.slice(0, 5).forEach((e) => console.log('  - ' + e));
await b.close();
process.exit(errs.length > 0 ? 1 : 0);
