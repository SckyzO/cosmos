import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

// CAPTURE_VIEWPORT=<width>x<height> captures at another size than Desktop
// Chrome's 1280x720 (the height only sets the first frame: captures are full
// page). `make screenshots` and `make visual-diff` use it; the audit has its own
// config, which sets the size page by page.
const viewport = process.env.CAPTURE_VIEWPORT?.match(/^(\d+)x(\d+)$/);
if (process.env.CAPTURE_VIEWPORT && !viewport) {
  throw new Error(`CAPTURE_VIEWPORT=${process.env.CAPTURE_VIEWPORT} is not <width>x<height>`);
}

// Manual visual captures (`make screenshots`): every spec under captures/ opens
// a story and writes a PNG to screenshots/ for a human to eyeball. They assert
// nothing, so they stay out of `pnpm test` and CI.
export default defineConfig({
  ...base,
  testDir: './captures',
  testIgnore: 'audit.spec.ts',
  retries: 0,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(viewport && { viewport: { width: Number(viewport[1]), height: Number(viewport[2]) } }),
      },
    },
  ],
});
