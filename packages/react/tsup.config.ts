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
  // Mark all subpath imports as side-effect-free for tree-shaking
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
