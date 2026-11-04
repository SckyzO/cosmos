import { test, expect, type Page } from '@playwright/test';

// Storybook 10 still sets `window.__STORYBOOK_STORY_STORE__`, a proxy that warns "Accessing the
// Story Store is deprecated" on any read. The Actions panel logs the arguments of a named mock by
// walking them, and an event that user-event dispatched carries `view` as an own property: the
// walk goes through `window` and reads the proxy, once per page. `preview.tsx` takes the alias away
// (`beforeAll`), and the components call their `() => void` props with no event. These stories
// click or type in a control that hands its event to a mock, or hit a prop that used to; the page
// must stay silent while the play function runs. In CI it runs against the static build.
const STORIES = [
  // The control's own event reaches the mock, by design.
  'atoms-button--click-fires-on-click',
  'forms-input--typing-fires-on-change',
  'forms-checkbox--click-toggles',
  'forms-radio--click-selects',
  'overlays-user-menu--item-click-fires-handler',
  // A `() => void` prop, which no longer gets the event.
  'feedback-error-state--with-retry-checks',
  'overlays-drawer--close-triggers',
];

// The preview reports this phase once render, play and afterEach are done.
const finished = (page: Page) =>
  page.waitForFunction(
    () =>
      (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
        .__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished',
    undefined,
    { timeout: 20_000 }
  );

for (const id of STORIES) {
  test(`${id} logs no Story Store deprecation`, async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (/Story Store/.test(message.text())) warnings.push(message.text());
    });
    await page.goto(`/iframe.html?viewMode=story&id=${id}`);
    await finished(page);
    expect(warnings).toEqual([]);
  });
}
