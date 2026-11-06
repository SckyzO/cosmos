import { defineConfig } from 'tsup';
import { preserveModules, reachableModules } from '../../config/tsup/preserve-modules';
import { prependUseClient } from '../../config/tsup/use-client';

// Each sub-path entry of the package is a folder of src/ built next to the root one:
// `@sckyzo/cosmos-react/code` is dist/code/index.*. Its optional peers stay external: shiki for
// `code`, Tiptap for `editor`, maplibre-gl for `map`, qr for `qr`. `locales/fr`, the French
// dictionary, has none: it is an entry of its own so that an app loads it when it shows French,
// with `import()`, and ships it to no one else.
const SUBPATHS = ['code', 'editor', 'map', 'qr', 'locales/fr'];
const subpathEntries = Object.fromEntries(
  SUBPATHS.map((dir) => [`${dir}/index`, `src/${dir}/index.ts`])
);

// Every module the entries reach is a file of dist (`dist/ui/Button.js`), so an app ships the
// components it imports and what they import, not the whole library: see the plugin.
const modules = await reachableModules(['src/index.ts', ...Object.values(subpathEntries)], {
  bundled: SUBPATHS,
});

export default defineConfig({
  entry: { ...modules, ...subpathEntries },
  format: ['esm', 'cjs'],
  // The published types stay one declaration file per entry of package.json.
  dts: { entry: { index: 'src/index.ts', ...subpathEntries } },
  sourcemap: true,
  clean: true,
  // Each file imports the other files it needs, so there is nothing for chunks to share.
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
  esbuildPlugins: [preserveModules({ bundled: SUBPATHS })],
  // Mark the files as client modules for React Server Components bundlers.
  // After the build: Rollup, which `treeshake` runs, drops an esbuild banner.
  async onSuccess() {
    prependUseClient();
  },
});
