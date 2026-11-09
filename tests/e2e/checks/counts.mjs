// `make counts`: the number of React components and of chart wrappers, from the Storybook index
// and the charts package, counted by the rule of the Welcome page (figuresOf in
// apps/storybook/stories/welcome/catalog.ts, imported here so the two never drift).
//
//   node tests/e2e/checks/counts.mjs [index.json]              prints the figures as JSON
//   node tests/e2e/checks/counts.mjs [index.json] --write      writes them into the README
//   node tests/e2e/checks/counts.mjs [index.json] --description  prints the repository description
//
// The index defaults to the Storybook build's (apps/storybook/storybook-static/index.json). The
// README gives them in one sentence, "has the <n> React components and the <n> chart wrappers";
// component-counts.spec.ts fails when they differ from the stories. Node runs catalog.ts as is:
// it strips the types.
import { readFileSync, writeFileSync } from 'node:fs';
import {
  catalogComponents,
  chartWrappersOf,
  figuresOf,
} from '../../../apps/storybook/stories/welcome/catalog.ts';

/** The README's sentence; the words may wrap. Groups: the two figures. */
const README_FIGURES =
  /has the (\d+)(\s+React\s+components\s+and\s+the\s+)(\d+)(\s+chart\s+wrappers)/;

const root = new URL('../../../', import.meta.url);
const args = process.argv.slice(2);
const indexPath =
  args.find((a) => !a.startsWith('--')) ?? 'apps/storybook/storybook-static/index.json';

const entries = Object.values(JSON.parse(readFileSync(new URL(indexPath, root), 'utf8')).entries);
const charts = chartWrappersOf(readFileSync(new URL('packages/charts/src/index.ts', root), 'utf8'));
const figures = figuresOf(catalogComponents(entries), charts.length);

if (args.includes('--write')) {
  const readme = new URL('README.md', root);
  const before = readFileSync(readme, 'utf8');
  if (!README_FIGURES.test(before))
    throw new Error('README.md: the sentence with the figures is gone');
  const after = before.replace(
    README_FIGURES,
    (_, _components, middle, _charts, end) =>
      `has the ${figures.components}${middle}${figures.charts}${end}`
  );
  writeFileSync(readme, after);
  console.log(after === before ? 'README.md already up to date.' : 'README.md updated.');
} else if (args.includes('--description')) {
  console.log(
    'React design system for admin panels, dashboards and monitoring tools: Tailwind 4 theme ' +
      `(4 themes, 12 accents), ${figures.components} React 19 components and ` +
      `${figures.charts} Recharts chart wrappers, in English or French.`
  );
} else {
  console.log(JSON.stringify(figures));
}
