import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import { auditPage, watchConsole, type Finding } from './audit-checks';
import { CHECK_WIDTHS, groupOf, nearestCheckWidth, planCaptures } from './audit-plan';
import {
  installCaptureEnvironment,
  matches,
  openStory,
  pinnedWidth,
  readIndex,
  readThemes,
  settledScreenshot,
} from './capture-lib';

// The captures and checks of the visual audit (#494), run by
// `make audit-captures` against a Storybook build; the script gives the
// variables and builds the contact sheets afterwards.
//
// Pass 1 opens every visible story at 375, 768, 1280 and 1440px in light and
// runs the page checks (audit-checks.ts). Pass 2 captures what audit-plan.ts
// plans, among it the stories pass 1 flagged. Writes under AUDIT_OUT:
//   checks.json    the stories and, per story and width, the findings
//   captures.json  every capture written
//   <width>/<theme>/<story-id>.png, problems.txt
// Test-only stories (tagged `!dev`) are out; so are, for the captures only,
// the stories tagged `no-capture`.
//
//   STORIES          story id substrings; only those stories
//   THEMES           themes put side by side (default: every theme)
//   MOBILE_STORIES   id substrings captured at 375 and 768px
//   DESKTOP_STORIES  id substrings captured at 1440px
//   CAPTURE_PAGES    pages working side by side (default 4)
const outDir = path.posix.join('../..', process.env.AUDIT_OUT ?? 'screenshots/audit');
const HEIGHT = 800;

// Console messages are width-independent and have nothing to look at: they do
// not make a story worth capturing again at the width where they showed.
const worthCapturing = (finding: Finding) => finding.rule !== 'console';

test('audit stories', async ({ context, page, baseURL }) => {
  test.setTimeout(0);
  context.setDefaultTimeout(30_000);
  await installCaptureEnvironment(context, baseURL ?? '');

  const stories = (await readIndex(page)).filter(
    (e) => e.tags?.includes('dev') && matches(e.id, process.env.STORIES)
  );
  if (stories.length === 0) throw new Error(`No story id matches STORIES=${process.env.STORIES}`);
  const allThemes = await readThemes(page, stories[0].id);
  const themes = allThemes.filter((t) => matches(t, process.env.THEMES));

  const workers = Number(process.env.CAPTURE_PAGES ?? 4);
  const pages = [
    page,
    ...(await Promise.all(Array.from({ length: workers - 1 }, () => context.newPage()))),
  ];
  const problems: string[] = [];
  const work = async <T>(queue: T[], job: (p: (typeof pages)[number], item: T) => Promise<void>) =>
    Promise.all(
      pages.map(async (p) => {
        for (let item = queue.shift(); item; item = queue.shift()) await job(p, item);
      })
    );

  // ── pass 1: the checks ────────────────────────────────────────────────────
  const found = new Map<string, Record<number, Finding[]>>();
  for (const story of stories) found.set(story.id, {});
  // A story that pins a viewport is checked at the width nearest to it only.
  const pinned = new Map<string, number>();
  const queue = stories.flatMap((s) => CHECK_WIDTHS.map((width) => ({ id: s.id, width })));
  let total = queue.length;
  let started = Date.now();
  let done = 0;
  const progress = (pass: string) => {
    done++;
    if (done % 200 === 0 || done === total) {
      const seconds = Math.round((Date.now() - started) / 1000);
      console.log(`${pass}: ${done}/${total} in ${seconds}s`);
    }
  };
  const watchers = new Map(pages.map((p) => [p, watchConsole(p)]));
  // A chart that animates in measures differently from one at rest.
  await Promise.all(pages.map((p) => p.emulateMedia({ reducedMotion: 'reduce' })));
  await work(queue, async (p, { id, width }) => {
    const watcher = watchers.get(p)!;
    try {
      await p.setViewportSize({ width, height: HEIGHT });
      watcher.findings();
      await openStory(p, id, 'light', allThemes);
      const pin = await pinnedWidth(p);
      if (pin !== undefined && nearestCheckWidth(pin) !== width) {
        pinned.set(id, nearestCheckWidth(pin));
        watcher.findings();
        return;
      }
      if (pin !== undefined) pinned.set(id, width);
      // A play function that fails here (a story run at a width it does not pin, which the
      // story tests give its own viewport) logs its error from Storybook's
      // preview: that is the width we forced, not a defect of the story.
      const logged = watcher
        .findings()
        .filter(
          (f) => !(f.detail.startsWith('error:') && /\/assets\/iframe-[\w-]+\.js$/.test(f.target))
        );
      found.get(id)![width] = [...(await auditPage(p)), ...logged];
    } catch (error) {
      problems.push(`checks ${width}/${id}: ${(error as Error).message.split('\n')[0]}`);
    } finally {
      progress('checks');
    }
  });
  await Promise.all(pages.map((p) => p.emulateMedia({ reducedMotion: null })));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    `${outDir}/checks.json`,
    JSON.stringify(
      {
        widths: CHECK_WIDTHS,
        stories: stories.map((s) => ({
          id: s.id,
          title: s.title,
          group: groupOf(s.title),
          widths: found.get(s.id),
        })),
      },
      null,
      1
    )
  );

  // ── pass 2: the captures ──────────────────────────────────────────────────
  const flagged = new Map<string, number[]>();
  for (const [id, byWidth] of found) {
    const widths = Object.entries(byWidth)
      .filter(([, list]) => list.some(worthCapturing))
      .map(([width]) => Number(width));
    if (widths.length > 0) flagged.set(id, widths);
  }
  const capturable = stories.filter((s) => !s.tags?.includes('no-capture'));
  const plan = planCaptures(capturable, flagged, {
    mobile: process.env.MOBILE_STORIES ?? '',
    desktop: process.env.DESKTOP_STORIES ?? '',
    themes,
    pinned,
  });
  const titleOf = new Map(stories.map((s) => [s.id, s.title]));
  const captures: { id: string; title: string; width: number; theme: string; flagged: boolean }[] =
    [];
  total = plan.length;
  done = 0;
  started = Date.now();
  await work([...plan], async (p, { id, width, theme }) => {
    const name = `${width}/${theme}/${id}`;
    try {
      await p.setViewportSize({ width, height: 720 });
      if (!(await openStory(p, id, theme, allThemes))) problems.push(`${name}: not in its theme`);
      const { frame, stable } = await settledScreenshot(p);
      mkdirSync(`${outDir}/${width}/${theme}`, { recursive: true });
      writeFileSync(`${outDir}/${name}.png`, frame);
      if (!stable) problems.push(`${name}: not stable`);
      captures.push({
        id,
        title: titleOf.get(id) ?? '',
        width,
        theme,
        flagged: flagged.get(id)?.includes(width) ?? false,
      });
    } catch (error) {
      problems.push(`${name}: ${(error as Error).message.split('\n')[0]}`);
    } finally {
      progress('captures');
    }
  });
  const order = new Map(stories.map((s, i) => [s.id, i]));
  captures.sort((a, b) => order.get(a.id)! - order.get(b.id)! || a.width - b.width);
  writeFileSync(`${outDir}/captures.json`, JSON.stringify(captures, null, 1));
  if (problems.length > 0) {
    writeFileSync(`${outDir}/problems.txt`, `${problems.sort().join('\n')}\n`);
    console.warn(`${problems.length} problems: ${outDir}/problems.txt`);
  }
  console.log(
    `${stories.length} stories checked at ${CHECK_WIDTHS.join(', ')}px, ${captures.length} captures`
  );
});
