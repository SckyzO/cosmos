import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/**
 * False on the server and during hydration, true in the browser: render a portal only once
 * this is true, so the server and the first client render agree. A client-only render reads
 * true from the start, with no extra pass.
 *
 * Internal to the package, not exported.
 */
export const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
