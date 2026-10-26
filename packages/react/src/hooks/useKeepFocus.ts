import { useCallback, useRef } from 'react';

/**
 * A callback ref that keeps focus where it was when React replaces the element it is on.
 *
 * A Sidebar row sits inside a `Tooltip` while the rail is collapsed and bare once it is expanded
 * (or the other way round when a label stops being cut), so showing the labels mounts a new
 * element: a keyboard user who Tabbed onto the old one would be left on `<body>`. When the element
 * holding focus is detached and another one attaches to this ref in the same commit, focus moves
 * to it. Focus that went elsewhere in the meantime is left alone.
 *
 * Internal to the package, not exported.
 */
export const useKeepFocus = () => {
  const node = useRef<HTMLElement | null>(null);
  const hadFocus = useRef(false);
  return useCallback((el: HTMLElement | null) => {
    if (el === null) {
      // Detached: React hasn't removed the old element yet, so it still tells whether it was focused.
      hadFocus.current = node.current !== null && document.activeElement === node.current;
      node.current = null;
      return;
    }
    node.current = el;
    const lost = !document.activeElement || document.activeElement === document.body;
    if (hadFocus.current && lost) el.focus({ preventScroll: true });
    hadFocus.current = false;
  }, []);
};
