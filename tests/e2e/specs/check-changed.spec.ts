import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

// Checks on the story selection of `make check-changed`, run on the repo's own sources. A story it
// leaves out is a story the pre-push check never runs.

const root = fileURLToPath(new URL('../../../', import.meta.url));
const select = (...files: string[]) =>
  execFileSync('node', ['tests/e2e/checks/select-stories.mjs', ...files], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);

test('a changed component selects its stories and those of the components that render it', () => {
  const picked = select('packages/react/src/ui/Spinner.tsx');
  expect(picked).toContain('packages/react/src/ui/Spinner.stories.tsx');
  // LoadingState renders a Spinner; its stories never name Spinner.
  expect(picked).toContain('packages/react/src/feedback/LoadingState.stories.tsx');
  expect(picked).not.toContain('packages/react/src/typography/Kbd.stories.tsx');
  expect(picked.filter((f) => !f.startsWith('packages/react/'))).toEqual([]);
});

test('a changed story file selects itself only', () => {
  expect(select('packages/react/src/ui/Accordion.stories.tsx')).toEqual([
    'packages/react/src/ui/Accordion.stories.tsx',
  ]);
});

test('a change outside the sources selects no story', () => {
  expect(select('README.md')).toEqual([]);
});
