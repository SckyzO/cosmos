import { existsSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { build, type Plugin } from 'esbuild';

/**
 * One file in dist for each module of src: `src/ui/Button.tsx` is `dist/ui/Button.js`, and its
 * relative imports stay imports of the files built next to it. With `sideEffects` in package.json,
 * an app's bundler then keeps the files its imports reach and drops the rest; bundled into one
 * file, the package left it nothing to drop but the statements it could prove unused, and an app
 * importing a button shipped most of the library and the dependencies of every component.
 *
 * Each module is built once, so a context or a piece of module state (the overlay stack, the
 * ticker) exists once, whatever imports it.
 *
 * A sub-path entry (`@sckyzo/cosmos-react/code`, the folder `src/code/`) is the exception: its
 * folder is bundled into `dist/code/index.js`, its library staying an optional peer. What the folder
 * imports from the rest of src is the built file of that module (`../ui/Popover.js`), never a copy.
 */

const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

const toPosix = (path: string) => path.split(sep).join('/');

const isInside = (dir: string, file: string) => {
  const path = relative(dir, file);
  return path !== '' && !path.startsWith('..') && !isAbsolute(path);
};

/** The source file a relative import names: `./Button`, `./ui` (its index) or a full name. */
const sourceFile = (from: string) => {
  if (SOURCE_EXTENSIONS.some((ext) => from.endsWith(ext)) && existsSync(from)) return from;
  for (const candidate of [
    ...SOURCE_EXTENSIONS.map((ext) => `${from}${ext}`),
    ...SOURCE_EXTENSIONS.map((ext) => `${from}/index${ext}`),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
};

/** The import, from a file built in `dir`, of the file built from `target`. */
const builtImport = (dir: string, target: string, extension: string) => {
  const path = toPosix(relative(dir, target)).replace(/\.tsx?$/, extension);
  return path.startsWith('.') ? path : `./${path}`;
};

/**
 * The modules of `srcDir` that `entries` reach at run time, as tsup entries
 * (`{ 'ui/Button': 'src/ui/Button.tsx' }`), minus the files of the `bundled` folders, which their
 * own entry holds. Stories, tests and the Storybook helpers are not reached, so they are not built;
 * modules only imported as types are erased and left out too.
 */
export const reachableModules = async (
  entries: string[],
  { srcDir = 'src', bundled = [] }: { srcDir?: string; bundled?: string[] } = {}
) => {
  const root = resolve(srcDir);
  const folders = bundled.map((dir) => resolve(root, dir));
  const { metafile } = await build({
    entryPoints: entries,
    bundle: true,
    write: false,
    outdir: 'dist',
    metafile: true,
    packages: 'external',
    logLevel: 'silent',
  });
  const modules: Record<string, string> = {};
  for (const input of Object.keys(metafile.inputs)) {
    const file = resolve(input);
    if (!isInside(root, file) || !SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext))) continue;
    if (folders.some((dir) => isInside(dir, file))) continue;
    modules[toPosix(relative(root, file)).replace(/\.tsx?$/, '')] = toPosix(
      relative(process.cwd(), file)
    );
  }
  return modules;
};

/**
 * esbuild plugin: a relative import between two modules of `srcDir` is left as an import of the
 * built file (`../hooks/useControllableState.js`, `.cjs` in the CommonJS build), so each entry
 * holds its own module only. Inside a `bundled` folder, the folder's own modules are bundled and
 * the rest is imported the same way, from the folder its entry is built in.
 */
export const preserveModules = ({
  srcDir = 'src',
  bundled = [],
}: { srcDir?: string; bundled?: string[] } = {}): Plugin => ({
  name: 'preserve-modules',
  setup(build) {
    const root = resolve(srcDir);
    const folders = bundled.map((dir) => resolve(root, dir));
    const extension = build.initialOptions.outExtension?.['.js'] ?? '.js';
    build.onResolve({ filter: /^\.\.?\// }, ({ path, importer }) => {
      if (!importer) return undefined;
      const from = resolve(importer);
      if (!isInside(root, from)) return undefined;
      const target = sourceFile(resolve(dirname(from), path));
      if (!target || !isInside(root, target)) return undefined;
      const folder = folders.find((dir) => isInside(dir, from));
      if (folder && isInside(folder, target)) return undefined;
      if (folders.some((dir) => dir !== folder && isInside(dir, target))) {
        return {
          errors: [
            {
              text: `${path}: a module may not import a sub-path entry's folder, built as one file`,
            },
          ],
        };
      }
      return { path: builtImport(folder ?? dirname(from), target, extension), external: true };
    });
  },
});
