import type { BrowserContext, Page } from '@playwright/test';

// What the story captures and the audit share: the same day and "random" data,
// the same cut network, the same way to open a story and wait for it. No
// setting is read from the environment here: the specs do that.

export type IndexEntry = {
  id: string;
  title: string;
  type: 'story' | 'docs';
  tags?: string[];
};

// Storybook's preview object. Not a public API: the capture stops with a clear
// error if it moves.
export type Preview = {
  currentRender?: {
    phase?: string;
    story?: {
      storyGlobals?: { viewport?: { value?: string } };
      parameters?: {
        viewport?: { options?: Record<string, { styles?: { width?: string } }> };
      };
    };
  };
  storyStoreValue?: {
    projectAnnotations?: {
      globalTypes?: { theme?: { toolbar?: { items?: { value: string }[] } } };
    };
  };
};

export const matches = (value: string, filter: string | undefined) =>
  !filter || filter.split(',').some((part) => value.includes(part.trim()));

// A story is captured once two viewport frames taken this far apart (ms) are
// identical, after at most this many frames.
const SETTLE_PAUSE = 100;
const SETTLE_FRAMES = 5;

/**
 * Same day and same "random" data on every run, so comparing two months shows
 * the stories that changed, not the calendar. Time still flows from there.
 * Nothing comes from the network but Storybook: a third-party frame (the
 * YouTube player of VideoEmbed) gets a plain gray page, and anything else from
 * another origin fails, the same way on every run.
 */
export const installCaptureEnvironment = async (context: BrowserContext, baseURL: string) => {
  await context.clock.install({ time: new Date('2026-01-15T10:00:00Z') });
  await context.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  });
  // A pattern, not a function: Playwright matches it without a round trip to
  // the test process, and Storybook's own requests are never intercepted (a
  // matcher function sees every request, which also turns off the cache).
  const storybook = new URL(baseURL).origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await context.route(new RegExp(`^(?!${storybook}(/|$))`), (route) =>
    route.request().resourceType() === 'document'
      ? route.fulfill({
          contentType: 'text/html',
          body: '<body style="margin:0;background:#9ca3af"></body>',
        })
      : route.abort()
  );
};

/** The stories of Storybook's index. */
export const readIndex = async (page: Page) => {
  const res = await page.request.get('/index.json');
  const { entries } = (await res.json()) as { entries: Record<string, IndexEntry> };
  return Object.values(entries).filter((e) => e.type === 'story');
};

/** The values of the Theme toolbar of the preview, read from any story. */
export const readThemes = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?viewMode=story&id=${id}`);
  await page.locator('body.sb-show-main, body.sb-show-errordisplay').waitFor();
  const themes = await page.evaluate(() => {
    const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: Preview })
      .__STORYBOOK_PREVIEW__;
    const items = preview?.storyStoreValue?.projectAnnotations?.globalTypes?.theme?.toolbar?.items;
    return (items ?? []).map((item) => item.value);
  });
  if (themes.length === 0) throw new Error('No Theme toolbar found in the Storybook preview');
  return themes;
};

/**
 * Opens a story in a theme and waits for its render to end. `sb-show-main` on
 * the body is too early: on a cold load it comes before the decorators have put
 * the theme class on `<html>`. Returns whether the page is in that theme.
 */
export const openStory = async (page: Page, id: string, theme: string, themes: string[]) => {
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

/**
 * Waits until two consecutive viewport frames are byte-identical, then takes
 * the full-page screenshot, once. The render phase ends before everything has
 * stopped moving (a carousel still scrolling, a chart redrawing, a panel
 * finishing its transition), so a single frame differs from one run to the
 * next. The frames only cover the viewport: a full-page frame of a tall story
 * costs several times as much, and what is still moving is almost always in
 * view. A page that never settles is captured anyway, flagged as not stable.
 */
export const settledScreenshot = async (page: Page) => {
  const shoot = () => page.screenshot({ animations: 'disabled' });
  let frame = await shoot();
  let stable = false;
  for (let n = 1; n < SETTLE_FRAMES && !stable; n++) {
    await page.waitForTimeout(SETTLE_PAUSE);
    const next = await shoot();
    stable = next.equals(frame);
    frame = next;
  }
  return { frame: await page.screenshot({ fullPage: true, animations: 'disabled' }), stable };
};

/**
 * The width a story pins with its viewport global (`globals: mobileViewport`),
 * in px, or undefined. Opened by URL the story gets the page's width, not that
 * viewport: Storybook's viewport menu sizes the frame from the manager.
 */
export const pinnedWidth = (page: Page) =>
  page.evaluate(() => {
    const story = (window as unknown as { __STORYBOOK_PREVIEW__?: Preview }).__STORYBOOK_PREVIEW__
      ?.currentRender?.story;
    const value = story?.storyGlobals?.viewport?.value;
    const width = value ? story?.parameters?.viewport?.options?.[value]?.styles?.width : undefined;
    return width ? parseFloat(width) : undefined;
  });
