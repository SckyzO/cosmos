import { dirname, relative, resolve, isAbsolute, sep } from 'node:path';
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
 *
 * `bundle` lists the modules (paths under `src/`, no extension: `hooks/useControllableState`) the
 * entry takes by value instead: the internal helpers that share no state with the rest of the
 * package (no context, no overlay stack), which the root entry does not export. A copy of them is
 * harmless; a copy of a context is not, so never list a module that creates one, or imports one.
 */
export const externalizeOutside = (
  entryDir: string,
  name: string,
  { bundle = [] }: { bundle?: string[] } = {}
): Plugin => ({
  name: `external-outside-${entryDir}`,
  setup(build) {
    const root = resolve(entryDir);
    const byValue = (target: string) =>
      bundle.some((module) => target.split(sep).join('/').endsWith(`/${module}`));
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (!args.importer) return undefined;
      const importer = resolve(args.importer);
      if (isInside(root, importer)) {
        const target = resolve(dirname(importer), args.path);
        if (!isInside(root, target) && !byValue(target)) return { path: name, external: true };
      }
      return undefined;
    });
  },
});

const isInside = (dir: string, file: string) => {
  const path = relative(dir, file);
  return path !== '' && !path.startsWith('..') && !isAbsolute(path);
};
