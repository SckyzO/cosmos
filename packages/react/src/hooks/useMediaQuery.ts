import { useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches, kept in sync as it changes. `serverValue` is what the server
 * and the hydration render: pick the layout most visitors get, so the markup rarely changes.
 *
 * Internal to the package, not exported. Prefer a Tailwind responsive class; reach for this only
 * when the markup itself, not just its classes, depends on the width.
 */
export const useMediaQuery = (query: string, serverValue: boolean) =>
  useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue
  );
