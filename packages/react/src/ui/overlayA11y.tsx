import { createContext, useContext, useEffect, useRef, useState, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Calls `onEscape` when Escape is pressed anywhere in the document while `active`. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}

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

const isVisible = (el: HTMLElement) => el.getClientRects().length > 0;

export type PortalFocusOptions = {
  /** Panel is open. Focus moves in once the panel element is mounted. */
  open: boolean;
  /** Closes the panel (Escape, Tab out, focus moved elsewhere). */
  onClose: () => void;
  /** The button that opened the panel: focus returns to it on close. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Element to focus on open. Default: first focusable element, else the panel. */
  initialFocus?: (panel: HTMLElement) => HTMLElement | null | undefined;
};

/**
 * Focus management for non-modal panels portaled to the end of `<body>`
 * (popovers, menus, pickers). Without it, keyboard users would Tab through the
 * whole page before reaching the panel. While open:
 * - moves focus into the panel when it opens (not when it is open on mount,
 *   so `defaultOpen` panels don't steal focus from the page),
 * - Escape closes it and returns focus to the trigger,
 * - Tab past the last element moves on to the element after the trigger, and
 *   Shift+Tab before the first one goes back to the trigger: the panel sits
 *   in the tab order right after its trigger, and closes on the way out,
 * - closes when focus moves anywhere else outside the panel,
 * - on close, puts focus back on the trigger if it was left inside the panel.
 *
 * Attach the returned ref to the panel and give it `tabIndex={-1}` so it can
 * take focus when it holds no focusable children.
 */
export function usePortalFocus<T extends HTMLElement>({
  open,
  onClose,
  triggerRef,
  initialFocus,
}: PortalFocusOptions): (node: T | null) => void {
  // A callback ref held in state: the panel can mount a render after `open`
  // turns true (it waits for the trigger's rect), and the effect must see it.
  const [panel, setPanel] = useState<T | null>(null);
  const openOnMount = useRef(open);
  // Latest callbacks, so a new inline `onClose` doesn't re-run the effect
  // (which would move focus back to the first item on every render).
  const latest = useRef({ onClose, initialFocus });
  useEffect(() => {
    latest.current = { onClose, initialFocus };
  });

  useEffect(() => {
    if (!open) {
      openOnMount.current = false;
      return;
    }
    if (!panel) return;
    const close = () => latest.current.onClose();
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);

    if (!openOnMount.current) {
      const target = latest.current.initialFocus?.(panel) ?? focusables()[0] ?? panel;
      target.focus();
    }
    openOnMount.current = false;

    // Next tabbable element after the trigger in the page, outside the panel.
    const afterTrigger = (): HTMLElement | null => {
      const trigger = triggerRef.current;
      if (!trigger) return null;
      const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !panel.contains(el) && isVisible(el)
      );
      return all[all.indexOf(trigger) + 1] ?? null;
    };

    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPanelKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      // Only elements Tab can reach: menu items with tabIndex -1 are focused
      // with the arrow keys, and Tab from one of them goes to the next
      // tabbable element after it, or leaves the panel when there is none.
      const tabbable = focusables().filter((el) => el.tabIndex >= 0);
      const current = document.activeElement;
      const side = e.shiftKey ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING;
      const leaving =
        !current || !tabbable.some((el) => current.compareDocumentPosition(el) & side);
      if (!leaving) return;
      e.preventDefault();
      const trigger = triggerRef.current;
      const next = e.shiftKey ? trigger : (afterTrigger() ?? trigger);
      // Focusing the trigger doesn't count as leaving (see onFocusOut), so
      // close explicitly; any other target closes through focusout.
      if (next === trigger) close();
      next?.focus();
    };
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      // null: focus went to nothing (window blur, click on a non-focusable
      // spot). The trigger: its own click handler toggles the panel.
      if (!to || panel.contains(to) || to === triggerRef.current) return;
      close();
    };

    document.addEventListener('keydown', onDocKeyDown);
    panel.addEventListener('keydown', onPanelKeyDown);
    panel.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('keydown', onDocKeyDown);
      panel.removeEventListener('keydown', onPanelKeyDown);
      panel.removeEventListener('focusout', onFocusOut);
      // By now the panel is unmounted: focus left inside it fell back to <body>.
      const focused = document.activeElement;
      if (!focused || focused === document.body || panel.contains(focused)) {
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the trigger as it is now, not at open
        triggerRef.current?.focus();
      }
    };
  }, [open, panel, triggerRef]);

  return setPanel;
}

/**
 * Carries the generated title id from a compound dialog's Root down to its
 * Header, so Root can point `aria-labelledby` at the heading Header renders.
 */
const DialogTitleContext = createContext<string | undefined>(undefined);
export const DialogTitleProvider = DialogTitleContext.Provider;
export const useDialogTitleId = () => useContext(DialogTitleContext);
