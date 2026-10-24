import { clsx } from 'clsx';
import { HelpCircle } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Kbd } from '../typography/Kbd';
import { TOOLTIP_Z } from './FloatingPanel';
import type { Intent } from './intent';
import { useOverlayLayer } from './overlayA11y';
import { useAnchorPosition } from '../hooks/useAnchorPosition';
import { useControllableState } from '../hooks/useControllableState';
import { useIsClient } from '../hooks/useIsClient';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
/** Surface of the tooltip. */
export type TooltipVariant = 'dark' | 'white';
/** Meaning of the tooltip: colors it over its surface. */
export type TooltipIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger'>;

// Gap between the trigger and the box, room for the arrow.
const OFFSET = 10;

// Where a tooltip never shown yet waits, invisible: it has no position before
// its trigger is first measured, and must exist for `aria-describedby`.
const UNPLACED: CSSProperties = { top: 0, left: 0 };

// Centered on the box, minus `--anchor-shift`: how far the box moved along its trigger to
// stay on screen, so the arrow keeps pointing at the trigger.
const ARROW_POS: Record<TooltipPosition, string> = {
  top: 'top-full left-[calc(50%_-_var(--anchor-shift,0px))] -translate-x-1/2 -translate-y-1/2',
  bottom: 'bottom-full left-[calc(50%_-_var(--anchor-shift,0px))] -translate-x-1/2 translate-y-1/2',
  left: 'left-full top-[calc(50%_-_var(--anchor-shift,0px))] -translate-x-1/2 -translate-y-1/2',
  right: 'right-full top-[calc(50%_-_var(--anchor-shift,0px))] translate-x-1/2 -translate-y-1/2',
};

const VARIANT_BOX: Record<TooltipVariant, string> = {
  dark: 'bg-gray-900 text-white shadow-[0_0_20px_rgba(0,0,0,0.35)] dark:bg-gray-700',
  white:
    'bg-white text-gray-700 border border-gray-200 shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
};

const INTENT_BOX: Record<TooltipIntent, string> = {
  brand: 'bg-brand-500 text-white shadow-[0_0_20px_rgba(0,0,0,0.25)]',
  // Shades picked for 4.5:1 text contrast; amber is too light for white text.
  success: 'bg-green-700 text-white shadow-[0_0_20px_rgba(0,0,0,0.25)]',
  warning: 'bg-amber-400 text-gray-900 shadow-[0_0_20px_rgba(0,0,0,0.25)]',
  danger: 'bg-red-600 text-white shadow-[0_0_20px_rgba(0,0,0,0.25)]',
};

const VARIANT_ARROW: Record<TooltipVariant, string> = {
  dark: 'bg-gray-900 dark:bg-gray-700',
  white: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
};

const INTENT_ARROW: Record<TooltipIntent, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-700',
  warning: 'bg-amber-400',
  danger: 'bg-red-600',
};

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  /** Surface: `dark` (default) or `white`. Ignored while `intent` is set. */
  variant?: TooltipVariant;
  /** Colors the tooltip by meaning, over `variant`. Unset (default) keeps the plain surface. */
  intent?: TooltipIntent;
  /** Tailwind max-width class — default `max-w-xs` (320px) */
  maxWidth?: string;
  /** Keys shown after the content, e.g. `['⌘', 'S']`. */
  shortcut?: string[];
  /** Bold first line; `content` then reads as its explanation. */
  title?: ReactNode;
  /** Draw the small arrow pointing at the trigger. Default `true`. */
  arrow?: boolean;
  /** Milliseconds to wait before showing on hover or focus. Default `0`. */
  delay?: number;
  /** Shown state, when controlled. Hover, focus and Escape then only report through `onOpenChange`. */
  open?: boolean;
  /** Initial shown state, when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the shown state to move to. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Tooltip — shows `content` next to its trigger on hover and on keyboard
 * focus; Escape hides it. When the trigger is an element (a button, a link),
 * it gets `aria-describedby` pointing at the tooltip.
 */
