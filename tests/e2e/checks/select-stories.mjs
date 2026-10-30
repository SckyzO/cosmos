// The story files a change can affect, for `make check-changed`:
//   node tests/e2e/checks/select-stories.mjs <changed files…>
//
// Starts from the names the changed source files export, adds the exports of every source file
// that uses one of those names, until nothing new comes in, then prints the story files that use
// any of them, plus the changed story files. A file uses a name when the name appears in it as a
// word once comments are dropped: there is no import resolution, so a common name can bring in a
// few files too many. What reaches a story some other way than a name (a CSS variable, a theme
// token) is not followed, which is why check-changed runs the full `make ci` for those files.
//
// The Storybook app's own stories (apps/storybook/stories) are searched too: they import the
// packages by relative path and use their components, so a change under packages/*/src can reach
// them. A change inside that folder (a story, or a helper or data file it imports) is followed
// within the folder only: nothing in a package imports from it.
//
// Barrels (index.ts) are skipped: each one names every file of its folder, so following them would
// spread a change to the names they re-export from unrelated files. Only the packages of the
// changed files are searched: charts imports neither react nor theme. Paths are relative to the
// repo root, the working directory.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const changed = process.argv.slice(2);

const EXPORT =
  /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|function|class|type|interface|enum)\s+([A-Za-z_]\w*)/gm;
const EXPORT_LIST = /^export\s+(?:type\s+)?\{([^}]*)\}/gm;
const COMMENT = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

const exportsOf = (text) => {
  const names = new Set([...text.matchAll(EXPORT)].map((m) => m[1]));
  for (const [, list] of text.matchAll(EXPORT_LIST)) {
    for (const item of list.split(',')) {
      const name = item
        .split(/\s+as\s+/)
        .pop()
        .replace(/^\s*type\s+/, '')
        .trim();
      if (name && name !== 'default') names.add(name);
    }
  }
  return names;
};

// Exported names are identifiers, so they need no escaping.
const usesAny = (names) => new RegExp(`\\b(?:${[...names].join('|')})\\b`);

const STORIES_DIR = 'apps/storybook/stories';
const packages = new Set(
  changed.filter((f) => f.startsWith('packages/')).map((f) => f.split('/').slice(0, 2).join('/'))
);
const dirs = [...packages].map((pkg) => join(pkg, 'src'));
if (packages.size > 0 || changed.some((f) => f.startsWith(`${STORIES_DIR}/`))) {
  dirs.push(STORIES_DIR);
}
const files = dirs
  .filter((dir) => existsSync(dir))
  .flatMap((dir) =>
    readdirSync(dir, { recursive: true })
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => join(dir, f))
  );
const isStory = (f) => f.endsWith('.stories.tsx');
const sources = files.filter(
  (f) => !isStory(f) && !f.endsWith('.test.ts') && !f.endsWith('/index.ts')
);
const text = new Map(files.map((f) => [f, readFileSync(f, 'utf8').replace(COMMENT, '')]));

const names = new Set();
const seen = new Set();
const todo = changed.filter((f) => sources.includes(f));
while (todo.length > 0) {
  const file = todo.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  const fresh = [...exportsOf(text.get(file))].filter((name) => !names.has(name));
  if (fresh.length === 0) continue;
  for (const name of fresh) names.add(name);
  const uses = usesAny(fresh);
  todo.push(...sources.filter((f) => !seen.has(f) && uses.test(text.get(f))));
}

const picked = new Set(changed.filter(isStory));
if (names.size > 0) {
  const uses = usesAny(names);
  for (const f of files) if (isStory(f) && uses.test(text.get(f))) picked.add(f);
}
for (const f of [...picked].sort()) console.log(f);
