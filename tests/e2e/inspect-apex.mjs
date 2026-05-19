import { chromium } from '@playwright/test';
const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error('usage: node inspect-apex.mjs <story-id> [...story-ids]');
  process.exit(1);
}
const b = await chromium.launch();
const p = await b.newPage();
let totalErrs = 0;
for (const id of ids) {
  const errs = [];
  p.removeAllListeners('pageerror');
  p.removeAllListeners('console');
  p.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() === 'error') errs.push(`error: ${m.text().slice(0, 200)}`);
  });
  await p.goto(`http://storybook:6006/iframe.html?id=${id}`, {
    waitUntil: 'load',
    timeout: 30_000,
  });
  await p.waitForTimeout(5_000);
  const svg = await p.locator('svg.apexcharts-svg').count();
  console.log(`${id}: svg=${svg} errors=${errs.length}`);
  errs.slice(0, 3).forEach((e) => console.log(`  - ${e}`));
  totalErrs += errs.length;
}
await b.close();
process.exit(totalErrs > 0 ? 1 : 0);
