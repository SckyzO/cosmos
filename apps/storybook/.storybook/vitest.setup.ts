import { setProjectAnnotations } from '@storybook/react-vite';
import type { ProjectAnnotations, Renderer } from 'storybook/internal/types';
import { configure } from 'storybook/test';
import { afterEach, beforeAll } from 'vitest';

import { a11yGateAnnotations, contrastPassAnnotations, recordA11yViolations } from './a11y-gate';
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

// A story test waits on timers, CSS transitions and React effects, and the margin that holds on an
// idle machine does not on a busy one (several vitest runs at once, a `make ci` next to other
// containers): `waitFor` and `findBy*` give up after 1 s by default, and a re-run alone passes. 3 s
// still fails a wrong assertion, only later. A story never gets a `timeout` of its own for this.
configure({ asyncUtilTimeout: 3000 });

// Transitions and animations are settled in the story tests: a computed style read after a state
// change (a focus border, a sidebar width) is the final one, not a frame of `transition-colors`
// that a loaded machine stretches. A story that tests the motion itself opts out with
// `parameters: { settleMotion: false }`.
//
// Durations and delays go to 0 s: a transition never starts, so `getAnimations()` is empty and
// `transitionend` never fires. A story whose component waits for that event (`useContentWidth`
// measures once the sidebar's width settled) opts out as well.
// A duration of 1 ms would keep the events, but it would also start a transition on every property
// of every element that has none (the default `transition-property` is `all`). Recharts animates
// in JavaScript and is out of reach of this: see `hoverRing` in `src/storybook-recharts.tsx`.
const SETTLE_MOTION_STYLE = `
*, *::before, *::after {
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  animation-duration: 0s !important;
  animation-delay: 0s !important;
}`;

const settleMotionAnnotations: ProjectAnnotations<Renderer> = {
  beforeEach: ({ parameters }) => {
    if (parameters.settleMotion === false) return;
    const style = document.createElement('style');
    style.dataset.settleMotion = '';
    style.textContent = SETTLE_MOTION_STYLE;
    document.head.append(style);
    return () => style.remove();
  },
};

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
// The contrast pass comes last, to override preview's theme (empty otherwise).
const project = setProjectAnnotations([
  a11yGateAnnotations,
  projectAnnotations.default,
  settleMotionAnnotations,
  contrastPassAnnotations,
]);

beforeAll(project.beforeAll);
// Hands the rules each story violates to `pnpm a11y:todo` (task meta).
afterEach(recordA11yViolations);
