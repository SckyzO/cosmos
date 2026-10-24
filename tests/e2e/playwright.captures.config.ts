import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

// CAPTURE_VIEWPORT=<width>x<height> captures at another size than Desktop
// Chrome's 1280x720 (the height only sets the first frame: captures are full
// page). `make audit-captures` uses it for the 375px pass.
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
