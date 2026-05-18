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

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

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
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [open, refreshRect]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

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
  const setRef = (node: HTMLButtonElement | null) => {
    (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };
  useEffect(() => {
    if (open) refreshRect();
  }, [open, refreshRect]);
  return (
    <button
      ref={setRef}
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

const positionStyle = (position: PopoverPosition, rect: DOMRect, offset: number): CSSProperties => {
  switch (position) {
    case 'top':
      return {
        top: rect.top - offset,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
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
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      };
  }
};

const arrowStyle = (position: PopoverPosition): CSSProperties => {
  // 8px square rotated 45° → diamond, clipped half by the content panel.
  const base: CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    transform: 'rotate(45deg)',
  };
  switch (position) {
    case 'top':
      return { ...base, bottom: -4, left: '50%', marginLeft: -4 };
    case 'right':
      return { ...base, left: -4, top: '50%', marginTop: -4 };
    case 'left':
      return { ...base, right: -4, top: '50%', marginTop: -4 };
    case 'bottom':
    default:
      return { ...base, top: -4, left: '50%', marginLeft: -4 };
  }
};

export type PopoverContentProps = {
  position?: PopoverPosition;
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
  offset = 8,
  arrow = false,
  width = 'w-64',
  className,
  children,
}: PopoverContentProps) => {
  const { open, setOpen, triggerRect } = useCtx();
  if (!open || !triggerRect) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        style={positionStyle(position, triggerRect, offset)}
        className={clsx(
          'fixed z-[9999] rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
          width,
          className
        )}
      >
        {arrow && (
          <span
            aria-hidden
            style={arrowStyle(position)}
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
