import { defineConfig } from 'tsup';

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
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
