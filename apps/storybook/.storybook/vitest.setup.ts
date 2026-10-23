import { setProjectAnnotations } from '@storybook/react-vite';
import { afterEach, beforeAll } from 'vitest';

import { a11yGateAnnotations, recordA11yViolations } from './a11y-gate';
import * as projectAnnotations from './preview';

// Silence Vite HMR client noise in browser test mode.
//
// Vitest's browser mode spins up a Vite dev server with HMR enabled, and
// `@vite/client` opens a WebSocket to it. In the test browser the socket
// is closed before the open handshake completes, generating a recurring
// `WebSocket closed without opened` unhandled rejection. Tests still pass
// but the noise pollutes the Storybook UI "Tests" panel — which captures
// unhandled rejections via its own listener, so the `onUnhandledError`
// filter in `vitest.config.ts` (which only affects Vitest's own runner)
// doesn't reach it. Marking the
// rejection as handled here suppresses the noise without hiding real
// failures. See https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/?ref=ui#what-happens-if-vitest-itself-has-an-error
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '';
    if (message.includes('WebSocket closed without opened')) {
      event.preventDefault();
    }
  });
}

// Wire the framework's preview annotations into the Vitest test runner so
// `context.renderToCanvas` is available when stories mount in browser mode.
//
// Note: addon-vitest 10.3 prints "Skipping automatic provisioning" when it
// detects this call, but the auto-provisioning currently does NOT wire
// renderToCanvas — without this explicit call every story fails with
// `TypeError: context.renderToCanvas is not a function`.
//
// Skipping the provisioning also drops the addons' preview annotations, so
// addon-a11y's is listed here: without it axe never runs in the story tests.
// `a11y-gate.ts` wraps its afterEach to give each story its `a11y.test` mode
// from one list, `a11y-todo.json`, rather than a parameter in each story file
// (a story edit under packages/ counts as a release of the package). It goes
// before preview: parameters merge left to right, as in Storybook, so
// preview's `a11y: { test: 'error' }` overrides the addon's default `'todo'`.
const project = setProjectAnnotations([a11yGateAnnotations, projectAnnotations.default]);

beforeAll(project.beforeAll);
// Hands the rules each story violates to `pnpm a11y:todo` (task meta).
afterEach(recordA11yViolations);
