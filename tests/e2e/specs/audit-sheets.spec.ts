import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';

// The report and the sheet plan of `make audit-captures`, on a made-up run
// (--dry-run: no image, no ImageMagick).

const script = new URL('../captures/audit-sheets.mjs', import.meta.url).pathname;
let dir: string;
test.beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'audit-sheets-'));
});
test.afterEach(() => rmSync(dir, { recursive: true, force: true }));

const finding = (rule: string, detail: string) => ({ rule, detail, target: 'div.card' });

const build = (captures: object[], stories: object[]) => {
  writeFileSync(
    path.join(dir, 'checks.json'),
    JSON.stringify({ widths: [375, 768, 1280, 1440], stories })
  );
  writeFileSync(path.join(dir, 'captures.json'), JSON.stringify(captures));
  execFileSync('node', [script, dir, '--dry-run']);
  return {
    checks: readFileSync(path.join(dir, 'checks.md'), 'utf8'),
    index: readFileSync(path.join(dir, 'sheets/index.md'), 'utf8'),
  };
};

const story = (n: number, widths = {}) => ({
  id: `forms-input--s${n}`,
  title: 'Forms/Input',
  group: 'Forms',
  widths,
});
const capture = (n: number, width = 1280, theme = 'light') => ({
  id: `forms-input--s${n}`,
  title: 'Forms/Input',
  width,
  theme,
  flagged: false,
});

test('the report groups findings by story and joins the widths of one finding', () => {
  const { checks } = build(
    [],
    [
      story(1, {
        375: [finding('sideways-scroll', 'the page is 500px wide')],
        768: [finding('sideways-scroll', 'the page is 500px wide')],
        1280: [],
        1440: [],
      }),
      story(2, { 375: [], 768: [], 1280: [], 1440: [] }),
    ]
  );
  expect(checks).toContain('## Forms: 1 of 2 stories');
  expect(checks).toContain('### `forms-input--s1`');
  expect(checks).toContain('- 375, 768px, `sideways-scroll`: the page is 500px wide (div.card)');
  expect(checks).not.toContain('forms-input--s2');
  expect(checks).toMatch(
    /\| page scrolls sideways \(`sideways-scroll`\) \| 1 \| 1 \| 0 \| 0 \| 1 \|/
  );
});

test('the report counts a finding repeated at one width once per width', () => {
  const cut = finding('text-cut-off', '"Oct 29" runs out of td');
  const { checks } = build(
    [],
    [story(1, { 375: [], 768: [cut, cut, cut], 1280: [cut], 1440: [] })]
  );
  expect(checks).toContain(
    '- 768, 1280px, `text-cut-off`: "Oct 29" runs out of td (div.card), 4 times'
  );
});

// tileBox runs on the output of ImageMagick, so it is called through node here.
const tileBox = (...args: unknown[]) =>
  JSON.parse(
    execFileSync('node', [
      '--input-type=module',
      '-e',
      `import { tileBox } from '${script}'; console.log(JSON.stringify(tileBox(...${JSON.stringify(args)})))`,
    ]).toString()
  );

test('a tile shows the content of a capture with a margin, not the empty page around it', () => {
  // A 300x40 button at 20,30 on a 1280x720 page.
  expect(tileBox('300x40+20+30', 1280, 720)).toEqual({ x: 0, y: 6, w: 344, h: 88 });
  // A page filled to its edges keeps its size.
  expect(tileBox('1280x720+0+0', 1280, 720)).toEqual({ x: 0, y: 0, w: 1280, h: 720 });
  // A blank page (ImageMagick gives a 1x1 box) or no box at all keeps the whole capture.
  expect(tileBox('1x1+0+0', 1280, 720)).toEqual({ x: 0, y: 0, w: 1280, h: 720 });
  expect(tileBox('', 1280, 720)).toEqual({ x: 0, y: 0, w: 1280, h: 720 });
});

test('the sheets hold twelve 1280px tiles each, in story order', () => {
  const stories = Array.from({ length: 14 }, (_, i) => story(i));
  const { index } = build(
    stories.map((_, i) => capture(i)),
    stories
  );
  expect(index).toContain('(sheets/1280/forms-1.jpg)');
  expect(index).toContain('Forms 1/2');
  expect(index).toContain('Forms 2/2');
  expect(index.match(/forms-input--s1[23]/g)).toHaveLength(2);
});

test('the themes sheet needs a component captured in more than one theme', () => {
  const { index } = build(
    [capture(1), capture(1, 1280, 'dark'), capture(1, 1280, 'sand'), capture(2)],
    [story(1), story(2)]
  );
  expect(index).toContain('## Themes side by side (1280px)');
  expect(index).toMatch(/themes\/forms-1\.jpg/);
});
