import { test, expect } from '@playwright/test';

const cases = [
  { id: 'atoms-button--docs', name: 'Button', expectProp: 'variant' },
  { id: 'atoms-badge--docs', name: 'Badge', expectProp: 'variant' },
  { id: 'navigation-tabs--docs', name: 'Tabs', expectProp: 'value' },
  { id: 'navigation-breadcrumb--docs', name: 'Breadcrumb', expectProp: 'items' },
  { id: 'overlays-modal--docs', name: 'Modal', expectProp: 'open' },
  { id: 'overlays-drawer--docs', name: 'Drawer', expectProp: 'open' },
  { id: 'tables-datatable--docs', name: 'DataTable', expectProp: 'rows' },
];

for (const c of cases) {
  test(`autodocs: ${c.name} has ${c.expectProp} prop`, async ({ page }) => {
    await page.goto(`/?path=/docs/${c.id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const frame = page.frameLocator('iframe#storybook-preview-iframe');
    // Storybook 10 renders the ArgTypes table with class `docblock-argstable`.
    // We can't fall back to "first visible table" because for table-rendering
    // components (DataTable) the story preview itself contains a <table>
    // that would shadow the props table.
    const argsTable = frame.locator('table.docblock-argstable').first();
    await argsTable.waitFor({ state: 'visible', timeout: 10000 });
    const txt = (await argsTable.innerText()).toLowerCase();
    expect(txt).toContain(c.expectProp);
  });
}
