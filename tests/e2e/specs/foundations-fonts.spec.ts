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

// The docs chrome read the toolbar theme from the page's first story, and fell
// back to the default (dark) on a page without one, whatever the toolbar said.
test('Fonts page follows the theme in the URL', async ({ page }) => {
  await page.goto(`${PAGE}&globals=theme:sand`);
  const title = page.locator('.sbdocs-content h1');
  await expect(title).toHaveText('Fonts', { timeout: 20_000 });
  // Sand's text color (#1e1711), from cosmos-theme.ts.
  await expect(title).toHaveCSS('color', 'rgb(30, 23, 17)');
});
