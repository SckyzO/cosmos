import { useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches, kept in sync as it changes. `serverValue` is what the server
 * and the hydration render: pick the layout most visitors get, so the markup rarely changes.
 * `null` is no query: it never matches, and `window.matchMedia` is not called, for a component
 * that only needs the answer once an option is on.
 *
 * Internal to the package, not exported. Prefer a Tailwind responsive class; reach for this only
 * when the markup itself, not just its classes, depends on the width.
 */
export const useMediaQuery = (query: string | null, serverValue: boolean) =>
  useSyncExternalStore(
    (onChange) => {
      if (query === null) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => query !== null && window.matchMedia(query).matches,
    () => query !== null && serverValue
  );
