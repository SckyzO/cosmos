import { execFileSync, spawnSync } from 'node:child_process';
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
  // charts imports nothing from react: none of its stories.
  expect(picked.filter((f) => f.startsWith('packages/charts/'))).toEqual([]);
});

test('a changed story file selects itself only', () => {
  expect(select('packages/react/src/ui/Accordion.stories.tsx')).toEqual([
    'packages/react/src/ui/Accordion.stories.tsx',
  ]);
});

test('a change outside the sources selects no story', () => {
  expect(select('README.md')).toEqual([]);
});

test('a changed story file of the Storybook app selects itself only', () => {
  expect(select('apps/storybook/stories/Radius.stories.tsx')).toEqual([
    'apps/storybook/stories/Radius.stories.tsx',
  ]);
});

test('a changed helper of the Storybook app selects the story files that import it', () => {
  const picked = select('apps/storybook/stories/examples/list.data.ts');
  expect(picked).toContain('apps/storybook/stories/examples/List.stories.tsx');
  expect(picked).not.toContain('apps/storybook/stories/Radius.stories.tsx');
  expect(picked.filter((f) => !f.startsWith('apps/storybook/stories/'))).toEqual([]);
});

test('a changed component selects the Storybook app stories that render it', () => {
  const picked = select('packages/react/src/ui/Spinner.tsx');
  expect(picked).toContain('packages/react/src/ui/Spinner.stories.tsx');
  expect(picked.some((f) => f.startsWith('apps/storybook/stories/'))).toBe(true);
});
