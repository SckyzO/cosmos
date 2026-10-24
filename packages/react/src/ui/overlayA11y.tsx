import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { pushLayer, type OverlayLayer } from './overlayStack';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// The open overlays, bottom first.
let openLayers: readonly OverlayLayer[] = [];

// One document listener for every overlay, so one Escape closes one overlay. In the bubble
// phase, and an Escape whose default was prevented is left alone: it was handled already,
// by a component that closes something on Escape itself, or by a third-party layer (Radix
// dismisses in the capture phase and prevents the default, so the CommandPalette dialog,
// built on cmdk, closes alone and the overlays under it stay open).
const onEscapeKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const top = openLayers[openLayers.length - 1];
  if (!top) return;
  e.preventDefault();
  top.escape();
};

const OverlayLayerContext = createContext<OverlayLayer | null>(null);
/** Wraps an overlay's content, so the overlays opened from it stack above it. */
export const OverlayLayerProvider = OverlayLayerContext.Provider;

/**
 * Puts an overlay (a dialog, a drawer, a floating panel) in the stack of open overlays while
 * `open`. Escape, wherever focus is, calls the `onEscape` of the top one only: a menu open
 * in a modal closes, the modal stays until the next Escape.
 *
 * The overlay opened last is on top, and above the overlay it was opened from even when
 * both open on mount: give the returned layer to the overlay's content with
 * `OverlayLayerProvider`.
 */
export function useOverlayLayer(open: boolean, onEscape: () => void): OverlayLayer {
  const parent = useContext(OverlayLayerContext);
  // The latest callback, so a new inline `onEscape` doesn't move the layer to the top.
  const latest = useRef(onEscape);
  useEffect(() => {
    latest.current = onEscape;
  });
  const [layer] = useState<OverlayLayer>(() => ({ parent, escape: () => latest.current() }));

  useEffect(() => {
    if (!open) return;
    openLayers = pushLayer(openLayers, layer);
    document.addEventListener('keydown', onEscapeKeyDown);
    return () => {
      openLayers = openLayers.filter((other) => other !== layer);
      if (openLayers.length === 0) document.removeEventListener('keydown', onEscapeKeyDown);
    };
  }, [open, layer]);

  return layer;
}

export type OutsideClickOptions = {
  /** Panel is open: listen while true. */
  open: boolean;
  /** Called on a mousedown outside the panel and `insideRefs`. */
  onOutsideClick: () => void;
  /**
   * The parts of the widget outside the panel, its trigger first: a mousedown on them is not
   * outside, so the trigger's own click can toggle the panel.
   */
  insideRefs: ReadonlyArray<RefObject<HTMLElement | null>>;
};

/**
 * Outside click for floating panels: calls `onOutsideClick` on a mousedown anywhere but the
 * panel and `insideRefs`. A document listener, not a click-catching backdrop, so the click
 * still reaches what is under the pointer, and the panel needs no layer of its own.
 *
 * Spread the returned `onMouseDownCapture` on the panel. It marks the events that start in
 * the panel's React tree, which the document listener then skips: a panel nested in this one
 * and portaled elsewhere (a menu opened from a popover) counts as inside, as React events do.
 */
export function useOutsideClick<T extends HTMLElement>({
  open,
  onOutsideClick,
  insideRefs,
}: OutsideClickOptions): { onMouseDownCapture: (e: ReactMouseEvent<T>) => void } {
  // The last mousedown seen inside the React tree: compared, never reset, so an event a
  // handler stopped before the document can't leave a stale flag behind.
  const inside = useRef<Event | null>(null);
  const latest = useRef({ onOutsideClick, insideRefs });
  useEffect(() => {
    latest.current = { onOutsideClick, insideRefs };
  });

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (e === inside.current) return;
      const target = e.target as Node;
      if (latest.current.insideRefs.some((ref) => ref.current?.contains(target))) return;
      latest.current.onOutsideClick();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const onMouseDownCapture = useCallback((e: ReactMouseEvent<T>) => {
    inside.current = e.nativeEvent;
  }, []);
  return { onMouseDownCapture };
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
  /** Closes the panel (Tab out, focus moved elsewhere). */
  onClose: () => void;
  /** The button that opened the panel: focus returns to it on close. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Element to focus on open. Default: first focusable element, else the panel. */
  initialFocus?: (panel: HTMLElement) => HTMLElement | null | undefined;
};

