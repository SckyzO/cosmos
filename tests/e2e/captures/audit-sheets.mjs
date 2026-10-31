// The reports and contact sheets of `make audit-captures`, from what
// audit.spec.ts wrote:
//
//   node audit-sheets.mjs <dir> [--dry-run]
//
// Reads <dir>/checks.json and <dir>/captures.json and writes
//   <dir>/checks.md            the findings of the page checks, by Storybook group
//   <dir>/sheets/<set>/<group>-<n>.jpg   contact sheets, built with ImageMagick
//   <dir>/sheets/index.md      every sheet and the stories on it
// A sheet is a grid of tiles, one per capture, labelled with the story id; a
// capture taller than the tile is cut from the top, and says so in its label.
// Sheets are about 2000px wide, so one image can be read without zooming:
//   <width>/        the stories at that width, in light, one set of sheets per group
//   themes/         one story per component in each theme, one row per component
// --dry-run writes the two Markdown files and not the sheets (ImageMagick not needed).
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

// Tile width, columns and rows per sheet, and the height a capture is cut to
// (in pixels of the capture, before it is scaled to the tile).
export const LAYOUT = {
  375: { cols: 5, rows: 3, tile: 375, crop: 1100 },
  768: { cols: 4, rows: 4, tile: 480, crop: 1152 },
  1280: { cols: 3, rows: 4, tile: 640, crop: 1440 },
  1440: { cols: 3, rows: 4, tile: 640, crop: 1620 },
  themes: { cols: 4, rows: 6, tile: 480, crop: 1100 },
};
const THEME_ORDER = ['light', 'sand', 'dark', 'deep-blue'];
const GROUP_PER_FILE = (group) => group.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const chunk = (list, size) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) =>
    list.slice(i * size, (i + 1) * size)
  );

const groupOf = (title) => title.split('/')[0];

/** The sheets to build: [{ set, group, number, count, tiles: [{ id, theme, file, label }] }]. */
export const planSheets = (captures, groups) => {
  const sheets = [];
  const add = (set, group, rows, size) => {
    const pages = chunk(rows, size);
    pages.forEach((tiles, i) =>
      sheets.push({ set, group, number: i + 1, count: pages.length, tiles: tiles.flat() })
    );
  };
  for (const width of [375, 768, 1280, 1440]) {
    const { cols, rows } = LAYOUT[width];
    for (const group of groups) {
      const tiles = captures
        .filter((c) => c.width === width && c.theme === 'light' && groupOf(c.title) === group)
        .map((c) => ({
          id: c.id,
          theme: 'light',
          flagged: c.flagged,
          file: `${width}/light/${c.id}.png`,
          label: c.id,
        }));
      add(
        String(width),
        group,
        tiles.map((t) => [t]),
        cols * rows
      );
    }
  }
  // Themes side by side: a row per component, its first story in each theme.
  for (const group of groups) {
    const byComponent = new Map();
    for (const c of captures.filter((c) => c.width === 1280 && groupOf(c.title) === group)) {
      const row = byComponent.get(c.title) ?? new Map();
      if (!row.has(c.theme)) row.set(c.theme, c);
      byComponent.set(c.title, row);
    }
    const rows = [...byComponent.values()]
      .filter((row) => row.size > 1)
      .map((row) =>
        [...row.values()]
          .sort((a, b) => THEME_ORDER.indexOf(a.theme) - THEME_ORDER.indexOf(b.theme))
          .map((c) => ({
            id: c.id,
            theme: c.theme,
            flagged: false,
            file: `1280/${c.theme}/${c.id}.png`,
            label: `${c.id} (${c.theme})`,
          }))
      );
    add('themes', group, rows, LAYOUT.themes.rows);
  }
  return sheets;
};

