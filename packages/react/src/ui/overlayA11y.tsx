import { createContext, useContext, useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Focus management for modal overlays. While `active`:
 * - moves focus to the first focusable element inside the container (or the
 *   container itself),
 * - traps Tab / Shift+Tab so focus cannot leave the container into the inert
 *   background,
 * - restores focus to whatever was focused before opening, on close/unmount.
 *
 * `aria-modal="true"` only promises AT that the background is inert; it does
 * not keep keyboard focus in. This hook is what makes that promise real.
 *
 * Attach the returned ref to the container and give it `tabIndex={-1}` so the
 * container is focusable as a fallback when it holds no focusable children.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    (focusables()[0] ?? node).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active]);

  return ref;
}

/**
 * Carries the generated title id from a compound dialog's Root down to its
 * Header, so Root can point `aria-labelledby` at the heading Header renders.
 */
const DialogTitleContext = createContext<string | undefined>(undefined);
export const DialogTitleProvider = DialogTitleContext.Provider;
export const useDialogTitleId = () => useContext(DialogTitleContext);
