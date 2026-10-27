import { test, expect } from '@playwright/test';

// The theme's `rtl:` variant in the built CSS. Tailwind's build lowers `:dir(rtl)` to a list of
// `:lang()` for its browser targets, so a variant written with `:dir()` alone never matches a
// page that sets `dir` without one of those languages; the dev server skips that step and
// matches. In CI this spec runs against the static build. The story renders RowActionButton in
// a `dir="ltr"` box and a `dir="rtl"` box, and its chevron carries `rtl:-scale-x-100`.
const STORY = 'actions-row-action-button--chevron-follows-the-reading-direction';

for (const direction of ['ltr', 'rtl'] as const) {
  test(`rtl: follows the nearest dir in the built CSS, with ${direction} on <html>`, async ({
    page,
  }) => {
    await page.goto(`/iframe.html?viewMode=story&id=${STORY}&globals=direction:${direction}`);
    const scale = (box: 'ltr' | 'rtl') =>
      page.locator(`[data-direction="${box}"] svg`).evaluate((svg) => getComputedStyle(svg).scale);
    await expect(page.locator('[data-direction="rtl"] svg')).toBeVisible({ timeout: 20_000 });
    expect(await page.locator('html').getAttribute('dir')).toBe(direction === 'rtl' ? 'rtl' : null);
    expect(await scale('rtl')).toBe('-1 1');
    // Under a right-to-left <html>, the left-to-right box is an island and stays as it is.
    expect(await scale('ltr')).toBe('none');
  });
}
