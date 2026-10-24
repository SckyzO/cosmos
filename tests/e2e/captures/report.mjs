// Writes the report of `make visual-diff`: <diff-dir>/index.html, from what
// visual-diff.sh left in <diff-dir> (changed.txt, new.txt, removed.txt,
// common.txt, and a before, after and diff image per changed capture).
//
//   node report.mjs <diff-dir> [--base-label <text>] [--head-label <text>]
//                              [--stories <filter>] [--themes <filter>]
//
// One self-contained page: inline CSS, relative image paths, light and dark. A
// row per changed story, with the three images of each theme side by side;
// stories that did not change are only counted. The names come from file names,
// so every one of them goes through `esc` before it is written into the page.
import { closeSync, existsSync, openSync, readFileSync, readSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'base-label': { type: 'string', default: 'base' },
    'head-label': { type: 'string', default: 'working tree' },
    stories: { type: 'string', default: '' },
    themes: { type: 'string', default: '' },
  },
});
if (positionals.length !== 1) {
  console.error('usage: node report.mjs <diff-dir> [--base-label ..] [--head-label ..]');
  process.exit(2);
}
const dir = path.resolve(positionals[0]);
// screenshots/base, screenshots/head and screenshots/diff sit side by side.
const baseDir = path.join(dir, '..', 'base');
const headDir = path.join(dir, '..', 'head');

/** Text and attribute values: the only way a name reaches the page. */
const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/** A path as a relative URL, each segment encoded. */
const url = (...segments) =>
  segments
    .join('/')
    .split('/')
    .map((segment) => (segment === '..' ? segment : encodeURIComponent(segment)))
    .join('/');

const readLines = (file) =>
  existsSync(file)
    ? readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
    : [];

// <theme>/<story-id>.png: the only shape visual-diff.sh lets through.
const CAPTURE = /^([a-z0-9-]+)\/([a-z0-9._-]+)\.png$/;

/** Story id -> themes, from a list of capture paths. */
const groupByStory = (lines) => {
  const stories = new Map();
  for (const line of lines) {
    const match = CAPTURE.exec(line);
    if (!match) continue;
    const [, theme, id] = match;
    if (!stories.has(id)) stories.set(id, new Set());
    stories.get(id).add(theme);
  }
  return stories;
};

const changed = groupByStory(readLines(path.join(dir, 'changed.txt')));
const appeared = groupByStory(readLines(path.join(dir, 'new.txt')));
const disappeared = groupByStory(readLines(path.join(dir, 'removed.txt')));
const compared = groupByStory(readLines(path.join(dir, 'common.txt')));

// The order of the Storybook toolbar first, any other theme after.
const THEME_ORDER = ['light', 'sand', 'dark', 'deep-blue'];
const themeRank = (theme) => {
  const rank = THEME_ORDER.indexOf(theme);
  return rank === -1 ? THEME_ORDER.length : rank;
};
const sortThemes = (themes) =>
  [...themes].sort((a, b) => themeRank(a) - themeRank(b) || a.localeCompare(b));
const sortedIds = (stories) => [...stories.keys()].sort();
const countCaptures = (stories) => [...stories.values()].reduce((sum, t) => sum + t.size, 0);

/** Width and height of a PNG, from its header. */
const pngSize = (file) => {
  const header = Buffer.alloc(24);
  const fd = openSync(file, 'r');
  try {
    readSync(fd, header, 0, 24, 0);
  } finally {
    closeSync(fd);
  }
  return `${header.readUInt32BE(16)}×${header.readUInt32BE(20)}`;
};

const figure = (label, theme, id, kind, extra = '') => {
  const src = url(theme, `${id}.${kind}.png`);
  return `<figure>
  <figcaption>${label}${extra}</figcaption>
  <a href="${esc(src)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(src)}" alt="${esc(`${label}: ${id}, ${theme}`)}"></a>
</figure>`;
};

const themeBlock = (id, theme) => {
  const sizes = {
    before: pngSize(path.join(dir, theme, `${id}.before.png`)),
    after: pngSize(path.join(dir, theme, `${id}.after.png`)),
  };
  // compare writes a diff image only when both captures have the same size.
  const diff = existsSync(path.join(dir, theme, `${id}.diff.png`))
    ? figure('diff', theme, id, 'diff')
    : `<figure class="nodiff">
  <figcaption>diff</figcaption>
  <p>The size changed: ${esc(sizes.before)} before, ${esc(sizes.after)} after.</p>
</figure>`;
  return `<div class="theme">
<h3>${esc(theme)}</h3>
<div class="trio">
${figure('before', theme, id, 'before', ` <small>${esc(sizes.before)}</small>`)}
${figure('after', theme, id, 'after', ` <small>${esc(sizes.after)}</small>`)}
${diff}
</div>
</div>`;
};

const storySection = (id) => {
  const changedThemes = sortThemes(changed.get(id));
  const unchangedThemes = sortThemes(
    [...(compared.get(id) ?? [])].filter((theme) => !changed.get(id).has(theme))
  );
  return `<section class="story" id="${esc(`story-${id}`)}">
<h2><code>${esc(id)}</code></h2>
${changedThemes.map((theme) => themeBlock(id, theme)).join('\n')}
${unchangedThemes.length > 0 ? `<p class="muted">Unchanged: ${unchangedThemes.map(esc).join(', ')}.</p>` : ''}
</section>`;
};

/** New or removed stories: where to see the capture that exists. */
const storyList = (stories, folder) => {
  if (stories.size === 0) return '<p class="muted">None.</p>';
  const rel = path.relative(dir, folder);
  const items = sortedIds(stories).map((id) => {
    const links = sortThemes(stories.get(id))
      .map(
        (theme) =>
          `<a href="${esc(url(rel, theme, `${id}.png`))}" target="_blank" rel="noopener">${esc(theme)}</a>`
      )
      .join(', ');
    return `<li><code>${esc(id)}</code> <span class="muted">${links}</span></li>`;
  });
  return `<ul>\n${items.join('\n')}\n</ul>`;
};

