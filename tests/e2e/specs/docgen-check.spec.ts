import { test, expect } from '@playwright/test';

// Autodocs prop extraction uses `react-docgen` (Babel parser). The previous
// `react-docgen-typescript` engine (pinned at its unmaintained 2.4.0, pre-TS6)
// silently dropped every optional prop; the Babel parser handles TS 6 type
// aliases + function components correctly. These assertions guard against a
// regression of that fix — each component must expose a representative
// optional prop, not just its required ones.
//
// Modal + List render through a portal / a dynamic `<Tag>` element, which
// react-docgen can't trace to the props type; their Controls surface is
// restored via explicit `argTypes` in the story meta — covered here too so a
// dropped argTypes block is caught.
const cases: Array<{ id: string; name: string; expectProp: string }> = [
  { id: 'atoms-button--docs', name: 'Button', expectProp: 'variant' },
  { id: 'atoms-badge--docs', name: 'Badge', expectProp: 'intent' },
  { id: 'navigation-tabs--docs', name: 'Tabs', expectProp: 'orientation' },
  { id: 'navigation-breadcrumb--docs', name: 'Breadcrumb', expectProp: 'items' },
  { id: 'overlays-drawer--docs', name: 'Drawer', expectProp: 'open' },
  { id: 'tables-datatable--docs', name: 'DataTable', expectProp: 'selectable' },
  { id: 'overlays-modal--docs', name: 'Modal', expectProp: 'size' },
  { id: 'typography-list--docs', name: 'List', expectProp: 'variant' },
];

for (const c of cases) {
  test(`autodocs: ${c.name} has ${c.expectProp} prop`, async ({ page }) => {
    await page.goto(`/?path=/docs/${c.id}`);
    const frame = page.frameLocator('iframe#storybook-preview-iframe');
    // Storybook 10 renders the ArgTypes table with class `docblock-argstable`.
    // We can't fall back to "first visible table" because for table-rendering
    // components (DataTable) the story preview itself contains a <table>
    // that would shadow the props table.
    const argsTable = frame.locator('table.docblock-argstable').first();
    // Web-first assertion instead of a fixed sleep: retries until the table is
    // populated. The generous timeout (kept under the 30 s test timeout) is for
    // the dev-server paths (compose, ./devctl e2e), which compile the docs page
    // on first visit; CI serves the static build and resolves in a second.
    await expect(argsTable).toContainText(c.expectProp, { ignoreCase: true, timeout: 20_000 });
  });
}
