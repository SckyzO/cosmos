import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

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

test('every JS file starts with the "use client" directive', () => {
  // React Server Components bundlers read it to treat the components as client
  // modules. tsup's Rollup pass drops it from the build, so the tsup config
  // prepends it once the files are written.
  const directive = '"use client";\n';
  const files = readdirSync(`${pkgDir}dist`).filter((name) => /\.c?js$/.test(name));
  expect(files).toEqual(expect.arrayContaining(['index.js', 'index.cjs']));
  for (const name of files) {
    const code = readFileSync(`${pkgDir}dist/${name}`, 'utf8');
    expect(code.slice(0, directive.length), name).toBe(directive);
  }
});