const sheetName = (s) => `${s.set}/${GROUP_PER_FILE(s.group)}-${s.number}.jpg`;
const sheetTitle = (s) =>
  `${s.group} - ${s.set === 'themes' ? 'themes side by side, 1280px' : `${s.set}px, light`} - sheet ${s.number}/${s.count}`;

export const renderIndex = (sheets) => {
  const lines = [
    '# Contact sheets',
    '',
    'One sheet per group and set. `*` marks a story the page checks flagged at that width.',
    '',
  ];
  let set = '';
  for (const s of sheets) {
    if (s.set !== set) {
      set = s.set;
      lines.push(`## ${set === 'themes' ? 'Themes side by side (1280px)' : `${set}px, light`}`, '');
    }
    const ids = [...new Set(s.tiles.map((t) => `${t.id}${t.flagged ? '*' : ''}`))];
    lines.push(
      `- [${sheetName(s)}](${path.posix.join('sheets', sheetName(s))}): ${s.group} ${s.number}/${s.count}: ${ids.map((id) => `\`${id}\``).join(', ')}`
    );
  }
  return `${lines.join('\n')}\n`;
};

const SHOWN_PER_RULE = 5;
const RULE_TEXT = {
  'sideways-scroll': 'page scrolls sideways',
  'text-cut-off': 'text cut off or running out of its box',
  'text-overlap': 'text overlapping text',
  squeezed: 'icon or column squeezed',
  'small-target': 'touch target under 24x24px',
  console: 'console error or warning',
};

export const renderChecks = (checks, meta = {}) => {
  const widths = checks.widths;
  const rules = Object.keys(RULE_TEXT);
  const withFindings = checks.stories.filter((s) =>
    Object.values(s.widths ?? {}).some((list) => list.length > 0)
  );
  const lines = ['# Page checks', ''];
  if (meta.cosmosCommit) lines.push(`Commit ${meta.cosmosCommit}.`, '');
  lines.push(
    `${checks.stories.length} stories at ${widths.join(', ')}px, in light: ${withFindings.length} with at least one finding.`,
    '',
    '## Findings per rule',
    '',
    `| Rule | ${widths.map((w) => `${w}px`).join(' | ')} | Stories |`,
    `| --- | ${widths.map(() => '---:').join(' | ')} | ---: |`
  );
  for (const rule of rules) {
    const per = widths.map((w) =>
      checks.stories.reduce(
        (n, s) => n + (s.widths?.[w] ?? []).filter((f) => f.rule === rule).length,
        0
      )
    );
    const stories = checks.stories.filter((s) =>
      Object.values(s.widths ?? {}).some((list) => list.some((f) => f.rule === rule))
    ).length;
    lines.push(`| ${RULE_TEXT[rule]} (\`${rule}\`) | ${per.join(' | ')} | ${stories} |`);
  }
  lines.push('');
  const groups = [...new Set(checks.stories.map((s) => s.group))];
  for (const group of groups) {
    const here = withFindings.filter((s) => s.group === group);
    const total = checks.stories.filter((s) => s.group === group).length;
    lines.push(`## ${group}: ${here.length} of ${total} stories`, '');
    for (const story of here) {
      lines.push(`### \`${story.id}\``, '');
      // The same message at every width is one line.
      const rows = new Map();
      for (const w of widths) {
        for (const f of story.widths?.[w] ?? []) {
          const key = `${f.rule}|${f.detail}|${f.target}`;
          const row = rows.get(key) ?? { f, widths: [] };
          row.widths.push(w);
          rows.set(key, row);
        }
      }
      for (const rule of rules) {
        const list = [...rows.values()].filter((r) => r.f.rule === rule);
        for (const r of list.slice(0, SHOWN_PER_RULE)) {
          lines.push(`- ${r.widths.join(', ')}px, \`${rule}\`: ${r.f.detail} (${r.f.target})`);
        }
        if (list.length > SHOWN_PER_RULE) {
          lines.push(`- \`${rule}\`: and ${list.length - SHOWN_PER_RULE} more, in checks.json`);
        }
      }
      lines.push('');
    }
  }
  return `${lines.join('\n')}\n`;
};

