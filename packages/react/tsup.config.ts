import { defineConfig } from 'tsup';
import { externalizeOutside } from '../../config/tsup/self-reference';
import { prependUseClient } from '../../config/tsup/use-client';

export default defineConfig({
  // Each sub-path entry of the package is a folder of src/ built next to the root one:
  // `@sckyzo/cosmos-react/code` is dist/code/index.*. Its optional peer (shiki) stays external.
  entry: { index: 'src/index.ts', 'code/index': 'src/code/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', '@sckyzo/cosmos-theme', 'shiki', /^shiki\//],
  // A sub-path entry imports the root entry of the package, never a copy of it: see the plugin.
  esbuildPlugins: [externalizeOutside('src/code', '@sckyzo/cosmos-react')],
  // Mark the bundle as a client module for React Server Components bundlers.
  // After the build: Rollup, which `treeshake` runs, drops an esbuild banner.
  async onSuccess() {
    prependUseClient();
  },
});
