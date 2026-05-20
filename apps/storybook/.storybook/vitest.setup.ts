import { setProjectAnnotations } from '@storybook/react-vite';
import { beforeAll } from 'vitest';

import * as projectAnnotations from './preview';

// Silence Vite HMR client noise in browser test mode.
//
// Vitest's browser mode spins up a Vite dev server with HMR enabled, and
// `@vite/client` opens a WebSocket to it. In the test browser the socket
// is closed before the open handshake completes, generating a recurring
// `WebSocket closed without opened` unhandled rejection. Tests still pass
// but the noise pollutes the Storybook UI "Tests" panel — which captures
// unhandled rejections via its own listener, so the
// `dangerouslyIgnoreUnhandledErrors: true` flag in `vitest.config.ts`
// (which only affects Vitest's own runner) doesn't reach it. Marking the
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
const project = setProjectAnnotations([projectAnnotations.default]);

beforeAll(project.beforeAll);
