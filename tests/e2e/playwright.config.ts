import { defineConfig, devices } from '@playwright/test';

const STORYBOOK_PORT = 6006;
// In Compose mode, storybook is provided as a service (PLAYWRIGHT_BASE_URL set,
// e.g. http://storybook:6006). In stand-alone mode, we boot it ourselves.
const inCompose = !!process.env.PLAYWRIGHT_BASE_URL;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${STORYBOOK_PORT}`;

export default defineConfig({
  testDir: './specs',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: '../../playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Chromium only: the suite guards Storybook wiring (smoke + autodocs), which
  // is decided at build time and identical across engines. A second browser
  // doubled the CI time without catching anything the first one missed.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Only spawn storybook ourselves when not running inside the compose stack.
  // In CI (and `make ci`) the static build from the previous step is served:
  // the dev server compiles each docs page on first visit and Vite's dep
  // optimizer can reload it mid-test, which is what made the suite flaky.
  webServer: inCompose
    ? undefined
    : {
        command: process.env.CI
          ? `pnpm --filter @cosmos/storybook exec vite preview --outDir storybook-static --port ${STORYBOOK_PORT} --strictPort`
          : 'pnpm --filter @cosmos/storybook dev --ci --quiet',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'ignore',
      },
});
