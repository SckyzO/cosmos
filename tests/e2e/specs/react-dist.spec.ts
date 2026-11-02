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
    expect.arrayContaining([
      'index.js',
      'index.cjs',
      'code/index.js',
      'code/index.cjs',
      'editor/index.js',
      'editor/index.cjs',
      'map/index.js',
      'map/index.cjs',
      'qr/index.js',
      'qr/index.cjs',
    ])
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
  expect(pkg.peerDependenciesMeta.shiki).toEqual({ optional: true });
  expect(pkg.dependencies.shiki).toBeUndefined();
});

test('the root entry carries no Shiki, MapLibre nor qr and does not import a sub-path entry', () => {
  for (const name of distFiles().filter((file) => !/^(?:code|editor|map|qr)\//.test(file))) {
    const code = read(`${pkgDir}dist/${name}`);
    expect(code, name).not.toMatch(/shiki/i);
    expect(code, name).not.toMatch(/maplibre/i);
    expect(code, name).not.toMatch(/(?:from |require\(|import\()['"]qr['"]/);
    expect(code, name).not.toMatch(/['"]\.{1,2}\/(?:code|editor|map|qr)\//);
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

// ── `@sckyzo/cosmos-react/editor`: formatted text, with Tiptap as optional peers ────────────────
// Same contract as the code entry: the root entry ships no Tiptap, and the editor entry imports the
// root entry as the package itself. It also takes by value a few internal helpers the root entry
// does not export, so every name it asks of the root entry has to exist there.

const editorEsm = `${pkgDir}dist/editor/index.js`;
const editorCjs = `${pkgDir}dist/editor/index.cjs`;
const TIPTAP_PEERS = [
  '@tiptap/core',
  '@tiptap/extension-image',
  '@tiptap/extension-text-align',
  '@tiptap/extensions',
  '@tiptap/pm',
  '@tiptap/react',
  '@tiptap/starter-kit',
];

test('Tiptap is made of optional peer dependencies, and dev dependencies of the repo only', () => {
  const pkg = JSON.parse(read(`${pkgDir}package.json`));
  for (const name of TIPTAP_PEERS) {
    expect(pkg.peerDependencies[name], name).toMatch(/^\^3\./);
    expect(pkg.peerDependenciesMeta[name], name).toEqual({ optional: true });
    expect(pkg.dependencies[name], name).toBeUndefined();
    expect(pkg.devDependencies[name], name).toMatch(/^3\.\d+\.\d+$/);
  }
});

test('no entry but the editor one carries Tiptap or ProseMirror', () => {
  for (const name of distFiles().filter((file) => !file.startsWith('editor/'))) {
    const code = read(`${pkgDir}dist/${name}`);
    expect(code, name).not.toMatch(/tiptap|prosemirror/i);
  }
});

test('the editor entry resolves for import and require, each with its own types', () => {
  expectSubpathOwnTypes(pkgDir, 'editor');
});

test('the editor entry leaves Tiptap and the root entry external', () => {
  for (const file of [editorEsm, editorCjs]) {
    const code = read(file);
    expect(code, file).toMatch(/(?:from |require\()['"]@sckyzo\/cosmos-react['"]/);
    for (const name of [
      '@tiptap/react',
      '@tiptap/react/menus',
      '@tiptap/starter-kit',
      '@tiptap/extensions',
      '@tiptap/extension-image',
      '@tiptap/extension-text-align',
    ]) {
      expect(code, file).toMatch(new RegExp(`(?:from |require\\()['"]${name}['"]`));
    }
    // Neither Tiptap, ProseMirror nor a component of the root entry is bundled in.
    expect(code, file).not.toMatch(/class \w*(?:EditorView|Schema)\b/);
    expect(code, file).not.toContain('Clipboard');
    expect(code.length, file).toBeLessThan(60_000);
  }
});

test('the editor entry only asks the root entry for names it exports', () => {
  const cosmos: string[] = JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const c = await import(${JSON.stringify(esm)}); console.log(JSON.stringify(Object.keys(c)));`,
      ],
      { encoding: 'utf8', cwd: pkgDir }
    )
  );
  const esmSource = read(editorEsm);
  const imported = [
    ...esmSource.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@sckyzo\/cosmos-react['"]/g),
  ].flatMap(([, list]) =>
    list
      .split(',')
      .map((item) => item.split(' as ')[0].trim())
      .filter(Boolean)
  );
  expect(imported.length).toBeGreaterThan(0);
  expect(imported.filter((name) => !cosmos.includes(name))).toEqual([]);

  const cjsSource = read(editorCjs);
  const binding =
    /(?:var|const|let) (\w+) = (?:__toESM\()?require\(['"]@sckyzo\/cosmos-react['"]\)/.exec(
      cjsSource
    )?.[1];
  expect(binding).toBeTruthy();
  const used = [...cjsSource.matchAll(new RegExp(`\\b${binding}\\.(\\w+)`, 'g'))].map(
    ([, name]) => name
  );
  expect(used.length).toBeGreaterThan(0);
  expect(used.filter((name) => !cosmos.includes(name))).toEqual([]);
});

test('the editor entry loads in Node as ESM and as CJS, next to the root entry', () => {
  const script = (load: string) => `
    ${load}
    console.log(JSON.stringify({
      editor: typeof editor.RichTextEditor,
      actions: editor.RICH_TEXT_ACTIONS.length,
    }));
  `;
  const esmOut = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      script(`await import(${JSON.stringify(esm)});
        const editor = await import(${JSON.stringify(editorEsm)});`),
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
        require(${JSON.stringify(cjs)});
        const editor = require(${JSON.stringify(editorCjs)});`),
    ],
    { encoding: 'utf8', cwd: pkgDir }
  );
  expect(JSON.parse(esmOut)).toEqual({ editor: 'function', actions: 15 });
  expect(JSON.parse(cjsOut)).toEqual({ editor: 'function', actions: 15 });
});

// ── `@sckyzo/cosmos-react/map`: the map, with `maplibre-gl` as an optional peer ─────────────────
// Same contract as the code entry: the root entry and the other entries never import MapLibre, so
// an app that draws no map ships none of it.

const mapEsm = `${pkgDir}dist/map/index.js`;
const mapCjs = `${pkgDir}dist/map/index.cjs`;

test('MapLibre is an optional peer dependency, and an exact dev dependency of the repo only', () => {
  const pkg = JSON.parse(read(`${pkgDir}package.json`));
  expect(pkg.peerDependencies['maplibre-gl']).toMatch(/^\^5\.\d+\.\d+ \|\| \^6\.\d+\.\d+$/);
  expect(pkg.peerDependenciesMeta['maplibre-gl']).toEqual({ optional: true });
  expect(pkg.dependencies['maplibre-gl']).toBeUndefined();
  expect(pkg.devDependencies['maplibre-gl']).toMatch(/^6\.\d+\.\d+$/);
});

test('the code and editor entries carry no MapLibre either', () => {
  for (const file of [codeEsm, codeCjs, editorEsm, editorCjs]) {
    expect(read(file), file).not.toMatch(/maplibre/i);
  }
});

test('the map entry resolves for import and require, each with its own types', () => {
  expectSubpathOwnTypes(pkgDir, 'map');
});

test('the map entry leaves MapLibre external and imports it on demand', () => {
  for (const file of [mapEsm, mapCjs]) {
    const code = read(file);
    // Only a dynamic import: the app's bundler splits MapLibre off, and Node loads the entry
    // without it.
    expect(code, file).toContain("import('maplibre-gl')");
    expect(code, file).not.toMatch(/(?:from |require\()['"]maplibre-gl/);
    // Nothing of the rest of the package is copied into it.
    expect(code, file).not.toContain('Clipboard');
    expect(code, file).not.toContain('OverlayLayer');
    expect(code.length, file).toBeLessThan(60_000);
    // A stylesheet is the app's to load, never bundled.
    expect(code, file).not.toMatch(/\.css['"]/);
  }
});

test('the map entry loads in Node as ESM and as CJS, without importing MapLibre', () => {
  const script = (load: string) => `
    ${load}
    console.log(JSON.stringify({
      view: typeof map.MapView,
      list: typeof map.MapMarkerList,
      names: Object.keys(map).sort(),
    }));
  `;
  const esmOut = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', script(`const map = await import(${JSON.stringify(mapEsm)});`)],
    { encoding: 'utf8', cwd: pkgDir }
  );
  const cjsOut = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      script(`import { createRequire } from 'node:module';
        const map = createRequire(import.meta.url)(${JSON.stringify(mapCjs)});`),
    ],
    { encoding: 'utf8', cwd: pkgDir }
  );
  const expected = { view: 'function', list: 'function', names: ['MapMarkerList', 'MapView'] };
  expect(JSON.parse(esmOut)).toEqual(expected);
  expect(JSON.parse(cjsOut)).toEqual(expected);
});

// ── `@sckyzo/cosmos-react/qr`: the QR code, with `qr` as an optional peer ───────────────────────
// Same contract as the map entry: the root entry and the other entries never import `qr`, so an app
// that draws no QR code ships none of it. `qr` ships ES modules only and stays external in both
// builds: the CommonJS file `require`s it, which Node loads from 20.19 and 22.12 on (the versions
// `qr` itself asks for), so the entry has to load from CommonJS with it installed.

const qrEsm = `${pkgDir}dist/qr/index.js`;
const qrCjs = `${pkgDir}dist/qr/index.cjs`;

test('qr is an optional peer dependency kept inside 0.7, and an exact dev dependency of the repo only', () => {
  const pkg = JSON.parse(read(`${pkgDir}package.json`));
  // Below 1.0 a minor can break: the range stops at the next one, and a new minor is a deliberate bump.
  expect(pkg.peerDependencies.qr).toMatch(/^~0\.7\.\d+$/);
  expect(pkg.peerDependenciesMeta.qr).toEqual({ optional: true });
  expect(pkg.dependencies.qr).toBeUndefined();
  expect(pkg.devDependencies.qr).toMatch(/^0\.7\.\d+$/);
});

test('no entry but the qr one imports qr', () => {
  for (const name of distFiles().filter((file) => !file.startsWith('qr/'))) {
    expect(read(`${pkgDir}dist/${name}`), name).not.toMatch(
      /(?:from |require\(|import\()['"]qr['"]/
    );
  }
});

test('the qr entry resolves for import and require, each with its own types', () => {
  expectSubpathOwnTypes(pkgDir, 'qr');
});

test('the qr entry leaves qr external in both builds and copies nothing of the rest in', () => {
  for (const file of [qrEsm, qrCjs]) {
    const code = read(file);
    expect(code, file).toMatch(/(?:from |require\()['"]qr['"]/);
    // The encoder is not bundled (it is 40 KB on its own), nor a component of the root entry, and
    // the entry imports no other file of the package.
    expect(code.length, file).toBeLessThan(10_000);
    expect(code, file).not.toContain('Clipboard');
    expect(code, file).not.toMatch(/(?:from |require\()['"]\./);
    expect(code, file).not.toContain('@sckyzo/cosmos-react');
  }
});

test('the qr entry loads in Node as ESM and as CJS, and draws a code from the ESM-only qr', () => {
  const script = (load: string) => `
    import { createRequire } from 'node:module';
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    const require = createRequire(import.meta.url);
    ${load}
    const html = renderToStaticMarkup(createElement(qr.QrCode, { value: 'hello', label: 'Hello' }));
    console.log(JSON.stringify({
      names: Object.keys(qr).sort(),
      role: /role="img"/.test(html),
      name: /aria-label="Hello"/.test(html),
      crisp: /shape-rendering="crispEdges"/.test(html),
      viewBox: /viewBox="0 0 29 29"/.test(html),
      paths: html.match(/<path /g)?.length,
    }));
  `;
  const esmOut = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', script(`const qr = await import(${JSON.stringify(qrEsm)});`)],
    { encoding: 'utf8', cwd: pkgDir }
  );
  const cjsOut = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', script(`const qr = require(${JSON.stringify(qrCjs)});`)],
    { encoding: 'utf8', cwd: pkgDir }
  );
  const expected = {
    names: ['QrCode'],
    role: true,
    name: true,
    crisp: true,
    // 21 modules for the smallest symbol, and the four-module quiet zone on each side.
    viewBox: true,
    paths: 1,
  };
  expect(JSON.parse(esmOut)).toEqual(expected);
  expect(JSON.parse(cjsOut)).toEqual(expected);
});
