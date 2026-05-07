import { test } from '@playwright/test';

test('docs-error-page-dark', async ({ page }) => {
  await page.goto('/?path=/docs/pages-error-page--docs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '../../screenshots/docs-error-page-dark.png', fullPage: false });
});

test('docs-spinner-dark', async ({ page }) => {
  await page.goto('/?path=/docs/atoms-spinner--docs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '../../screenshots/docs-spinner-dark.png', fullPage: false });
});

test('docs-button-dark', async ({ page }) => {
  await page.goto('/?path=/docs/atoms-button--docs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '../../screenshots/docs-button-dark.png', fullPage: false });
});
