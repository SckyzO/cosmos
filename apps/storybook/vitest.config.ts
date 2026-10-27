import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COSMOS_THEMES } from '../../packages/react/src/settings/appearance';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * `A11Y_THEME=<theme>` turns the story run into the contrast pass of that
 * theme (`pnpm a11y:contrast` runs light, sand and deep-blue): see
 * `contrastPassAnnotations` in `.storybook/a11y-gate.ts`. Unset, the stories
 * run in the default theme with every axe rule, behind the todo list.
 */
const a11yTheme = process.env.A11Y_THEME ?? '';
if (a11yTheme && !COSMOS_THEMES.some(({ id }) => id === a11yTheme)) {
  throw new Error(
    `A11Y_THEME=${a11yTheme}: expected one of ${COSMOS_THEMES.map(({ id }) => id).join(', ')}.`
  );
}

/**
 * `STORY_DIR=rtl` turns the story run into the direction pass (`pnpm a11y:rtl`): every story
 * renders under `dir="rtl"`, with every axe rule and a check for sideways scrolling, see
 * `.storybook/direction-pass.ts`.
 */
const storyDir = process.env.STORY_DIR ?? '';
if (storyDir && storyDir !== 'rtl') {
  throw new Error(`STORY_DIR=${storyDir}: expected rtl.`);
}

/**
 * Vitest config for the Storybook app, two projects:
 *
 * - `storybook`: browser mode via Playwright. Runs all `*.stories.tsx` as
 *   component tests using the Storybook addon-vitest plugin. The plugin
 *   discovers stories from this app's storybook config and executes them in a
 *   headless Chromium browser instance, then runs axe on each, behind the
 *   todo list of `.storybook/a11y-gate.ts` (in the contrast pass, `A11Y_THEME`
 *   above, axe's `color-contrast` rule alone, with no todo list).
 * - `node`: plain Node, no browser and no DOM. Runs the `*.test.ts` unit tests
 *   of the packages' pure logic. Vitest is a dependency of this app only, so
 *   the packages' tests run from here (and `tsconfig.json` maps `vitest` for
 *   their typecheck).
 *
 * Run from the workspace root:
 *   pnpm --filter @cosmos/storybook test
 */
export default defineConfig({
  test: {
    // The Vite HMR client tries to reach a dev server in browser mode and
    // fails with "WebSocket closed without opened" — those rejections are
    // harmless. Drop only that one: a blanket dangerouslyIgnoreUnhandledErrors
    // also swallowed "browserType.launch: Executable doesn't exist", so a run
    // that executed zero tests (browser revision mismatch) exited 0.
    onUnhandledError(error) {
      if (error.message?.includes('WebSocket closed without opened')) return false;
    },
    projects: [
      {
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'pnpm dev --ci',
          }),
        ],
        // Only vitest.setup.ts imports addon-a11y's preview: pre-bundle it, or
        // Vite discovers it mid-run, reloads, and the files already loading
        // fail with "Failed to fetch dynamically imported module".
        optimizeDeps: { include: ['@storybook/addon-a11y/preview'] },
        test: {
          name: 'storybook',
          provide: { a11yTheme, storyDir },
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['../../packages/*/src/**/*.test.ts'],
        },
      },
    ],
  },
});
