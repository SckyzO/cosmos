import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { expectOwnTypesPerFormat } from './package-exports';

// @sckyzo/cosmos-charts ships each wrapper as a file of its own and declares no
// side effects: a consumer's bundler leaves out the wrappers it doesn't import.
// Merged into one file, or without the flag, every consumer ships every
// wrapper, and nothing else fails. Recharts is a dependency the consumer's
// bundler resolves: no file of the package may carry a copy of it.

const pkgDir = fileURLToPath(new URL('../../../packages/charts/', import.meta.url));
const dist = `${pkgDir}dist/`;

test.skip(
  !existsSync(`${dist}index.js`) && !process.env.CI,
  'needs the tsup build (`make build`); CI always builds first'
);

const read = (path: string) => readFileSync(path, 'utf8');

/** The modules a file imports from `name`, ESM or CJS. */
const importsOf = (code: string, name: string) =>
  [...code.matchAll(/(?:import |from |require\()['"]([^'"]+)['"]/g)]
    .map(([, module]) => module)
    .filter((module) => module === name || module.startsWith(`${name}/`));

/** The modules src/index.ts re-exports, as the tsup config lists them. */
const modules = [...read(`${pkgDir}src/index.ts`).matchAll(/from '\.\/(\w+)'/g)]
  .map(([, name]) => name)
  .filter((name) => name !== 'types');

test('the package declares no side effects', () => {
  expect(JSON.parse(read(`${pkgDir}package.json`)).sideEffects).toBe(false);
});

test('each wrapper is a file of its own, and index re-exports them', () => {
  expect(modules).toContain('DonutChart');
  for (const format of ['js', 'cjs']) {
    const index = read(`${dist}index.${format}`);
    // The wrappers are not bundled into index: it points at their files.
    expect(importsOf(index, 'recharts'), `index.${format}`).toEqual([]);
    for (const name of modules) {
      expect(index, `index.${format}`).toContain(`./${name}.${format}`);
      expect(existsSync(`${dist}${name}.${format}`), `${name}.${format}`).toBe(true);
    }
  }
});

test('Recharts stays external: imported by name, never bundled', () => {
  for (const format of ['js', 'cjs']) {
    const files = readdirSync(dist).filter((name) => name.endsWith(`.${format}`));
    const drawing = files.filter((name) => importsOf(read(`${dist}${name}`), 'recharts').length);
    expect(drawing, format).toContain(`LineAreaChart.${format}`);
    for (const name of files) {
      // A bundled Recharts is hundreds of kB and carries its own context.
      expect(read(`${dist}${name}`).length, name).toBeLessThan(150_000);
      expect(importsOf(read(`${dist}${name}`), 'apexcharts'), name).toEqual([]);
      expect(read(`${dist}${name}`), name).not.toMatch(/apexcharts/i);
    }
  }
});

test('the map libraries are imported by WorldMap alone', () => {
  // d3-geo and topojson-client are dependencies only WorldMap needs: any other
  // file importing them, or a chunk shared with the other wrappers, would load
  // them for every consumer of the package.
  for (const format of ['js', 'cjs']) {
    for (const name of readdirSync(dist).filter((file) => file.endsWith(`.${format}`))) {
      const code = read(`${dist}${name}`);
      const imported = [...importsOf(code, 'd3-geo'), ...importsOf(code, 'topojson-client')];
      if (name === `WorldMap.${format}`) expect(imported, name).toHaveLength(2);
      else expect(imported, name).toEqual([]);
    }
  }
});

test('every entry and chunk starts with the "use client" directive', () => {
  // React Server Components bundlers read it to treat the charts as client
  // modules. tsup's Rollup pass drops it from the build, so the tsup config
  // prepends it once the files are written.
  const directive = '"use client";\n';
  const files = readdirSync(dist).filter((name) => /\.c?js$/.test(name));
  expect(files).toEqual(
    expect.arrayContaining(modules.flatMap((name) => [`${name}.js`, `${name}.cjs`]))
  );
  expect(files.filter((name) => name.startsWith('chunk-')).length).toBeGreaterThan(0);
  for (const name of files) {
    expect(read(`${dist}${name}`).slice(0, directive.length), name).toBe(directive);
  }
});

test('import and require each resolve their own type declarations', () => {
  expectOwnTypesPerFormat(pkgDir);
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
  expect(esm).toEqual(expect.arrayContaining(['DonutChart', 'Sparkline', 'LineAreaChart']));
  // What went with ApexCharts.
  for (const name of ['useChartTheme', 'useDarkMode', 'escapeHtml', 'tooltipHtml']) {
    expect(esm).not.toContain(name);
  }
});
