import { chromium } from '@playwright/test';
const ids = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage();
for (const id of ids) {
  await p.goto(`http://storybook:6006/?path=/docs/${id}`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  });
  await p.waitForTimeout(3_000);
  const f = p.frameLocator('iframe#storybook-preview-iframe');
  const t = f.locator('table.docblock-argstable').first();
  try {
    await t.waitFor({ state: 'visible', timeout: 8_000 });
    const rows = await f.locator('table.docblock-argstable tbody tr').allTextContents();
    const names = rows.map((r) => r.split('\n')[0].trim()).filter(Boolean);
    console.log(`${id}: ${names.length} props → ${names.join(', ')}`);
  } catch {
    console.log(`${id}: NO ARGS TABLE`);
  }
}
await b.close();
