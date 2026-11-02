import { defineConfig } from 'tsup';
import { externalizeOutside } from '../../config/tsup/self-reference';
import { prependUseClient } from '../../config/tsup/use-client';

export default defineConfig({
  // Each sub-path entry of the package is a folder of src/ built next to the root one:
  // `@sckyzo/cosmos-react/code` is dist/code/index.*. Its optional peers stay external: shiki for
  // `code`, Tiptap for `editor`, maplibre-gl for `map`, qr for `qr`.
  entry: {
    index: 'src/index.ts',
    'code/index': 'src/code/index.ts',
    'editor/index': 'src/editor/index.ts',
    'map/index': 'src/map/index.ts',
    'qr/index': 'src/qr/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: [
    'react',
    'react-dom',
    '@sckyzo/cosmos-theme',
    'shiki',
    /^shiki\//,
    /^@tiptap\//,
    /^@floating-ui\//,
    'maplibre-gl',
    // ESM only: the CommonJS build requires it, which Node loads from 20.19 and 22.12 on, the
    // versions `qr` itself asks for.
    'qr',
  ],
  // A sub-path entry imports the root entry of the package, never a copy of it: see the plugin.
  // The editor and the map take by value the few internal helpers the root entry does not export;
  // the QR code needs none.
  esbuildPlugins: [
    externalizeOutside('src/code', '@sckyzo/cosmos-react'),
    externalizeOutside('src/editor', '@sckyzo/cosmos-react', {
      bundle: [
        'hooks/useControllableState',
        'hooks/direction',
        'ui/mergeRefs',
        'forms/fieldRecipe',
        'forms/RequiredMark',
        'chat/httpUrl',
      ],
    }),
    externalizeOutside('src/map', '@sckyzo/cosmos-react', {
      bundle: ['hooks/useControllableState', 'settings/useCosmosTheme'],
    }),
    externalizeOutside('src/qr', '@sckyzo/cosmos-react'),
  ],
  // Mark the bundle as a client module for React Server Components bundlers.
  // After the build: Rollup, which `treeshake` runs, drops an esbuild banner.
  async onSuccess() {
    prependUseClient();
  },
});
