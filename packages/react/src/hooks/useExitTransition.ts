import { useLayoutEffect, useState, type RefObject } from 'react';
import { exitAnimations } from './exitAnimations';

// Internal to the package: how a panel leaves. Not exported from the barrel.

/**
 * Whether a panel is still on screen: while `open`, and after it closed until its exit has
 * played. Render the panel while this is true, and mark it as leaving while `open` is false
 * (`inert`, `pointer-events-none`): the exit is a transition or an animation the panel's classes
 * start when it closes.
 *
 * It unmounts at once when nothing is left to wait for: no transition or animation of the
 * panel's opacity, scale or slide is running, because the durations are 0 (`prefers-reduced-motion`,
 * `data-motion="reduced"`, the story tests), because the panel closed before it ever moved, or
 * because the browser has no `getAnimations`. A loop inside the panel never holds it. The check
 * runs in a layout effect, once the closed classes are committed, so the panel is gone before
 * the frame is painted.
 *
 * Wait on the elements of `refs` and their descendants: the panel, and the scrim if it is a
 * sibling of the panel. While `open` is false the overlay is already out of the stack
 * (`useOverlayLayer` takes `open`, not this) and focus is back on its trigger: this only keeps
 * the picture on screen.
 *
 * Opening again while the panel leaves keeps it mounted: its classes turn back and the
 * transition reverses.
 */
export function useExitTransition(
  open: boolean,
  ...refs: ReadonlyArray<RefObject<HTMLElement | null>>
): boolean {
  const [present, setPresent] = useState(open);
  // Opening mounts at once, in the same render: no frame with the panel missing.
  if (open && !present) setPresent(true);

  useLayoutEffect(() => {
    if (open || !present) return;
    const running: Animation[] = [];
    for (const ref of refs) {
      const element = ref.current;
      if (element && typeof element.getAnimations === 'function') {
        running.push(...exitAnimations(element.getAnimations({ subtree: true })));
      }
    }
    if (running.length === 0) {
      // Reading the browser's animations is the whole point of the effect: the state follows
      // what is running in the document, once the closed classes are committed.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPresent(false);
      return;
    }
    // `finished` rejects when an animation is cancelled (the panel reopened, or its classes
    // changed again): that too is the end of the wait.
    let cancelled = false;
    void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
      if (!cancelled) setPresent(false);
    });
    return () => {
      cancelled = true;
    };
    // `refs` holds refs, stable for the life of the component: the array is new on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, present]);

  return open || present;
}
