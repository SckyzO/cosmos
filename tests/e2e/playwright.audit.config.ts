import { defineConfig } from '@playwright/test';
import captures from './playwright.captures.config';

// `make audit-captures`: the audit spec alone, with the capture settings. The
// widths are set page by page by the spec.
export default defineConfig({
  ...captures,
  testIgnore: undefined,
  testMatch: 'audit.spec.ts',
});
