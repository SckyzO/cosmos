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
import { mergeRefs } from './mergeRefs';
import { useControllableState } from '../hooks/useControllableState';

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
/** Horizontal alignment with the trigger, for `top` / `bottom` positions. */
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

const arrowStyle = (position: PopoverPosition, align: PopoverAlign): CSSProperties => {
  // 8px square rotated 45° → diamond, clipped half by the content panel.
  const base: CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    transform: 'rotate(45deg)',
  };
  // With `end`, keep pointing at the trigger's center, not the panel's: half the
  // trigger's width (`--anchor-width`, set by the anchoring) from the right, and
  // `right` is measured from the panel's padding box, 1px inside its border. A
  // panel moved along the trigger to stay on screen sets `--anchor-shift`, by how
  // much: the arrow moves back by as much.
  const x: CSSProperties =
    align === 'end'
      ? {
          right: 'calc(var(--anchor-width) / 2 - 1px + var(--anchor-shift, 0px))',
          marginRight: -4,
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
  position?: PopoverPosition;
  /**
   * Horizontal alignment with the trigger for `top` / `bottom`: `center`
   * (default) or `end`, flush with its right edge — for triggers near the
   * right of the screen. `end` also caps the width so the panel keeps 16px
   * from the left of the screen. Ignored for `left` / `right`.
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
      {(side) => (
        <>
          {arrow && (
            <span
              aria-hidden
              style={arrowStyle(side, align)}
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
