import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import {
  catalogComponents,
  chartWrappersOf,
  figuresOf,
  type IndexEntry,
} from '../../../apps/storybook/stories/welcome/catalog';

// The README gives the number of components and chart wrappers the Welcome page shows. This fails
// when a component is added or removed without them: `make counts` rewrites them, and the GitHub
// description with them.

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('the README counts the components and chart wrappers the stories have', async ({
  request,
}) => {
  const index = (await (await request.get('/index.json')).json()) as {
    entries: Record<string, IndexEntry>;
  };
  const charts = chartWrappersOf(read('packages/charts/src/index.ts')).length;
  const figures = figuresOf(catalogComponents(Object.values(index.entries)), charts);

  const readme = read('README.md').replace(/\s+/g, ' ');
  expect(readme, 'run `make counts`').toContain(
    `has the ${figures.components} React components and the ${figures.charts} chart wrappers`
  );
});
