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

test('only Markdown, docs/ and pictures outside the code count as documentation', () => {
  const docsOnly = (...files: string[]) =>
    spawnSync('tests/e2e/checks/docs-only.sh', { cwd: root, input: files.join('\n') }).status === 0;
  expect(
    docsOnly('README.md', 'docs/specs/themes-accents.md', 'docs/images/welcome-dark.png')
  ).toBe(true);
  expect(docsOnly('packages/react/README.md', 'logo.png')).toBe(true);
  expect(docsOnly('README.md', 'packages/react/src/ui/Spinner.tsx')).toBe(false);
  expect(docsOnly('README.md', '.github/workflows/ci.yml')).toBe(false);
  expect(docsOnly('apps/storybook/public/avatar.png'), 'a picture a story may render').toBe(false);
  expect(docsOnly('tests/e2e/fixtures/a.png')).toBe(false);
  expect(docsOnly('docs/diagram.svg', 'package.json')).toBe(false);
  expect(docsOnly(), 'no file at all').toBe(false);
});