export const Tooltip = ({
  content,
  children,
  position = 'top',
  variant = 'dark',
  intent,
  maxWidth = 'max-w-xs',
  shortcut,
  title,
  arrow = true,
  delay = 0,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: TooltipProps) => {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const isClient = useIsClient();
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Tooltip.open',
  });
  // The pointer and focus both show it: only a change reaches `onOpenChange`.
  const setOpen = (next: boolean) => {
    if (next !== open) setOpenState(next);
  };
  // Pointer over or focus inside, shown or still waiting for `delay`.
  const [engaged, setEngaged] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const show = () => {
    setEngaged(true);
    clearTimeout(timer.current);
    if (delay > 0) timer.current = setTimeout(() => setOpen(true), delay);
    else setOpen(true);
  };
  const hide = () => {
    setEngaged(false);
    clearTimeout(timer.current);
    setOpen(false);
  };

  // Escape hides it wherever focus is, even when it was opened by the pointer or
  // by the host (WCAG 1.4.13). Shown, it is an overlay of the stack: a modal
  // around it stays open, and an overlay opened above it closes first.
  useOverlayLayer(open, () => setOpenState(false));
  // Escape also cancels a show still waiting for `delay`.
  useEffect(() => {
    if (!engaged) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      clearTimeout(timer.current);
      setEngaged(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [engaged]);
  const {
    style: anchored,
    side,
    panelRef,
  } = useAnchorPosition(anchorRef, open, {
    side: position,
    align: 'center',
    offset: OFFSET,
  });
  const trigger = isValidElement<{ 'aria-describedby'?: string }>(children)
    ? cloneElement(children, {
        'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' '),
      })
    : children;
  return (
    // `inline-block w-fit` keeps the wrapper exactly the size of the children even
    // inside grid/flex parents, so the tooltip stays anchored on the trigger rather
    // than on the parent cell.
    <span
      ref={anchorRef}
      className="relative inline-block w-fit align-middle"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {trigger}
      {/* Portaled, so no `overflow: hidden` ancestor clips it, and kept mounted
          while hidden: `aria-describedby` points at it. Client-side only, as
          portals are. */}
      {isClient &&
        createPortal(
          <span
            ref={panelRef}
            id={id}
            role="tooltip"
            style={anchored ?? UNPLACED}
            className={clsx(
              'pointer-events-none fixed block w-max rounded-lg px-3 py-2 text-xs leading-relaxed font-normal whitespace-normal transition-opacity duration-150',
              TOOLTIP_Z,
              open ? 'opacity-100' : 'opacity-0',
              maxWidth,
              intent ? INTENT_BOX[intent] : VARIANT_BOX[variant]
            )}
          >
            {title && <span className="block font-semibold">{title}</span>}
            {title ? <span className="mt-0.5 block opacity-80">{content}</span> : content}
            {shortcut && (
              <span className="ml-2 inline-flex gap-0.5 align-middle">
                {/* Index keys: a shortcut can repeat a key, e.g. G G. */}
                {shortcut.map((key, i) => (
                  <Kbd key={i} size="sm">
                    {key}
                  </Kbd>
                ))}
              </span>
            )}
            {arrow && (
              <span
                aria-hidden
                className={clsx(
                  'absolute h-2 w-2 rotate-45',
                  ARROW_POS[side],
                  intent ? INTENT_ARROW[intent] : VARIANT_ARROW[variant]
                )}
              />
            )}
          </span>,
          document.body
        )}
    </span>
  );
};

export const TooltipHelp = ({
  text,
  position = 'top',
  variant = 'dark',
  intent,
}: {
  text: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  intent?: TooltipIntent;
}) => (
  <Tooltip
    content={text}
    position={position}
    variant={variant}
    intent={intent}
    maxWidth="max-w-[260px]"
  >
    {/* A button, so keyboard users can reach it and open the tooltip. */}
    <button
      type="button"
      aria-label="Help"
      className="focus-visible:focus-indicator inline-flex cursor-help rounded-full text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
    >
      <HelpCircle className="h-3.5 w-3.5" aria-hidden />
    </button>
  </Tooltip>
);
