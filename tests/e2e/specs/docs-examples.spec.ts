import { test, expect, type Frame } from '@playwright/test';

// A docs page embeds each story in its own iframe, and the story's play
// function runs there too. An interaction test that closes its component
// (Accept on the cookie banner) then leaves a blank example on the docs page;
// such stories carry the `!autodocs` tag. Each case names a docs page and the
// role every example on it must still show once its story has finished.
const cases: Array<{ id: string; name: string; role: 'dialog' }> = [
  { id: 'feedback-cookie-banner--docs', name: 'Cookie Banner', role: 'dialog' },
];

// The preview reports this phase once render, play and afterEach are done.
const storyFinished = (frame: Frame) =>
  frame.waitForFunction(
    () =>
      (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
        .__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished'
  );

for (const c of cases) {
  test(`docs: every ${c.name} example still shows its ${c.role}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`/iframe.html?viewMode=docs&id=${c.id}`);
    const iframes = page.locator('.sbdocs-content iframe');
    await expect(iframes.first()).toBeAttached({ timeout: 20_000 });

    for (const iframe of await iframes.all()) {
      // Docs iframes load lazily: bring each one on screen first.
      await iframe.scrollIntoViewIfNeeded();
      const frame = await (await iframe.elementHandle())!.contentFrame();
      expect(frame).not.toBeNull();
      await frame!.waitForURL(/viewMode=story/);
      await storyFinished(frame!);
      const id = new URL(frame!.url()).searchParams.get('id');
      await expect(frame!.getByRole(c.role), `${id} renders no ${c.role}`).toBeVisible();
    }
  });
}

// A story that takes focus, from a play function that clicks or types or from
// an autoFocus field, makes the browser scroll the docs page to it: the page
// jumps down on its own while the reader is at the top. Listed: the docs pages
// that embed stories in iframes (portalDocsParams) and have play functions,
// plus OTP Input, whose autoFocus stories render inline. Interaction tests
// that take focus carry `!autodocs`; autoFocus focuses without scrolling.
const docsPagesTakingFocus = [
  'feedback-cookie-banner--docs',
  'forms-date-picker--docs',
  'forms-otp-input--docs',
  'media-carousel--docs',
  'overlays-command-palette--docs',
  'overlays-confirmation-modal--docs',
  'overlays-drawer--docs',
  'overlays-help-overlay--docs',
  'overlays-modal--docs',
  'overlays-notifications-panel--docs',
  'overlays-popover--docs',
  'overlays-user-menu--docs',
  'examples-auth-auth-layout--docs',
  'examples-auth-reset-password-form--docs',
  'examples-auth-sign-in-form--docs',
  'examples-auth-sign-up-form--docs',
  'examples-auth-social-auth-buttons--docs',
  'examples-auth-two-step-verification-form--docs',
  'settings-appearance-menu--docs',
];

for (const id of docsPagesTakingFocus) {
  test(`docs: ${id} stays at the top while its stories run`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`/iframe.html?viewMode=docs&id=${id}`);
    // Stories render either in iframes or inline; wait for the first of them.
    await expect(
      page.locator('.sbdocs-content').locator('iframe, [id^="story--"]').first()
    ).toBeAttached({ timeout: 20_000 });
    const iframes = page.locator('.sbdocs-content iframe');
    const count = await iframes.count();
    if (count > 0) {
      // The iframes load lazily, so how far down the page gets depends on
      // timing. Load them all at once, the worst case for a reader at the top.
      await iframes.evaluateAll((all) => all.forEach((f) => f.setAttribute('loading', 'eager')));
      await expect
        .poll(() => page.frames().filter((f) => f.url().includes('viewMode=story')).length, {
          timeout: 20_000,
        })
        .toBe(count);
      for (const frame of page.frames().filter((f) => f.url().includes('viewMode=story'))) {
        await storyFinished(frame);
      }
    } else {
      // Inline stories: once every one has rendered, their mount effects ran.
      await page.waitForFunction(() => {
        const roots = [...document.querySelectorAll('.sbdocs-content [id^="story--"]')];
        return roots.length > 0 && roots.every((r) => r.childElementCount > 0);
      });
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
}
