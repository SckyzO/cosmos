import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import config from '../../../apps/storybook/.storybook/main';

// Checks on the Storybook dev server's config, not on a running server. The
// dev server serves the repo's files and writes story files back (saving
// controls from the UI), so only the developer's own machine and browser may
// reach it.

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('dev server listens on every interface of its container', () => {
  // Storybook 10.6 listens on 127.0.0.1 by default: inside a container, that
  // leaves out both the host's port forward and Playwright on the compose
  // network.
  const { scripts } = JSON.parse(read('apps/storybook/package.json')) as {
    scripts: Record<string, string>;
  };
  expect(scripts.dev).toMatch(/--host 0\.0\.0\.0\b/);
});

test('dev server ports are published on loopback only', () => {
  // `- '6006:6006'` publishes on every interface, reachable from the LAN.
  const compose = [
    ...read('docker-compose.yml').matchAll(/^\s*-\s*['"]?((?:[\d.]+:)?\d+:\d+)['"]?\s*$/gm),
  ].map((m) => m[1]);
  const devctl = [...read('devctl').matchAll(/\s-p\s+(\S+)/g)].map((m) => m[1]);

  expect(compose.length, 'port mappings in docker-compose.yml').toBeGreaterThan(0);
  expect(devctl.length, '-p flags in devctl').toBeGreaterThan(0);
  for (const mapping of [...compose, ...devctl]) expect(mapping).toMatch(/^127\.0\.0\.1:/);
});

test('dev server answers cross-origin requests from localhost only', async () => {
  // Vite's default CORS policy allows localhost origins only; `cors: true`
  // let any website read the files the dev server serves.
  const vite = await config.viteFinal!({}, { configType: 'DEVELOPMENT' } as never);
  expect(vite.server?.cors).toBeUndefined();
});
