import { test, expect } from '@playwright/test';

// Each appearance menu of the toolbar names itself in its button
// ("Accent: Teal", not just "Teal") and drives <html> in the preview.
const MENUS = [
  {
    description: 'Color theme',
    label: 'Theme:',
    pick: 'Theme: Sand',
    check: (html: Element) => html.classList.contains('sand') && !html.classList.contains('dark'),
  },
  {
    description: 'Accent color',
    label: 'Accent:',
    pick: 'Accent: Teal',
    check: (html: Element) => html.getAttribute('data-accent') === 'teal',
  },
  {
    description: 'Font family',
    label: 'Font:',
    pick: 'Font: Inter',
    check: (html: Element) => html.getAttribute('data-font') === 'inter',
  },
  {
    description: 'Text size',
    label: 'Size:',
    pick: 'Size: Large',
    check: (html: Element) => html.getAttribute('data-text-size') === 'lg',
  },
];

for (const menu of MENUS) {
  test(`${menu.label} menu names itself and updates the preview`, async ({ page }) => {
    await page.goto('/?path=/story/welcome--default');
    const frame = page.frameLocator('iframe#storybook-preview-iframe');
    await expect(frame.locator('#storybook-root')).not.toBeEmpty({ timeout: 20_000 });

    // The button's accessible name is "<description> <selected title>".
    const button = page.getByRole('button', { name: new RegExp(`^${menu.description} `) });
    await expect(button).toContainText(menu.label);
    await button.click();
    await page.getByText(menu.pick, { exact: true }).click();
    await expect(button).toContainText(menu.pick);

    await expect
      .poll(() => frame.locator('html').evaluate(menu.check), { timeout: 10_000 })
      .toBe(true);
  });
}

// The theme decorator swaps classes like addon-themes did: only the selected
// theme's class is on <html>.
test('the default theme puts only `dark` on <html>', async ({ page }) => {
  await page.goto('/iframe.html?viewMode=story&id=welcome--default');
  await expect(page.locator('#storybook-root')).not.toBeEmpty({ timeout: 20_000 });
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.locator('html')).not.toHaveClass(/\b(sand|deep-blue)\b/);
});