export type PortalFocusProps<T extends HTMLElement> = {
  ref: (node: T | null) => void;
  onFocusCapture: (e: ReactFocusEvent<T>) => void;
};

/**
 * Focus management for non-modal panels portaled to the end of `<body>`
 * (popovers, menus, pickers). Without it, keyboard users would Tab through the
 * whole page before reaching the panel. While open:
 * - moves focus into the panel when it opens (not when it is open on mount,
 *   so `defaultOpen` panels don't steal focus from the page),
 * - Tab past the last element moves on to the element after the trigger, and
 *   Shift+Tab before the first one goes back to the trigger: the panel sits
 *   in the tab order right after its trigger, and closes on the way out,
 * - closes when focus moves from the panel to anywhere else but the trigger,
 * - on close, puts focus back on the trigger if it was left inside the panel.
 *
 * Escape is not handled here: the panel takes part in the overlay stack
 * (`useOverlayLayer`), and closing it on Escape puts focus back on the trigger.
 *
 * Spread the returned props on the panel and give it `tabIndex={-1}` so it can
 * take focus when it holds no focusable children. `onFocusCapture` tells focus
 * moving within the panel's React tree, a nested panel portaled elsewhere
 * included, from focus leaving it.
 */
export function usePortalFocus<T extends HTMLElement>({
  open,
  onClose,
  triggerRef,
  initialFocus,
}: PortalFocusOptions): PortalFocusProps<T> {
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
  // The last focus event seen in the panel's React tree, and whether focus is
  // in that tree: set by `onFocusCapture`, which runs before the document's
  // focusin listener.
  const focus = useRef<{ event: Event | null; inside: boolean }>({ event: null, inside: false });
  const onFocusCapture = useCallback((e: ReactFocusEvent<T>) => {
    focus.current = { event: e.nativeEvent, inside: true };
  }, []);

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
    if (panel.contains(document.activeElement)) focus.current.inside = true;

    // Next tabbable element after the trigger in the page, outside the panel.
    const afterTrigger = (): HTMLElement | null => {
      const trigger = triggerRef.current;
      if (!trigger) return null;
      const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !panel.contains(el) && isVisible(el)
      );
      return all[all.indexOf(trigger) + 1] ?? null;
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
      // Focusing the trigger doesn't count as leaving (see onFocusIn), so
      // close explicitly; any other target closes through focusin.
      if (next === trigger) close();
      next?.focus();
    };
    const onFocusIn = (e: FocusEvent) => {
      const state = focus.current;
      if (e === state.event) return;
      const wasInside = state.inside;
      state.inside = false;
      // Focus came from outside the panel: not ours to close. It went to the
      // trigger: its own click handler toggles the panel. Focus going to
      // nothing (window blur, click on a non-focusable spot) fires no focusin.
      if (!wasInside || e.target === triggerRef.current) return;
      close();
    };

    document.addEventListener('focusin', onFocusIn);
    panel.addEventListener('keydown', onPanelKeyDown);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      panel.removeEventListener('keydown', onPanelKeyDown);
      focus.current.inside = false;
      // By now the panel is unmounted: focus left inside it fell back to <body>.
      const focused = document.activeElement;
      if (!focused || focused === document.body || panel.contains(focused)) {
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the trigger as it is now, not at open
        triggerRef.current?.focus();
      }
    };
  }, [open, panel, triggerRef]);

  return { ref: setPanel, onFocusCapture };
}

/**
 * Carries the generated title id from a compound dialog's Root down to its
 * Header, so Root can point `aria-labelledby` at the heading Header renders.
 */
const DialogTitleContext = createContext<string | undefined>(undefined);
export const DialogTitleProvider = DialogTitleContext.Provider;
export const useDialogTitleId = () => useContext(DialogTitleContext);
