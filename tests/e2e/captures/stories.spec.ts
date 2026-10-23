import { writeFileSync } from 'node:fs';
import { test, type Page } from '@playwright/test';

// Visual review: one PNG per story and theme, in screenshots/<theme>/<story-id>.png.
// The stories come from Storybook's own index and the themes from its Theme
// toolbar, so neither list can go stale. Test-only stories (tagged `!dev`, so
// hidden from the sidebar) are skipped. Narrow a run with id substrings:
//   STORIES=overlays- THEMES=dark make screenshots
type IndexEntry = { id: string; type: 'story' | 'docs'; tags?: string[] };

// Storybook's preview object. Not a public API: the capture stops with a clear
// error if it moves.
type Preview = {
  currentRender?: { phase?: string };
  storyStoreValue?: {
    projectAnnotations?: {
      globalTypes?: { theme?: { toolbar?: { items?: { value: string }[] } } };
    };
  };
};

const matches = (value: string, filter: string | undefined) =>
  !filter || filter.split(',').some((part) => value.includes(part.trim()));

/**
 * Opens a story in a theme and waits for its render to end. `sb-show-main` on
 * the body is too early: on a cold load it comes before the decorators have put
 * the theme class on `<html>`. Returns whether the page is in that theme.
 */
const openStory = async (page: Page, id: string, theme: string, themes: string[]) => {
  await page.goto(`/iframe.html?viewMode=story&id=${id}&globals=theme:${theme}`);
  // The story, its play function and the afterEach checks have run (or failed).
  await page.waitForFunction(() => {
    const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: Preview })
      .__STORYBOOK_PREVIEW__;
    const phase = preview?.currentRender?.phase ?? '';
    return ['completed', 'finished', 'errored', 'aborted'].includes(phase);
  });
  await page.evaluate(() => document.fonts.ready);
  // Light is the absence of a theme class.
  return page.evaluate(
    ([selected, all]) => {
      const classes = document.documentElement.classList;
      return all.every((t) =>
        t === selected ? t === 'light' || classes.contains(t) : !classes.contains(t)
      );
    },
    [theme, themes] as const
  );
};

test('capture stories', async ({ context, page }) => {
  test.setTimeout(0);
  // Each step still gets a bound: a stuck page is reported, not waited on forever.
  context.setDefaultTimeout(30_000);
  // Charts animate their first draw: capture the final state.
  await context.addInitScript(() => {
    (window as unknown as { Apex: object }).Apex = { chart: { animations: { enabled: false } } };
  });

  const res = await page.request.get('/index.json');
  const { entries } = (await res.json()) as { entries: Record<string, IndexEntry> };
  const ids = Object.values(entries)
    .filter(
      (e) => e.type === 'story' && e.tags?.includes('dev') && matches(e.id, process.env.STORIES)
    )
    .map((e) => e.id);
  if (ids.length === 0) throw new Error(`No story id matches STORIES=${process.env.STORIES}`);

  // Any story will do to read the Theme toolbar of the preview.
  await page.goto(`/iframe.html?viewMode=story&id=${ids[0]}`);
  await page.locator('body.sb-show-main, body.sb-show-errordisplay').waitFor();
  const allThemes = await page.evaluate(() => {
    const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: Preview })
      .__STORYBOOK_PREVIEW__;
    const items = preview?.storyStoreValue?.projectAnnotations?.globalTypes?.theme?.toolbar?.items;
    return (items ?? []).map((item) => item.value);
  });
  if (allThemes.length === 0) throw new Error('No Theme toolbar found in the Storybook preview');
  const themes = allThemes.filter((t) => matches(t, process.env.THEMES));

  // A few pages work through the queue side by side: ~1,100 stories × 4 themes.
  const queue = themes.flatMap((theme) => ids.map((id) => ({ id, theme })));
  const workers = Number(process.env.CAPTURE_PAGES ?? 4);
  const extra = await Promise.all(Array.from({ length: workers - 1 }, () => context.newPage()));
  // A story that ends in the wrong theme is still captured, so the review shows
  // it; one that can't be captured at all is skipped. Both are listed at the end.
  const problems: string[] = [];
  await Promise.all(
    [page, ...extra].map(async (p) => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const name = `${job.theme}/${job.id}`;
        try {
          if (!(await openStory(p, job.id, job.theme, allThemes))) {
            problems.push(`${name}: not in its theme`);
          }
          await p.screenshot({
            path: `../../screenshots/${name}.png`,
            fullPage: true,
            animations: 'disabled',
          });
        } catch (error) {
          problems.push(`${name}: ${(error as Error).message.split('\n')[0]}`);
        }
      }
    })
  );
  if (problems.length > 0) {
    writeFileSync('../../screenshots/problems.txt', `${problems.sort().join('\n')}\n`);
    console.warn(`${problems.length} captures with a problem: screenshots/problems.txt`);
  }
});
