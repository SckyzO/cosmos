import { test, expect } from '@playwright/test';

test.describe('Storybook smoke test', () => {
  // Smoke tests aim at `welcome--default` — the canonical first story,
  // pinned at the top of the sidebar by storySort. A story that throws on
  // render still "loads" a page, so both tests assert on rendered content and
  // the first one also fails on any uncaught page error.
  test('Welcome story renders without page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/iframe.html?viewMode=story&id=welcome--default');
    await expect(page.locator('#storybook-root')).not.toBeEmpty({ timeout: 20_000 });

    expect(errors).toEqual([]);
  });

  test('Manager renders story canvas', async ({ page }) => {
    await page.goto('/?path=/story/welcome--default');
    const frame = page.frameLocator('iframe#storybook-preview-iframe');
    await expect(frame.locator('#storybook-root')).not.toBeEmpty({ timeout: 20_000 });
  });
});
