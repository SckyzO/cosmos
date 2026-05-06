import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  // Allowlist for Origin/Host header validation (Storybook 10+ default = []).
  // localhost is always allowed; we add 'storybook' so Playwright running in
  // the same compose network can reach the manager via http://storybook:6006.
  core: {
    allowedHosts: ['storybook', '127.0.0.1'],
  },
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../packages/react/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../packages/react/src/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    // viewport is built into Storybook 10 core (no longer a separate addon since SB 9).
    // Use parameters.viewport in preview.ts to configure breakpoints.
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
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
      server: {
        host: '0.0.0.0',
        allowedHosts: ['storybook', 'localhost', '127.0.0.1'],
        cors: true,
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
