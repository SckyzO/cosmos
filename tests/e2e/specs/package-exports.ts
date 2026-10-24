import { existsSync, readFileSync } from 'node:fs';
import { expect } from '@playwright/test';

/**
 * Checks that the root entry of the package in `pkgDir` gives `import` and
 * `require` each their own type declarations, and that every file it names
 * was built.
 *
 * TypeScript takes the first condition that matches. A single `types` ahead of
 * `import` and `require` gave a CommonJS consumer (`moduleResolution: node16`
 * or `nodenext`) the ESM declarations, and a TS1479 error (#260). In a
 * `"type": "module"` package, `.js` and `.d.ts` files are ESM, `.cjs` and
 * `.d.cts` files CommonJS.
 */
export const expectOwnTypesPerFormat = (pkgDir: string) => {
  const pkg = JSON.parse(readFileSync(`${pkgDir}package.json`, 'utf8'));
  expect(pkg.type).toBe('module');
  const root = pkg.exports['.'];
  expect(root).toEqual({
    import: { types: './dist/index.d.ts', default: './dist/index.js' },
    require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
  });
  // `types` first for TypeScript, `default` last for Node.
  expect(Object.keys(root.import)).toEqual(['types', 'default']);
  expect(Object.keys(root.require)).toEqual(['types', 'default']);
  // For the resolvers that ignore `exports` (TypeScript's node10, old bundlers).
  expect({ main: pkg.main, module: pkg.module, types: pkg.types }).toEqual({
    main: './dist/index.cjs',
    module: './dist/index.js',
    types: './dist/index.d.ts',
  });
  for (const file of [...Object.values(root.import), ...Object.values(root.require)]) {
    expect(existsSync(`${pkgDir}${file}`), `${file} is built`).toBe(true);
  }
};
