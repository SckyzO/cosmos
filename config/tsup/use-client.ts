import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const directive = '"use client";';

/**
 * Marks every JS file of a tsup build as a client module for React Server
 * Components bundlers: entries and chunks, ESM and CJS. Run it as tsup's
 * `onSuccess`, once the files are written.
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
    writeFileSync(file, `${directive}\n${code}`);
    const mapFile = `${file}.map`;
    if (!existsSync(mapFile)) continue;
    const map = JSON.parse(readFileSync(mapFile, 'utf8'));
    map.mappings = `;${map.mappings}`;
    writeFileSync(mapFile, JSON.stringify(map));
  }
};
