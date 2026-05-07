import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for the Storybook app — browser mode via Playwright.
 *
 * Runs all `*.stories.tsx` as component tests using the Storybook addon-vitest
 * plugin. The plugin discovers stories from this app's storybook config and
 * executes them in a headless Chromium browser instance.
 *
 * Run from the workspace root:
 *   pnpm --filter @cosmos/storybook test
 */
export default defineConfig({
  test: {
    // The Vite HMR client tries to reach a dev server in browser mode and
    // fails with "WebSocket closed without opened" — those rejections are
    // harmless in CI. Ignore so a successful test run doesn't exit 1.
    dangerouslyIgnoreUnhandledErrors: true,
    projects: [
      {
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'pnpm dev --ci',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
