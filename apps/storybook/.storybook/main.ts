import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const chartsSrc = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../packages/charts/src'
);

// Every `apexcharts/<subpath>` and `react-apexcharts/<subpath>` the charts
// sources import, read from the sources so the list can't drift. Vite only
// discovers a deep import when a story first loads it, then re-optimizes and
// reloads mid-run: after pulling a new subpath, the first story-test run
// failed in unrelated files. Pre-bundling them all up front avoids that.
// charts is a linked workspace package, so they resolve through it (`>`).
const chartsDeepImports = [
  ...new Set(
    readdirSync(chartsSrc)
      .filter((file) => /\.tsx?$/.test(file))
      .flatMap((file) => [
        ...readFileSync(path.join(chartsSrc, file), 'utf8').matchAll(
          /^import\s+(?:[^'"]*\s+from\s+)?['"]((?:react-)?apexcharts\/[^'"]+)['"]/gm
        ),
      ])
      .map(([, specifier]) => `@sckyzo/cosmos-charts > ${specifier}`)
  ),
].sort();

const config: StorybookConfig = {
  // Allowlist for Origin/Host header validation (Storybook 10+ default = []).
  // localhost is always allowed; we add 'storybook' so Playwright running in
  // the same compose network can reach the manager via http://storybook:6006.
  core: {
    allowedHosts: ['storybook', '127.0.0.1'],
  },
  // No onboarding guide: the sidebar checklist ("Get started", "Level up"…)
  // and its menu link are for people new to Storybook, not for this reference.
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../packages/react/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../packages/react/src/**/*.mdx',
    '../../../packages/charts/src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    // viewport is built into Storybook 10 core (no longer a separate addon since SB 9).
    // Use parameters.viewport in preview.ts to configure breakpoints.
    '@storybook/addon-mcp',
    // Component testing in browser mode via Vitest + Playwright.
    // Run via `pnpm --filter @cosmos/storybook test`.
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
    // `react-docgen` (Babel-based) instead of `react-docgen-typescript`:
    // the latter is pinned at 2.4.0 (its latest, now unmaintained) and predates
    // TypeScript 6, so it silently drops every optional prop (`variant?`,
    // `size?`, …) from autodocs/Controls — only required props survived. The
    // Babel parser handles TS 6 function components + type aliases correctly.
    reactDocgen: 'react-docgen',
  },
  // Inject the official Tailwind 4 Vite plugin so @import 'tailwindcss' resolves
  // and @theme blocks are processed across all CSS files (including imported npm packages).
  // Also configure server for container usage:
  //  - allowedHosts: Vite blocks non-localhost hosts by default (CVE 2024-54394) → allowlist
  //    'storybook' (compose service hostname) + 'localhost' (host port-forward).
  //  - hmr.host: forces the browser-side HMR client to talk to localhost instead of the
  //    container hostname, so the WebSocket connects when the page is loaded via localhost:6006.
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      // `recharts` too: its first import in a story run reloads the same way.
      optimizeDeps: { include: [...chartsDeepImports, '@sckyzo/cosmos-charts > recharts'] },
      // When deployed under a sub-path (GitHub Pages serves the site at
      // https://sckyzo.github.io/cosmos/), Vite needs to know the prefix so
      // every asset URL — JS chunks, fonts, the docs iframe, lazy imports —
      // is rewritten as absolute. Without this, the page loads but every
      // import 404s because they resolve against `/` instead of `/cosmos/`.
      // `STORYBOOK_BASE_PATH` is set by the GH Pages deploy workflow; local
      // dev (`pnpm dev`) leaves it unset so `base` defaults to `/`.
      base: process.env.STORYBOOK_BASE_PATH ?? '/',
      server: {
        host: '0.0.0.0',
        allowedHosts: ['storybook', 'localhost', '127.0.0.1'],
        // No `cors`: Vite's default answers cross-origin requests from
        // localhost only. The manager and the preview share one origin, so
        // nothing here needs more, and `cors: true` let any website read the
        // files the dev server serves.
        // `storybook build` writes storybook-static/ inside the watched root:
        // without this, each static build (make ci) reloaded every open tab.
        watch: { ignored: ['**/storybook-static/**'] },
        // HMR config:
        //  - Browser on host accesses via localhost:6006 (port-forwarded from container).
        //  - Playwright in compose network accesses via http://storybook:6006.
        //  Force the WS endpoint to be relative so both work; chunk URLs stay relative too,
        //  avoiding "Failed to fetch dynamically imported module" when hosts differ.
        hmr: {
          clientPort: 6006,
          protocol: 'ws',
        },
      },
    });
  },
};

export default config;
