import { clsx } from 'clsx';
import {
  createContext,
  useContext,
  useRef,
  type CSSProperties,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
import { FloatingPanel } from './FloatingPanel';
import type { Direction } from '../hooks/direction';
import type { AnchorSide } from '../hooks/useAnchorPosition';
import { mergeRefs } from './mergeRefs';
import { useControllableState } from '../hooks/useControllableState';

/** `start` and `end` are the sides of the line: `end` is the right of the trigger, its left under `dir="rtl"`. */
export type PopoverPosition = 'top' | 'bottom' | 'start' | 'end';
/** Alignment with the trigger along the line, for `top` / `bottom` positions. */
export type PopoverAlign = 'center' | 'end';

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const PopoverContext = createContext<Ctx | null>(null);
const useCtx = (): Ctx => {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover.* must be used inside <Popover>');
  return ctx;
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

const PopoverRoot = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: PopoverProps) => {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Popover.open',
  });
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type PopoverTriggerProps = ComponentPropsWithRef<'button'>;

function PopoverTrigger({ onClick, className, children, ref, ...rest }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = useCtx();
  return (
    <button
      ref={mergeRefs(triggerRef, ref)}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      className={clsx('focus-visible:focus-indicator', className)}
      onClick={(e) => {
        onClick?.(e);
        setOpen(!open);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Content (portal) ─────────────────────────────────────────────────────────

// `position` is the side the panel opened on as the screen sees it (it may have flipped), so the
// arrow is placed with physical offsets: `left` / `right` below name that side, and the `left` of
// a centered arrow is measured from the physical edge `--anchor-shift` moves the panel along.
const arrowStyle = (
  position: AnchorSide,
  align: PopoverAlign,
  direction: Direction
): CSSProperties => {
  // 8px square rotated 45° → diamond, clipped half by the content panel.
  const base: CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    transform: 'rotate(45deg)',
  };
  // With `end`, keep pointing at the trigger's center, not the panel's: half the
  // trigger's width (`--anchor-width`, set by the anchoring) from the end edge, and
  // the inset is measured from the panel's padding box, 1px inside its border. A
  // panel moved along the trigger to stay on screen sets `--anchor-shift`, by how
  // much (to the right if positive): the arrow moves back by as much, which is away
  // from the end edge in ltr and toward it in rtl.
  const x: CSSProperties =
    align === 'end'
      ? {
          insetInlineEnd: `calc(var(--anchor-width) / 2 - 1px ${direction === 'rtl' ? '-' : '+'} var(--anchor-shift, 0px))`,
          marginInlineEnd: -4,
        }
      : { left: 'calc(50% - var(--anchor-shift, 0px))', marginLeft: -4 };
  const y: CSSProperties = { top: 'calc(50% - var(--anchor-shift, 0px))', marginTop: -4 };
  switch (position) {
    case 'top':
      return { ...base, bottom: -4, ...x };
    case 'right':
      return { ...base, left: -4, ...y };
    case 'left':
      return { ...base, right: -4, ...y };
    case 'bottom':
    default:
      return { ...base, top: -4, ...x };
  }
};

export type PopoverContentProps = {
  /** Side of the trigger the panel opens on. `start` / `end` follow the reading direction. Default `bottom`. */
  position?: PopoverPosition;
  /**
   * Alignment with the trigger along the line for `top` / `bottom`: `center`
   * (default) or `end`, flush with the trigger's end edge (its right edge, its
   * left under `dir="rtl"`) — for triggers near the end of the line. `end` also
   * caps the width so the panel keeps 16px from the other side of the screen.
   * Ignored for `start` / `end` positions.
   */
  align?: PopoverAlign;
  /** Accessible name of the dialog. Name it with this or `aria-labelledby`: a dialog needs a name. */
  'aria-label'?: string;
  /** Id of an element inside the panel, a heading say, that names the dialog, instead of `aria-label`. */
  'aria-labelledby'?: string;
  /** Distance from the trigger edge in px. Default 8. */
  offset?: number;
  /** Show a small arrow pointing to the trigger. Default false. */
  arrow?: boolean;
  /** Tailwind width class. Default `w-64`. */
  width?: string;
  /** Tailwind padding class. Default `p-4`. */
  padding?: string;
  className?: string;
  children: ReactNode;
};

const PopoverContent = ({
  position = 'bottom',
  align = 'center',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  offset = 8,
  arrow = false,
  width = 'w-64',
  padding = 'p-4',
  className,
  children,
}: PopoverContentProps) => {
  const { open, setOpen, triggerRef } = useCtx();
  return (
    <FloatingPanel
      open={open}
      onClose={() => setOpen(false)}
      triggerRef={triggerRef}
      placement={{ side: position, align, offset }}
      role="dialog"
      tabIndex={-1}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={clsx(
        'rounded-xl border border-gray-200 bg-white text-sm shadow-xl outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
        width,
        padding,
        className
      )}
    >
      {(side, direction) => (
        <>
          {arrow && (
            <span
              aria-hidden
              style={arrowStyle(side, align, direction)}
              className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            />
          )}
          <div className="relative">{children}</div>
        </>
      )}
    </FloatingPanel>
  );
};

// ── Compound export ──────────────────────────────────────────────────────────

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});
