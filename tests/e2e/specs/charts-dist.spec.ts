import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

// @sckyzo/cosmos-charts ships each wrapper as a file of its own, importing only
// the ApexCharts engines it draws with, and declares no side effects: a
// consumer's bundler leaves out the wrappers it doesn't import, with their
// engines. Merged into one file, or without the flag, every consumer ships
// every engine, and nothing else fails.

const pkgDir = fileURLToPath(new URL('../../../packages/charts/', import.meta.url));
const dist = `${pkgDir}dist/`;

test.skip(
  !existsSync(`${dist}index.js`) && !process.env.CI,
  'needs the tsup build (`make build`); CI always builds first'
);

const read = (path: string) => readFileSync(path, 'utf8');

/** The `apexcharts/…` modules a file imports for their side effects, ESM or CJS. */
const engines = (code: string) =>
  [...code.matchAll(/(?:import |require\()['"](apexcharts\/[\w/-]+)['"]/g)]
    .map(([, module]) => module)
    .sort();

/** The modules src/index.ts re-exports, as the tsup config lists them. */
const modules = [...read(`${pkgDir}src/index.ts`).matchAll(/from '\.\/(\w+)'/g)]
  .map(([, name]) => name)
  .filter((name) => name !== 'types');

test('the package declares no side effects', () => {
  expect(JSON.parse(read(`${pkgDir}package.json`)).sideEffects).toBe(false);
});

test('each wrapper is a file of its own, importing only its own engines', () => {
  expect(modules).toContain('DonutChart');
  for (const format of ['js', 'cjs']) {
    expect(engines(read(`${dist}index.${format}`)), `index.${format}`).toEqual([]);
    for (const name of modules) {
      const source = [`${pkgDir}src/${name}.tsx`, `${pkgDir}src/${name}.ts`].find(existsSync);
      expect(engines(read(`${dist}${name}.${format}`)), `${name}.${format}`).toEqual(
        engines(read(source ?? ''))
      );
    }
  }
});

test('the CJS and ESM entries expose the same exports', () => {
  const script = `
    const cjs = Object.keys(require(${JSON.stringify(`${dist}index.cjs`)})).sort();
    import(${JSON.stringify(`${dist}index.js`)}).then((esm) => {
      console.log(JSON.stringify({ cjs, esm: Object.keys(esm).sort() }));
    });
  `;
  const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  const { cjs, esm } = JSON.parse(out);
  expect(cjs).toEqual(esm);
  expect(esm).toEqual(
    expect.arrayContaining([
      'DonutChart',
      'Sparkline',
      'useChartTheme',
      'escapeHtml',
      'tooltipHtml',
    ])
  );
});
