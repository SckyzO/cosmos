import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
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

// A value the presets do not have falls back to the same 320x568 frame without a word, in the
// manager only: the story tests size the page from both keys and Storybook's defaults.
test('every viewport a story picks is one of the presets', () => {
  const root = path.resolve(import.meta.dirname, '../../..');
  const preview = readFileSync(path.join(root, 'apps/storybook/.storybook/preview.tsx'), 'utf8');
  const presets = new Set(
    [...preview.matchAll(/^\s+'?([\w-]+)'?: \{ name: /gm)].map((match) => match[1])
  );
  expect(presets.size).toBeGreaterThan(5);
  const files = ['packages/react/src', 'packages/charts/src', 'apps/storybook/stories'].flatMap(
    (dir) =>
      readdirSync(path.join(root, dir), { recursive: true, encoding: 'utf8' })
        .filter((file) => /\.(ts|tsx)$/.test(file))
        .map((file) => path.join(root, dir, file))
  );
  const unknown: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const picked = [
      ...[...text.matchAll(/viewport: \{ value: '([\w-]+)'/g)].map((match) => match[1]),
      // A helper that takes the preset as a typed parameter: `viewport: 'mobile' | 'tw-sm'`.
      ...[...text.matchAll(/viewport: ((?:'[\w-]+'(?: \| )?)+)/g)].flatMap((match) =>
        [...match[1].matchAll(/'([\w-]+)'/g)].map((value) => value[1])
      ),
    ];
    for (const value of picked)
      if (!presets.has(value)) unknown.push(`${path.relative(root, file)}: ${value}`);
  }
  expect(unknown).toEqual([]);
});
