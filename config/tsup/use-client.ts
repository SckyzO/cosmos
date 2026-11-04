import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const directive = '"use client";';

/**
 * A file that only re-exports other files (`export * from './Button.js'`, `export { Card } from
 * './Card.js'`), as an entry or a barrel is once each module is a file of its own.
 */
export const isReexportOnly = (code: string) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .every((statement) => /^export\s*(?:\*|\{[^}]*\})\s*from\s*['"][^'"]+['"]$/.test(statement));

/**
 * Marks every JS file of a tsup build as a client module for React Server
 * Components bundlers: entries and chunks, ESM and CJS. Run it as tsup's
 * `onSuccess`, once the files are written.
 *
 * A file that only re-exports others is left without it: a client boundary
 * can't re-export with `export *` (Next.js refuses it), and the files it
 * re-exports carry the directive themselves. A CommonJS file follows the ES
 * module of the same name, where a re-export is still readable.
 *
 * The directive can't go through the build itself. With `treeshake`, tsup
 * passes esbuild's output through Rollup, which drops module-level directives
 * (it warns "Module level directives cause errors when bundled"), so an esbuild
 * `banner` never reaches dist (#259).
 *
 * The directive takes a line of its own, so the source map of each file gets
 * an empty first line: its mappings keep pointing at the right lines.
 */
export const prependUseClient = (outDir = 'dist') => {
  for (const name of readdirSync(outDir, { recursive: true, encoding: 'utf8' })) {
    if (!/\.c?js$/.test(name)) continue;
    const file = join(outDir, name);
    const code = readFileSync(file, 'utf8');
    if (code.startsWith(directive)) continue;
    // A chunk has a name of its own in each format: one with no ES twin keeps the directive.
    const esm = file.replace(/\.cjs$/, '.js');
    const source = esm === file ? code : existsSync(esm) ? readFileSync(esm, 'utf8') : code;
    if (isReexportOnly(source)) continue;
    writeFileSync(file, `${directive}\n${code}`);
    const mapFile = `${file}.map`;
    if (!existsSync(mapFile)) continue;
    const map = JSON.parse(readFileSync(mapFile, 'utf8'));
    map.mappings = `;${map.mappings}`;
    writeFileSync(mapFile, JSON.stringify(map));
  }
};
