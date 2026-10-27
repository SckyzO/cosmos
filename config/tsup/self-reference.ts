import { dirname, relative, resolve, isAbsolute } from 'node:path';
import type { Plugin } from 'esbuild';

/**
 * esbuild plugin for a package entry that lives in a folder of its own (`src/code/` built as
 * `@sckyzo/cosmos-react/code`): what that folder imports from the rest of the package is not
 * bundled into the entry but left as an import of the package's root, `name`.
 *
 * The root entry holds state a second copy would split in two (React contexts, the overlay stack),
 * and bundling it again would ship every component twice. An import of the package from inside
 * itself resolves to the very instance the app already loaded, for `import` and `require` alike.
 * The source keeps plain relative imports, so Storybook, the typecheck and the tests need no
 * alias. The names imported must therefore be exported by the root entry.
 */
export const externalizeOutside = (entryDir: string, name: string): Plugin => ({
  name: 'external-outside-entry',
  setup(build) {
    const root = resolve(entryDir);
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (!args.importer) return undefined;
      const importer = resolve(args.importer);
      if (isInside(root, importer)) {
        const target = resolve(dirname(importer), args.path);
        if (!isInside(root, target)) return { path: name, external: true };
      }
      return undefined;
    });
  },
});

const isInside = (dir: string, file: string) => {
  const path = relative(dir, file);
  return path !== '' && !path.startsWith('..') && !isAbsolute(path);
};
