import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { expectOwnTypesPerFormat, expectSubpathOwnTypes } from './package-exports';

// The published @sckyzo/cosmos-react bundles are plain JS: a CSS import in them
// would break `require` in Node, Jest and any non-bundler consumer.

const pkgDir = fileURLToPath(new URL('../../../packages/react/', import.meta.url));
const cjs = `${pkgDir}dist/index.cjs`;
const esm = `${pkgDir}dist/index.js`;

test.skip(
  !existsSync(cjs) && !process.env.CI,
  'needs the tsup build (`make build`); CI always builds first'
);

test('the CJS bundle loads in Node without requiring a stylesheet', () => {
  const script = `
    const Module = require('node:module');
    const css = [];
    const resolve = Module._resolveFilename;
    Module._resolveFilename = function (request, ...rest) {
      if (request.endsWith('.css')) css.push(request);
      return resolve.call(this, request, ...rest);
    };
    const cosmos = require(${JSON.stringify(cjs)});
    console.log(JSON.stringify({ css, hasCalendar: typeof cosmos.Calendar }));
  `;
  const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  expect(JSON.parse(out)).toEqual({ css: [], hasCalendar: 'function' });
});

test('neither bundle imports CSS, and the Calendar stylesheet is an explicit export', () => {
  for (const file of [cjs, esm]) {
    expect(readFileSync(file, 'utf8'), file).not.toMatch(/\.css['"]/);
  }
  const pkg = JSON.parse(readFileSync(`${pkgDir}package.json`, 'utf8'));
  expect(pkg.exports['./calendar.css']).toBe('./calendar.css');
  expect(pkg.files).toContain('calendar.css');
  expect(pkg.sideEffects).toEqual(['*.css']);
  expect(existsSync(`${pkgDir}calendar.css`)).toBe(true);
});

test('import and require each resolve their own type declarations', () => {
  expectOwnTypesPerFormat(pkgDir);
});

test('every JS file starts with the "use client" directive', () => {
  // React Server Components bundlers read it to treat the components as client
  // modules. tsup's Rollup pass drops it from the build, so the tsup config
  // prepends it once the files are written.
  const directive = '"use client";\n';
  const files = readdirSync(`${pkgDir}dist`, { recursive: true, encoding: 'utf8' }).filter((name) =>
    /\.c?js$/.test(name)
  );
  expect(files).toEqual(
    expect.arrayContaining(['index.js', 'index.cjs', 'code/index.js', 'code/index.cjs'])
  );
  for (const name of files) {
    const code = readFileSync(`${pkgDir}dist/${name}`, 'utf8');
    expect(code.slice(0, directive.length), name).toBe(directive);
  }
});

// ── `@sckyzo/cosmos-react/code`: syntax highlighting, with `shiki` as an optional peer ──────────
// The root entry never imports the code entry nor Shiki: an app that renders no highlighted block
// ships no highlighter. The code entry imports the root entry as the package itself, never a copy
// of it: a second copy would hold its own contexts and overlay stack.

const codeEsm = `${pkgDir}dist/code/index.js`;
const codeCjs = `${pkgDir}dist/code/index.cjs`;
const read = (file: string) => readFileSync(file, 'utf8');
const distFiles = () =>
  readdirSync(`${pkgDir}dist`, { recursive: true, encoding: 'utf8' }).filter((name) =>
    /\.c?js$/.test(name)
  );

test('Shiki is an optional peer dependency, and a dev dependency of the repo only', () => {
  const pkg = JSON.parse(read(`${pkgDir}package.json`));
  expect(pkg.peerDependencies.shiki).toMatch(/^\^4\./);
  expect(pkg.peerDependenciesMeta).toEqual({ shiki: { optional: true } });
  expect(pkg.dependencies.shiki).toBeUndefined();
});

test('the root entry carries no Shiki and does not import the code entry', () => {
  for (const name of distFiles().filter((file) => !file.startsWith('code/'))) {
    const code = read(`${pkgDir}dist/${name}`);
    expect(code, name).not.toMatch(/shiki/i);
    expect(code, name).not.toMatch(/['"]\.{1,2}\/code\//);
    expect(code, name).not.toContain('@sckyzo/cosmos-react');
  }
});

test('the code entry resolves for import and require, each with its own types', () => {
  expectSubpathOwnTypes(pkgDir, 'code');
});

test('the code entry leaves Shiki and the root entry external, and loads each language on demand', () => {
  for (const file of [codeEsm, codeCjs]) {
    const code = read(file);
    // The root entry is the package imported from itself, not bundled again: no component of
    // it is in this file.
    expect(code, file).toMatch(/(?:from |require\()['"]@sckyzo\/cosmos-react['"]/);
    expect(code, file).not.toContain('Clipboard');
    expect(code.length, file).toBeLessThan(60_000);
    // Shiki is only ever imported dynamically, so the app's bundler splits it and each language.
    expect(code, file).not.toMatch(/(?:from |require\()['"]shiki/);
    for (const language of ['yaml', 'shellscript', 'typescript', 'markdown', 'nginx', 'php']) {
      expect(code, file).toContain(`import('shiki/langs/${language}.mjs')`);
    }
    expect(code, file).toContain("import('shiki/core')");
    expect(code, file).toContain("import('shiki/engine/javascript')");
  }
});

test('the code entry loads in Node as ESM and as CJS, next to the root entry', () => {
  const script = (load: string) => `
    ${load}
    const out = {
      hasCodeBlock: typeof code.CodeBlock,
      loaded: await code.loadLanguage('yaml'),
      unknown: await code.loadLanguage('klingon'),
      coloured: Array.isArray(code.highlight('a: 1', 'yaml')),
      plain: code.highlight('a: 1', 'klingon'),
    };
    console.log(JSON.stringify(out));
  `;
  const esmOut = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      script(`const cosmos = await import(${JSON.stringify(esm)});
        const code = await import(${JSON.stringify(codeEsm)});`),
    ],
    { encoding: 'utf8', cwd: pkgDir }
  );
  const cjsOut = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      script(`import { createRequire } from 'node:module';
        const require = createRequire(import.meta.url);
        const cosmos = require(${JSON.stringify(cjs)});
        const code = require(${JSON.stringify(codeCjs)});`),
    ],
    { encoding: 'utf8', cwd: pkgDir }
  );
  const expected = {
    hasCodeBlock: 'function',
    loaded: true,
    unknown: false,
    coloured: true,
    plain: 'a: 1',
  };
  expect(JSON.parse(esmOut)).toEqual(expected);
  expect(JSON.parse(cjsOut)).toEqual(expected);
});
