import { test, expect, type Page } from '@playwright/test';

// Reduced motion in the built CSS. The theme redefines Tailwind's `motion-safe:` and
// `motion-reduce:` so that they follow `data-motion="reduced"` on <html> as well as the device's
// `prefers-reduced-motion`, and the duration tokens read 0 under either. The story tests can
// emulate the attribute only; the media query needs a real browser context, which is this spec.
// In CI it runs against the static build.
const PULSING_DOT = 'status-health-dot--pulsing';
const REFRESHING = 'actions-refresh-button--refreshing';

const open = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?viewMode=story&id=${id}`);
  await expect(page.locator('#storybook-root')).not.toBeEmpty({ timeout: 20_000 });
};
const animationOf = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
// In ms: the built stylesheet is minified, which writes 200ms as .2s.
const baseDuration = (page: Page) =>
  page.evaluate(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--cosmos-motion-base')
      .trim();
    return Math.round(parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000));
  });

test('a decorative loop runs by default', async ({ page }) => {
  await open(page, PULSING_DOT);
  expect(await animationOf(page, '[class*="animate-ping"]')).toBe('ping');
  expect(await baseDuration(page)).toBe(200);
});

test('prefers-reduced-motion stops a decorative loop and zeroes the durations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, PULSING_DOT);
  expect(await animationOf(page, '[class*="animate-ping"]')).toBe('none');
  expect(await baseDuration(page)).toBe(0);
});

test('data-motion="reduced" does the same, whatever the device asks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page, PULSING_DOT);
  await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduced'));
  expect(await animationOf(page, '[class*="animate-ping"]')).toBe('none');
  expect(await baseDuration(page)).toBe(0);

  await page.evaluate(() => document.documentElement.removeAttribute('data-motion'));
  expect(await animationOf(page, '[class*="animate-ping"]')).toBe('ping');
  expect(await baseDuration(page)).toBe(200);
});

test('a spinner keeps turning under reduced motion: it says "in progress"', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, REFRESHING);
  expect(await animationOf(page, '.animate-spin')).toBe('spin');
  await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduced'));
  expect(await animationOf(page, '.animate-spin')).toBe('spin');
});
