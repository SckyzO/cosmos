import { defineConfig } from 'tsup';
import { prependUseClient } from '../../config/tsup/use-client';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', '@sckyzo/cosmos-theme'],
  // Mark the bundle as a client module for React Server Components bundlers.
  // After the build: Rollup, which `treeshake` runs, drops an esbuild banner.
  async onSuccess() {
    prependUseClient();
  },
});
