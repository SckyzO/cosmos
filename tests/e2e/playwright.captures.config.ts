import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Manual visual captures (`make screenshots`): every spec under captures/ opens
// a story and writes a PNG to screenshots/ for a human to eyeball. They assert
// nothing, so they stay out of `pnpm test` and CI.
export default defineConfig({
  ...base,
  testDir: './captures',
  retries: 0,
});
