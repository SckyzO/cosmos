import { defineConfig, devices } from '@playwright/test';

const STORYBOOK_PORT = 6006;

export default defineConfig({
  testDir: './specs',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: `http://localhost:${STORYBOOK_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    // Boots Storybook before running tests; reuses existing server when one is up.
    command: 'pnpm --filter @cosmos/storybook dev --ci --quiet',
    url: `http://localhost:${STORYBOOK_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
  },
});