const MAX_PROBLEMS = 200;
const problemList = (label, folder) => {
  const lines = readLines(path.join(folder, 'problems.txt'));
  if (lines.length === 0) return '';
  const listed = lines.slice(0, MAX_PROBLEMS).map((line) => `<li>${esc(line)}</li>`);
  if (lines.length > MAX_PROBLEMS) listed.push(`<li>and ${lines.length - MAX_PROBLEMS} more</li>`);
  return `<details><summary>${esc(label)}: ${lines.length}</summary><ul>\n${listed.join('\n')}\n</ul></details>`;
};
const problems = [
  problemList('At base', baseDir),
  problemList('In the working tree', headDir),
].filter(Boolean);

const identical = [...compared.keys()].filter((id) => !changed.has(id)).length;
const nothing = changed.size + appeared.size + disappeared.size === 0;

const stat = (count, label, captures) => `<div class="stat${count > 0 ? ' some' : ''}">
<strong>${count}</strong> ${label}${captures ? ` <small>${captures}</small>` : ''}
</div>`;

const meta = [
  ['Before', options['base-label']],
  ['After', options['head-label']],
  ['Stories', options.stories || 'all'],
  ['Themes', options.themes || 'all'],
  ['Generated', new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'],
]
  .map(([term, value]) => `<dt>${term}</dt><dd>${esc(value)}</dd>`)
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Visual diff</title>
<style>
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --fg: #1a1d23;
  --muted: #576070;
  --line: #d6dbe2;
  --card: #f4f6f8;
  --accent: #1d4ed8;
  --changed: #9a3412;
  --changed-bg: #fff1e6;
  --ok: #166534;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1115;
    --fg: #e6e8ec;
    --muted: #9aa3b2;
    --line: #2b313c;
    --card: #181b22;
    --accent: #8ab4ff;
    --changed: #fdba74;
    --changed-bg: #2a1d12;
    --ok: #86efac;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 24px 16px 64px;
  background: var(--bg);
  color: var(--fg);
  font: 15px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
main, header, nav { max-width: 1500px; margin: 0 auto; }
a { color: var(--accent); }
code { font: 0.95em ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
h1 { margin: 0 0 12px; font-size: 24px; }
h2 { margin: 0 0 12px; font-size: 18px; }
h3 { margin: 0 0 6px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
.muted, small { color: var(--muted); }
dl.meta { display: grid; grid-template-columns: max-content 1fr; gap: 2px 16px; margin: 0 0 16px; }
dl.meta dt { color: var(--muted); }
dl.meta dd { margin: 0; overflow-wrap: anywhere; }
.summary { display: flex; flex-wrap: wrap; gap: 12px; margin: 0 0 8px; }
.stat { padding: 8px 16px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); }
.stat strong { font-size: 22px; }
.stat.some { border-color: var(--changed); background: var(--changed-bg); color: var(--changed); }
.verdict { margin: 8px 0 0; font-weight: 600; }
.verdict.clean { color: var(--ok); }
.hint { margin: 16px 0 0; color: var(--muted); }
nav { margin-top: 24px; }
nav ul { columns: 3 320px; margin: 8px 0 0; padding-left: 20px; }
.story { margin-top: 32px; padding: 16px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
.theme + .theme { margin-top: 16px; }
.trio { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
figure { margin: 0; min-width: 0; }
figcaption { margin-bottom: 4px; font-size: 13px; font-weight: 600; }
figure img {
  display: block;
  width: 100%;
  max-height: 340px;
  object-fit: contain;
  object-position: left top;
  border: 1px solid var(--line);
  background: var(--bg);
}
figure.nodiff p { margin: 0; padding: 12px; border: 1px dashed var(--line); color: var(--muted); }
details { margin-top: 16px; }
summary { cursor: pointer; }
.lists h2 { margin-top: 32px; }
@media (max-width: 760px) {
  .trio { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<header>
<h1>Visual diff</h1>
<dl class="meta">
${meta}
</dl>
<div class="summary">
${stat(changed.size, 'changed', `${countCaptures(changed)} captures`)}
${stat(appeared.size, 'appeared')}
${stat(disappeared.size, 'disappeared')}
</div>
<p class="muted">${identical} ${identical === 1 ? 'story' : 'stories'} compared and identical, not shown.</p>
${nothing ? '<p class="verdict clean">No visual change.</p>' : ''}
<p class="hint">Click an image to open it full size. In a diff, red marks the pixels that changed. Check that every change is one you meant to make.</p>
${problems.join('\n')}
</header>
${
  changed.size > 0
    ? `<nav>
<strong>Changed stories</strong>
<ul>
${sortedIds(changed)
  .map((id) => `<li><a href="${esc(`#story-${id}`)}"><code>${esc(id)}</code></a></li>`)
  .join('\n')}
</ul>
</nav>`
    : ''
}
<main>
${sortedIds(changed).map(storySection).join('\n')}
<div class="lists">
<h2>Appeared (${appeared.size})</h2>
${storyList(appeared, headDir)}
<h2>Disappeared (${disappeared.size})</h2>
${storyList(disappeared, baseDir)}
</div>
</main>
</body>
</html>
`;

writeFileSync(path.join(dir, 'index.html'), html);
console.log(
  `${changed.size} stories changed (${countCaptures(changed)} captures), ` +
    `${appeared.size} appeared, ${disappeared.size} disappeared, ${identical} identical`
);
