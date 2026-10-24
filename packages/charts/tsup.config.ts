import { readFileSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

// The modules src/index.ts re-exports, minus types.ts, which holds no code.
const modules = [...readFileSync('src/index.ts', 'utf8').matchAll(/from '\.\/(\w+)'/g)]
  .map(([, name]) => name)
  .filter((name) => name !== 'types');

// Each module is an entry, so each wrapper is its own file in dist/ with the
// ApexCharts engines it imports, and index re-exports those files rather than
// bundling them. Bundled, esbuild would move the wrappers into chunks and leave
// their entry files as stubs nothing imports.
const reexportBuiltModules: EsbuildPlugin = {
  name: 'reexport-built-modules',
  setup(build) {
    const extension = build.initialOptions.outExtension?.['.js'] ?? '.js';
    build.onResolve({ filter: /^\.\/\w+$/ }, ({ path, importer }) =>
      importer.endsWith('/src/index.ts') && modules.includes(path.slice(2))
        ? { path: `${path}${extension}`, external: true }
        : undefined
    );
  },
};

// Splitting puts the code the wrappers share (ApexChart, theme, formatters…) in
// chunks, once. With `sideEffects: false` in package.json, a bundler leaves out
// the files of the wrappers a consumer doesn't import, and their engines with
// them. The engine imports of the wrappers it keeps stay: apexcharts declares
// those modules as having side effects.
export default defineConfig({
  entry: ['src/index.ts', ...modules.map((name) => `src/${name}.{ts,tsx}`)],
  format: ['esm', 'cjs'],
  // The published types stay a single index.d.ts / index.d.cts.
  dts: { entry: 'src/index.ts' },
  sourcemap: true,
  clean: true,
  // In both formats: with `treeshake`, esbuild emits ESM and Rollup converts
  // each file to CJS, so the CJS files mirror the ESM ones.
  splitting: true,
  treeshake: true,
  external: ['react', 'react-dom', 'apexcharts', 'react-apexcharts'],
  esbuildPlugins: [reexportBuiltModules],
  esbuildOptions(options) {
    options.banner = { js: '"use client";' };
  },
});
