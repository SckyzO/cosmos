import { test, expect } from '@playwright/test';

// The viewport presets of preview.tsx are what the toolbar offers and what a
// story's `globals.viewport` picks. Storybook 10 reads them from
// `parameters.viewport.options`: under any other key the manager does not know
// them and shows a pinned story in its 320x568 fallback.
const frameWidth = async (page: import('@playwright/test').Page, id: string) => {
  await page.goto(`/?path=/story/${id}`);
  const frame = page.frameLocator('iframe#storybook-preview-iframe');
  await expect(frame.locator('#storybook-root')).not.toBeEmpty({ timeout: 20_000 });
  return page.locator('iframe#storybook-preview-iframe').evaluate((f) => f.clientWidth);
};

test.use({ viewport: { width: 1800, height: 1000 } });

test('a story pinned to Tailwind xl is shown 1280px wide', async ({ page }) => {
  expect(await frameWidth(page, 'examples-list--content')).toBe(1280);
});

test('a story pinned to the phone preset is shown 393px wide', async ({ page }) => {
  expect(await frameWidth(page, 'examples-list--phone')).toBe(393);
});
