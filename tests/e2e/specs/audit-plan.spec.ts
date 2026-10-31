import { test, expect } from '@playwright/test';
import { planCaptures, groupOf } from '../captures/audit-plan';

// What `make audit-captures` captures, from a small story list.

const stories = [
  { id: 'examples-dashboard--default', title: 'Examples/Dashboard' },
  { id: 'forms-select--default', title: 'Forms/Select' },
  { id: 'forms-select--open', title: 'Forms/Select' },
  { id: 'layout-shell--default', title: 'Layout/Shell' },
  { id: 'tables-data-table--default', title: 'Tables/DataTable' },
];
const settings = {
  mobile: 'examples-,layout-,navigation-,tables-,monitoring-',
  desktop: 'examples-,layout-',
  themes: ['light', 'sand', 'dark', 'deep-blue'],
};
const keys = (plan: ReturnType<typeof planCaptures>) =>
  plan.map((c) => `${c.width}/${c.theme}/${c.id}`);

test('every story at 1280px in light, once', () => {
  const plan = keys(planCaptures(stories, new Map(), settings));
  for (const { id } of stories) expect(plan).toContain(`1280/light/${id}`);
  expect(new Set(plan).size).toBe(plan.length);
});

test('phone and tablet widths for the groups named, wide ones for the others', () => {
  const plan = keys(planCaptures(stories, new Map(), settings));
  for (const width of [375, 768]) {
    expect(plan).toContain(`${width}/light/layout-shell--default`);
    expect(plan).toContain(`${width}/light/tables-data-table--default`);
    expect(plan).not.toContain(`${width}/light/forms-select--default`);
  }
  expect(plan).toContain('1440/light/examples-dashboard--default');
  expect(plan).not.toContain('1440/light/tables-data-table--default');
});

test('a flagged story is captured at the width it was flagged, and only there', () => {
  const plan = keys(
    planCaptures(stories, new Map([['forms-select--open', [375, 1440]]]), settings)
  );
  expect(plan).toContain('375/light/forms-select--open');
  expect(plan).toContain('1440/light/forms-select--open');
  expect(plan).not.toContain('768/light/forms-select--open');
  expect(plan).not.toContain('375/light/forms-select--default');
});

test('the other themes, on the first story of each component only', () => {
  const plan = keys(planCaptures(stories, new Map(), settings));
  for (const theme of ['sand', 'dark', 'deep-blue']) {
    expect(plan).toContain(`1280/${theme}/forms-select--default`);
    expect(plan).not.toContain(`1280/${theme}/forms-select--open`);
    expect(plan.filter((k) => k.startsWith(`1280/${theme}/`))).toHaveLength(4);
  }
});

test('an empty filter matches nothing, a title gives its group', () => {
  const plan = keys(planCaptures(stories, new Map(), { ...settings, mobile: '', desktop: ' , ' }));
  expect(plan.some((k) => k.startsWith('375/') || k.startsWith('1440/'))).toBe(false);
  expect(groupOf('Forms/Select')).toBe('Forms');
  expect(groupOf('Welcome')).toBe('Welcome');
});
