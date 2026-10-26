import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import { useMediaQuery } from './useMediaQuery';

// The pointer must stay this long over the rail before it opens, so crossing it on the way to the
// page opens nothing (and, with `push`, reflows nothing).
const OPEN_DELAY = 150;
// And it must stay out this long before it closes, so the edge of the panel, a gap on the way to a
// menu portaled elsewhere, or a focus that moves from one place to another doesn't make it flicker.
const CLOSE_DELAY = 100;

// Desktop only: from `lg` up, the breakpoint the Shell turns its sidebar into a drawer at, and on a
// pointer that can hover. A touch screen has no hover to expand on, whatever its width.
const CAN_HOVER = '(min-width: 64rem) and (hover: hover) and (pointer: fine)';

type Engaged = {
  /** The pointer has stayed over the sidebar. */
  pointer: boolean;
  /** Keyboard focus is inside the sidebar. */
  focus: boolean;
  /** Escape closed it: it stays closed until the pointer comes back or focus does. */
  dismissed: boolean;
};

const IDLE: Engaged = { pointer: false, focus: false, dismissed: false };

export type ExpandOnHover = {
  /** Whether the collapsed sidebar shows in its expanded form right now. */
  expanded: boolean;
  /** Closes it until the pointer comes back or focus does: what Escape does. */
  dismiss: () => void;
  /** Spread on the sidebar's root element. */
  props: {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => void;
    onPointerLeave: (e: PointerEvent<HTMLElement>) => void;
    onFocus: (e: FocusEvent<HTMLElement>) => void;
    onBlur: (e: FocusEvent<HTMLElement>) => void;
  };
};

/**
 * Whether a collapsed sidebar shows expanded because the pointer rests on it or keyboard focus is
 * inside it, for `Sidebar`'s `expandOnHover`.
 *
 * `enabled` says it can happen at all (the sidebar is collapsed, the option is on, it is not a
 * drawer); the viewport and pointer conditions are checked here. Nothing is tracked while it is not
 * enabled, and what was tracked is dropped: a sidebar collapsed by hand under the pointer shows its
 * rail until the pointer leaves and comes back, instead of opening again at once.
 *
 * Pointer: opens after `OPEN_DELAY` over the sidebar, closes `CLOSE_DELAY` after it leaves. A touch
 * pointer is ignored. Focus: opens as soon as focus enters from the keyboard (`:focus-visible`: a
 * click that focuses a row doesn't hold it open), closes `CLOSE_DELAY` after focus leaves. Both
 * follow the React tree, so a menu portaled out of the sidebar still counts as inside it.
 *
 * Internal to the package, not exported.
 */
export const useExpandOnHover = (enabled: boolean): ExpandOnHover => {
  // Asked only while it can matter: a Sidebar that never expands on hover calls no `matchMedia`.
  const canHover = useMediaQuery(enabled ? CAN_HOVER : null, false);
  const active = enabled && canHover;
  const [engaged, setEngaged] = useState(IDLE);
  const pointerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const focusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Dropped as soon as it can't apply, during the render: an effect would paint one frame of the
  // expanded sidebar first.
  if (!active && engaged !== IDLE) setEngaged(IDLE);
  useEffect(() => {
    if (active) return;
    clearTimeout(pointerTimer.current);
    clearTimeout(focusTimer.current);
  }, [active]);
  useEffect(
    () => () => {
      clearTimeout(pointerTimer.current);
      clearTimeout(focusTimer.current);
    },
    []
  );

  const dismiss = () => {
    clearTimeout(pointerTimer.current);
    setEngaged((now) => ({ ...now, dismissed: true }));
  };

  const props: ExpandOnHover['props'] = {
    onPointerEnter: (e) => {
      if (!active || e.pointerType === 'touch') return;
      clearTimeout(pointerTimer.current);
      if (engaged.pointer) return;
      pointerTimer.current = setTimeout(
        () => setEngaged((now) => ({ ...now, pointer: true, dismissed: false })),
        OPEN_DELAY
      );
    },
    onPointerLeave: (e) => {
      if (!active || e.pointerType === 'touch') return;
      clearTimeout(pointerTimer.current);
      if (!engaged.pointer) return;
      pointerTimer.current = setTimeout(
        () => setEngaged((now) => ({ ...now, pointer: false })),
        CLOSE_DELAY
      );
    },
    onFocus: (e) => {
      if (!active) return;
      clearTimeout(focusTimer.current);
      // Moving within the sidebar, or back from a menu it opened, is not coming in.
      if (engaged.focus) return;
      if (!(e.target as Element).matches(':focus-visible')) return;
      setEngaged((now) => ({ ...now, focus: true, dismissed: false }));
    },
    onBlur: (e) => {
      if (!active) return;
      // Focus moving to another element of the sidebar is not leaving it.
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(
        () => setEngaged((now) => ({ ...now, focus: false })),
        CLOSE_DELAY
      );
    },
  };

  return {
    expanded: active && !engaged.dismissed && (engaged.pointer || engaged.focus),
    dismiss,
    props,
  };
};
