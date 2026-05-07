import { test } from '@playwright/test';

test.describe('Storybook smoke test', () => {
  test('Hello story renders + capture console', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (msg) => messages.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));
    page.on('requestfailed', (req) =>
      messages.push(`[reqfail] ${req.url()} - ${req.failure()?.errorText}`)
    );

    // Use viewMode=story for direct iframe access (otherwise story doesn't load)
    await page.goto('/iframe.html?viewMode=story&id=phase-0-hello--default', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '../../screenshots/storybook-hello.png', fullPage: true });

    console.log('--- BROWSER CONSOLE ---');
    messages.forEach((m) => console.log(m));
    console.log('--- END (' + messages.length + ' messages) ---');
  });

  test('Manager renders story canvas', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (msg) => messages.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));

    await page.goto('/?path=/story/phase-0-hello--default', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '../../screenshots/storybook-manager.png', fullPage: true });

    console.log('--- MANAGER CONSOLE ---');
    messages.forEach((m) => console.log(m));
    console.log('--- END (' + messages.length + ' messages) ---');
  });
});
