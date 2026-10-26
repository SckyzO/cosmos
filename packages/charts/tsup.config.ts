import { readFileSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';
import { prependUseClient } from '../../config/tsup/use-client';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

// The modules src/index.ts re-exports, minus types.ts, which holds no code.
const modules = [...readFileSync('src/index.ts', 'utf8').matchAll(/from '\.\/(\w+)'/g)]
  .map(([, name]) => name)
  .filter((name) => name !== 'types');

// Each module is an entry, so each wrapper is its own file in dist/, and index
// re-exports those files rather than bundling them. Bundled, esbuild would move the wrappers into chunks and leave
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

// d3-geo ships ES modules only. The ESM build imports it like any dependency;
// the CJS build bundles it, with the d3-array and internmap it pulls, so a
// `require` of the package never needs Node to load ESM from CJS (20.19 and
// 22.12 onwards). THIRD_PARTY_NOTICES.md carries their ISC licences.
const esmOnlyDependencies = ['d3-geo'];
const esmOnlyExternalInEsm: EsbuildPlugin = {
  name: 'esm-only-external-in-esm',
  setup(build) {
    if ((build.initialOptions.outExtension?.['.js'] ?? '.js') !== '.js') return;
    build.onResolve({ filter: /^d3-geo$/ }, ({ path }) => ({ path, external: true }));
  },
};

// Splitting puts the code the wrappers share (the frame, the colors, the
// legend…) in chunks, once. With `sideEffects: false` in package.json, a
// bundler leaves out the files of the wrappers a consumer doesn't import.
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
  // `recharts` is a dependency, so tsup leaves it external too.
  external: ['react', 'react-dom'],
  noExternal: esmOnlyDependencies,
  esbuildPlugins: [reexportBuiltModules, esmOnlyExternalInEsm],
  // Every entry and chunk is a client module for React Server Components
  // bundlers. After the build: Rollup, which `treeshake` runs, drops an
  // esbuild banner.
  async onSuccess() {
    prependUseClient();
  },
});
