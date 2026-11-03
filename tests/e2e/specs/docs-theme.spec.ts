import { test, expect, type Frame, type Page } from '@playwright/test';

// A docs page whose stories render in an iframe of their own (`portalDocsParams`) stayed dark when
// another theme was picked: the frames start on the default theme and report it on the channel the
// page listens to for the toolbar's. The page now reads its own globals, and the frames take the
// page's theme (#612). The pages that do it today:
const pages = [
  'media-lightbox--docs',
  'overlays-drawer--docs',
  'overlays-modal--docs',
  'overlays-command-palette--docs',
];

// The preview reports this phase once render, play and afterEach are done.
const storyFinished = (frame: Frame) =>
  frame.waitForFunction(
    () =>
      (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
        .__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished'
  );

// Every iframe of the page, loaded and rendered: they load lazily, so ask for all of them at once.
// A change of the toolbar's globals renders the page again and the frames with it, so the frames
// are listed again each time.
const storyFrames = async (page: Page) => {
  const iframes = page.locator('.sbdocs-content iframe');
  await expect(iframes.first()).toBeAttached({ timeout: 20_000 });
  await iframes.evaluateAll((all) => all.forEach((f) => f.setAttribute('loading', 'eager')));
  const count = await iframes.count();
  await expect
    .poll(() => page.frames().filter((f) => f.url().includes('viewMode=story')).length, {
      timeout: 30_000,
    })
    .toBe(count);
  const frames = page.frames().filter((f) => f.url().includes('viewMode=story'));
  for (const frame of frames) await storyFinished(frame);
  return frames;
};

const themeClass = (frame: Frame) => frame.evaluate(() => document.documentElement.className);

/** The relative luminance of the page behind the docs text: near 1 on a light theme, near 0 on a dark one. */
const docsLuminance = (page: Page) =>
  page.locator('.sbdocs-wrapper').evaluate((wrapper) => {
    const [r, g, b] = getComputedStyle(wrapper)
      .backgroundColor.match(/\d+(?:\.\d+)?/g)!
      .slice(0, 3)
      .map((channel) => Number(channel) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  });

/** What the Theme menu of the toolbar sends the preview. */
const pickTheme = (page: Page, theme: string) =>
  page.evaluate(
    (id) =>
      (
        window as unknown as {
          __STORYBOOK_ADDONS_CHANNEL__: { emit: (event: string, payload: unknown) => void };
        }
      ).__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: { theme: id } }),
    theme
  );

for (const id of pages) {
  test(`docs: ${id} shows its frames and its page in the light theme`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`/iframe.html?viewMode=docs&id=${id}&globals=theme:light`);
    const frames = await storyFrames(page);

    expect(frames.length, 'story frames').toBeGreaterThan(0);
    for (const frame of frames) {
      expect(await themeClass(frame), frame.url()).not.toMatch(/\b(?:dark|deep-blue)\b/);
    }
    expect(await docsLuminance(page), 'the docs page is on a light background').toBeGreaterThan(
      0.8
    );
  });
}

test('docs: the frames of a page follow the theme picked after it loaded', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/iframe.html?viewMode=docs&id=media-lightbox--docs&globals=theme:light');
  const { length } = await storyFrames(page);

  for (const [theme, className] of [
    ['dark', 'dark'],
    ['sand', 'sand'],
    ['light', ''],
  ]) {
    await pickTheme(page, theme);
    // The page renders again, so its frames are new ones.
    await expect
      .poll(
        async () => {
          const frames = page.frames().filter((f) => f.url().includes('viewMode=story'));
          return Promise.all(frames.map((f) => themeClass(f).catch(() => 'loading')));
        },
        { timeout: 30_000, message: `every frame is on ${theme}` }
      )
      .toEqual(Array(length).fill(className));
    const luminance = await docsLuminance(page);
    if (theme === 'dark') expect(luminance, 'the docs page on dark').toBeLessThan(0.3);
    else expect(luminance, `the docs page on ${theme}`).toBeGreaterThan(0.8);
  }
});
