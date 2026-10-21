import { test, expect } from '@playwright/test';

// Foundations/Fonts is a docs page with no stories (Fonts.mdx): no decorator
// runs on it, so the preview gets no theme class and no data-font.
const PAGE = '/iframe.html?viewMode=docs&id=foundations-fonts--docs';

// The families the page samples: the Font setting's fonts (but `system`,
// which loads nothing) and the mono font.
const FAMILIES = [
  'Outfit',
  'Inter Variable',
  'IBM Plex Sans Variable',
  'Montserrat Variable',
  'Open Sans Variable',
  'JetBrains Mono',
];

test('Fonts page loads every font it samples', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('[data-font-sample]')).toHaveCount(7, { timeout: 20_000 });

  // A sample in a font whose CSS the preview doesn't import would render in
  // the fallback font without any error: check the font files loaded.
  for (const family of FAMILIES) {
    await expect
      .poll(
        () =>
          page.evaluate(
            (name) =>
              [...document.fonts].some(
                (f) => f.family.replace(/["']/g, '') === name && f.status === 'loaded'
              ),
            family
          ),
        { message: `${family} loaded` }
      )
      .toBe(true);
  }
});
