import { test } from '@playwright/test';

test.describe('Storybook smoke test', () => {
  // Smoke tests aim at `welcome--default` — the canonical first story,
  // pinned at the top of the sidebar by storySort. Updated from the
  // long-gone Phase 0 `phase-0-hello--default` story.
  test('Welcome story renders + capture console', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (msg) => messages.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));
    page.on('requestfailed', (req) =>
      messages.push(`[reqfail] ${req.url()} - ${req.failure()?.errorText}`)
    );

    await page.goto('/iframe.html?viewMode=story&id=welcome--default', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '../../screenshots/storybook-welcome.png', fullPage: true });

    console.log('--- BROWSER CONSOLE ---');
    messages.forEach((m) => console.log(m));
    console.log('--- END (' + messages.length + ' messages) ---');
  });

  test('Manager renders story canvas', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (msg) => messages.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));

    await page.goto('/?path=/story/welcome--default', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '../../screenshots/storybook-manager.png', fullPage: true });

    console.log('--- MANAGER CONSOLE ---');
    messages.forEach((m) => console.log(m));
    console.log('--- END (' + messages.length + ' messages) ---');
  });
});
