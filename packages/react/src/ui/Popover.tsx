import { clsx } from 'clsx';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePortalFocus } from './overlayA11y';
import { mergeRefs } from './mergeRefs';

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
/** Horizontal alignment with the trigger, for `top` / `bottom` positions. */
export type PopoverAlign = 'center' | 'end';

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  triggerRect: DOMRect | null;
  refreshRect: () => void;
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
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const refreshRect = useCallback(() => {
    if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect());
  }, []);

  const setOpen = useCallback(
    (v: boolean) => {
      if (v) refreshRect();
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange, refreshRect]
  );

  useEffect(() => {
    if (!open) return;
    const handler = () => refreshRect();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    // The trigger can change size while open (web font swap, new label or
    // padding), which would leave the panel and its arrow aligned to a stale
    // rect. border-box: the default content box misses padding changes.
    const observer = new ResizeObserver(handler);
    if (triggerRef.current) observer.observe(triggerRef.current, { box: 'border-box' });
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
      observer.disconnect();
    };
  }, [open, refreshRect]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, triggerRect, refreshRect }}>
      {children}
    </PopoverContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type PopoverTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverTrigger(
  { onClick, children, ...rest },
  forwardedRef
) {
  const { open, setOpen, triggerRef, refreshRect } = useCtx();
  useEffect(() => {
    if (open) refreshRect();
  }, [open, refreshRect]);
  return (
    <button
      ref={mergeRefs(triggerRef, forwardedRef)}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(e) => {
        onClick?.(e);
        setOpen(!open);
      }}
      {...rest}
    >
      {children}
    </button>
  );
});

// ── Content (portal) ─────────────────────────────────────────────────────────

// Smallest gap kept between an `end`-aligned panel and the left of the screen.
const VIEWPORT_MARGIN = 16;

const positionStyle = (
  position: PopoverPosition,
  align: PopoverAlign,
  rect: DOMRect,
  offset: number
): CSSProperties => {
  // `end`: the panel's right edge sits exactly on the trigger's right edge, and
  // its width is capped so it keeps a margin from the left of the screen.
  const left = align === 'end' ? rect.right : rect.left + rect.width / 2;
  const shiftX = align === 'end' ? '-100%' : '-50%';
  const maxWidth = align === 'end' ? rect.right - VIEWPORT_MARGIN : undefined;
  switch (position) {
    case 'top':
      return {
        top: rect.top - offset,
        left,
        maxWidth,
        transform: `translate(${shiftX}, -100%)`,
      };
    case 'right':
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + offset,
        transform: 'translateY(-50%)',
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - offset,
        transform: 'translate(-100%, -50%)',
      };
    case 'bottom':
    default:
      return {
        top: rect.bottom + offset,
        left,
        maxWidth,
        transform: `translateX(${shiftX})`,
      };
  }
};

const arrowStyle = (
  position: PopoverPosition,
  align: PopoverAlign,
  rect: DOMRect
): CSSProperties => {
  // 8px square rotated 45° → diamond, clipped half by the content panel.
  const base: CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    transform: 'rotate(45deg)',
  };
  // With `end`, keep pointing at the trigger's center, not the panel's. `right`
  // is measured from the panel's padding box, 1px inside its border.
  const x: CSSProperties =
    align === 'end'
      ? { right: rect.width / 2 - 1, marginRight: -4 }
      : { left: '50%', marginLeft: -4 };
  switch (position) {
    case 'top':
      return { ...base, bottom: -4, ...x };
    case 'right':
      return { ...base, left: -4, top: '50%', marginTop: -4 };
    case 'left':
      return { ...base, right: -4, top: '50%', marginTop: -4 };
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
  /** Accessible name of the dialog. */
  'aria-label'?: string;
  /** Distance from the trigger edge in px. Default 8. */
  offset?: number;
  /** Show a small arrow pointing to the trigger. Default false. */
  arrow?: boolean;
  /** Tailwind width class. Default `w-64`. */
  width?: string;
  className?: string;
  children: ReactNode;
};

const PopoverContent = ({
  position = 'bottom',
  align = 'center',
  'aria-label': ariaLabel,
  offset = 8,
  arrow = false,
  width = 'w-64',
  className,
  children,
}: PopoverContentProps) => {
  const { open, setOpen, triggerRef, triggerRect } = useCtx();
  const panelRef = usePortalFocus<HTMLDivElement>({
    open,
    onClose: () => setOpen(false),
    triggerRef,
  });
  if (!open || !triggerRect) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        aria-label={ariaLabel}
        style={positionStyle(position, align, triggerRect, offset)}
        className={clsx(
          'fixed z-[9999] rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-xl outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
          width,
          className
        )}
      >
        {arrow && (
          <span
            aria-hidden
            style={arrowStyle(position, align, triggerRect)}
            className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </>,
    document.body
  );
};

// ── Compound export ──────────────────────────────────────────────────────────

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});
