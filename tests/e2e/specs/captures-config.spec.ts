import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Checks on the screenshot tooling, not on a capture run. `make screenshots`
// and `make visual-diff` run the captures in a container, which sees only the
// variables they pass with `-e`: one they leave out is silently ignored.

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

// Set by the scripts themselves, not by the person running the target.
const internal = new Set(['CAPTURE_OUT', 'CAPTURE_ALLOW_EMPTY']);

test('the screenshot targets pass every capture setting to their container', () => {
  const settings = new Set(
    ['tests/e2e/playwright.captures.config.ts', 'tests/e2e/captures/stories.spec.ts']
      .flatMap((file) => [...read(file).matchAll(/process\.env\.([A-Z_]+)/g)].map((m) => m[1]))
      .filter((name) => !internal.has(name))
  );
  const makefile = read('Makefile');
  const entryPoints = {
    'make screenshots': makefile.slice(makefile.indexOf('\nscreenshots:')).split('\n')[2],
    'make visual-diff': read('tests/e2e/captures/visual-review.sh'),
  };

  expect(settings.size, 'variables read by the captures').toBeGreaterThan(0);
  for (const [target, source] of Object.entries(entryPoints)) {
    for (const name of settings) {
      expect(source, `${target} passes ${name}`).toMatch(new RegExp(`-e "?${name}\\b`));
    }
  }
});
