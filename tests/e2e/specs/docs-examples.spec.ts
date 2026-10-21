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
