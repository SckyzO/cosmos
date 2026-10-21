import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Checks on the Storybook dev server's config, not on a running server. The
// dev server serves the repo's files and writes story files back (saving
// controls from the UI), so only the developer's own machine and browser may
// reach it.

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('dev server listens on every interface of its container', () => {
  // Storybook 10.6 listens on 127.0.0.1 by default: inside a container, that
  // leaves out both the host's port forward and Playwright on the compose
  // network.
  const { scripts } = JSON.parse(read('apps/storybook/package.json')) as {
    scripts: Record<string, string>;
  };
  expect(scripts.dev).toMatch(/--host 0\.0\.0\.0\b/);
});