const quote = (text) => text.replaceAll('%', '%%');

const pool = async (items, size, job) => {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (let item = queue.shift(); item; item = queue.shift()) await job(item);
    })
  );
};

/** One tile: the top of the capture, scaled to the tile's width. */
const makeTile = async (dir, tmp, tile, layout, n) => {
  const source = path.join(dir, tile.file);
  const { stdout } = await run('identify', ['-format', '%h', `${source}[0]`]);
  const height = Number(stdout);
  const cut = height > layout.crop;
  const out = path.join(tmp, `${n}.png`);
  await run('convert', [
    source,
    '-crop',
    `x${layout.crop}+0+0`,
    '+repage',
    '-resize',
    `${layout.tile}x`,
    out,
  ]);
  return {
    out,
    label: quote(cut ? `${tile.label} [top ${layout.crop} of ${height}px]` : tile.label),
  };
};

const buildSheet = async (dir, sheet) => {
  const layout = LAYOUT[sheet.set];
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'audit-sheet-'));
  try {
    const made = new Array(sheet.tiles.length);
    await pool(
      sheet.tiles.map((tile, n) => ({ tile, n })),
      os.cpus().length,
      async ({ tile, n }) => {
        made[n] = await makeTile(dir, tmp, tile, layout, n);
      }
    );
    const target = path.join(dir, 'sheets', sheetName(sheet));
    mkdirSync(path.dirname(target), { recursive: true });
    await run('montage', [
      '-font',
      'Liberation-Sans',
      '-pointsize',
      '15',
      '-background',
      '#d1d5db',
      '-fill',
      '#111827',
      '-gravity',
      'North',
      '-title',
      quote(sheetTitle(sheet)),
      ...made.flatMap((m) => ['-label', m.label, m.out]),
      '-tile',
      `${layout.cols}x`,
      '-geometry',
      '+8+8',
      '-quality',
      '85',
      target,
    ]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
};

const main = async () => {
  const [dir, flag] = process.argv.slice(2);
  if (!dir || (flag && flag !== '--dry-run')) {
    console.error('usage: node audit-sheets.mjs <dir> [--dry-run]');
    process.exit(2);
  }
  const read = (name) => JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
  const checks = read('checks.json');
  const captures = read('captures.json');
  let meta = {};
  try {
    meta = read('meta.json');
  } catch {
    // a run of the sheets alone has no meta.json: the report names no commit
  }
  writeFileSync(path.join(dir, 'checks.md'), renderChecks(checks, meta));
  const groups = [...new Set(checks.stories.map((s) => s.group))];
  const sheets = planSheets(captures, groups);
  mkdirSync(path.join(dir, 'sheets'), { recursive: true });
  writeFileSync(path.join(dir, 'sheets', 'index.md'), renderIndex(sheets));
  if (meta.cosmosCommit) {
    const findings = {};
    for (const story of checks.stories) {
      for (const list of Object.values(story.widths ?? {})) {
        for (const f of list) findings[f.rule] = (findings[f.rule] ?? 0) + 1;
      }
    }
    const summary = {
      stories: checks.stories.length,
      captures: captures.length,
      sheets: sheets.length,
      findings,
    };
    writeFileSync(
      path.join(dir, 'meta.json'),
      `${JSON.stringify({ ...meta, ...summary }, null, 2)}\n`
    );
  }
  if (flag !== '--dry-run') {
    let done = 0;
    for (const sheet of sheets) {
      await buildSheet(dir, sheet);
      done++;
      if (done % 20 === 0) console.log(`${done}/${sheets.length} sheets`);
    }
  }
  console.log(`${sheets.length} sheets${flag ? ' planned' : ''}, checks.md written`);
};

if (import.meta.url === `file://${process.argv[1]}`) await main();
