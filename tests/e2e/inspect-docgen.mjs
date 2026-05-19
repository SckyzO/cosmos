import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage();
for (const id of ['atoms-badge--docs', 'atoms-button--docs', 'tables-datatable--docs']) {
  await p.goto(`http://storybook:6006/?path=/docs/${id}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);
  const f = p.frameLocator('iframe#storybook-preview-iframe');
  const t = f.locator('table.docblock-argstable').first();
  try {
    await t.waitFor({ state: 'visible', timeout: 5000 });
    console.log(`\n=== ${id} ===\n${(await t.innerText()).slice(0, 600)}`);
  } catch {
    console.log(`\n=== ${id} ===\nNO ARGS TABLE FOUND`);
  }
}
await b.close();
