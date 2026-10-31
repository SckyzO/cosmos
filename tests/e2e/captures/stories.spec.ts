import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import {
  installCaptureEnvironment,
  matches,
  openStory,
  readIndex,
  readThemes,
  settledScreenshot,
} from './capture-lib';

// Visual review: one PNG per story and theme, in screenshots/<theme>/<story-id>.png.
// The stories come from Storybook's own index and the themes from its Theme
// toolbar, so neither list can go stale. Test-only stories (tagged `!dev`, so
// hidden from the sidebar) and stories tagged `no-capture`, whose picture
// depends on how long they have been running, are skipped. Narrow a run with
// id substrings:
//   STORIES=overlays- THEMES=dark make screenshots
//
// `make visual-diff` runs this same spec twice, once per Storybook build, with
// two more variables: CAPTURE_OUT, the folder under the repo root that replaces
// `screenshots` (screenshots/base, screenshots/head), and CAPTURE_ALLOW_EMPTY,
// which turns "no story matches" into an empty run: a component can exist on
// one side only.

// The captures go under the repo root (the spec runs from tests/e2e).
const outDir = path.posix.join('../..', process.env.CAPTURE_OUT ?? 'screenshots');

test('capture stories', async ({ context, page, baseURL }) => {
  test.setTimeout(0);
  // Each step still gets a bound: a stuck page is reported, not waited on forever.
  context.setDefaultTimeout(30_000);
  await installCaptureEnvironment(context, baseURL ?? '');

  const ids = (await readIndex(page))
    .filter(
      (e) =>
        e.tags?.includes('dev') &&
        !e.tags.includes('no-capture') &&
        matches(e.id, process.env.STORIES)
    )
    .map((e) => e.id);
  if (ids.length === 0) {
    if (process.env.CAPTURE_ALLOW_EMPTY) {
      console.warn(`No story id matches STORIES=${process.env.STORIES}: nothing to capture`);
      return;
    }
    throw new Error(`No story id matches STORIES=${process.env.STORIES}`);
  }

  // Any story will do to read the Theme toolbar of the preview.
  const allThemes = await readThemes(page, ids[0]);
  const themes = allThemes.filter((t) => matches(t, process.env.THEMES));
  for (const theme of themes) mkdirSync(`${outDir}/${theme}`, { recursive: true });

  // A few pages work through the queue side by side: ~1,100 stories × 4 themes.
  const queue = themes.flatMap((theme) => ids.map((id) => ({ id, theme })));
  const workers = Number(process.env.CAPTURE_PAGES ?? 4);
  const extra = await Promise.all(Array.from({ length: workers - 1 }, () => context.newPage()));
  // A story that ends in the wrong theme, or never stops moving, is still
  // captured, so the review shows it; one that can't be captured at all is
  // skipped. All are listed at the end.
  const problems: string[] = [];
  await Promise.all(
    [page, ...extra].map(async (p) => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const name = `${job.theme}/${job.id}`;
        try {
          if (!(await openStory(p, job.id, job.theme, allThemes))) {
            problems.push(`${name}: not in its theme`);
          }
          const { frame, stable } = await settledScreenshot(p);
          writeFileSync(`${outDir}/${name}.png`, frame);
          if (!stable) problems.push(`${name}: not stable`);
        } catch (error) {
          problems.push(`${name}: ${(error as Error).message.split('\n')[0]}`);
        }
      }
    })
  );
  if (problems.length > 0) {
    writeFileSync(`${outDir}/problems.txt`, `${problems.sort().join('\n')}\n`);
    console.warn(`${problems.length} captures with a problem: ${outDir}/problems.txt`);
  }
});
