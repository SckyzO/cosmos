import { clsx } from 'clsx';
import { AlertTriangle, Bell, BellOff, CheckCircle2, Info, XCircle } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationSeverity = 'crit' | 'warn' | 'info' | 'success';

const SEVERITY_META: Record<
  NotificationSeverity,
  { icon: ComponentType<{ className?: string }>; color: string; chipBg: string }
> = {
  crit: {
    icon: XCircle,
    color: 'text-red-500 dark:text-red-400',
    chipBg: 'bg-red-500/15 dark:bg-red-500/20',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-amber-500 dark:text-amber-400',
    chipBg: 'bg-amber-500/15 dark:bg-amber-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-500 dark:text-blue-400',
    chipBg: 'bg-blue-500/15 dark:bg-blue-500/20',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    chipBg: 'bg-green-500/15 dark:bg-green-500/20',
  },
};

const BADGE_BG: Record<NotificationSeverity, string> = {
  crit: 'bg-red-500',
  warn: 'bg-amber-500',
  info: 'bg-blue-500',
  success: 'bg-green-500',
};

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  triggerRect: DOMRect | null;
  refreshRect: () => void;
  align: 'left' | 'right';
};

const NotificationsPanelContext = createContext<Ctx | null>(null);

const useCtx = (): Ctx => {
  const ctx = useContext(NotificationsPanelContext);
  if (!ctx) throw new Error('NotificationsPanel.* must be used inside <NotificationsPanel>');
  return ctx;
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type NotificationsPanelProps = {
  /** Controlled open state. If omitted, the panel manages its own state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which side of the trigger the panel anchors to. Default `right`. */
  align?: 'left' | 'right';
  children: ReactNode;
};

const NotificationsPanelRoot = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  align = 'right',
  children,
}: NotificationsPanelProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const refreshRect = useCallback(() => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
  }, []);

  const setOpen = useCallback(
    (v: boolean) => {
      if (v) refreshRect();
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange, refreshRect]
  );

  // Refresh rect on resize/scroll while open
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

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  return (
    <NotificationsPanelContext.Provider
      value={{ open, setOpen, triggerRef, triggerRect, refreshRect, align }}
    >
      {children}
    </NotificationsPanelContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type NotificationsPanelTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children'
> & {
  /** Number to show in the badge. 0 hides the badge. Values > 9999 render as "9999+". */
  count?: number;
  /** When true, shows the BellOff icon and dims the badge ping animation. */
  muted?: boolean;
  /** When true, shows the ping animation around the badge. Default: count > 0 && !muted. */
  ping?: boolean;
};

const NotificationsPanelTrigger = forwardRef<HTMLButtonElement, NotificationsPanelTriggerProps>(
  function NotificationsPanelTrigger(
    { count = 0, muted = false, ping, className, ...rest },
    forwardedRef
  ) {
    const { open, setOpen, triggerRef, refreshRect } = useCtx();
    // Merge refs
    const setRef = (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };
    // If the panel starts open (defaultOpen / controlled open), the rect
    // must be computed once after the trigger button mounts; otherwise
    // <Content> stays null because triggerRect is still null.
    useEffect(() => {
      if (open) refreshRect();
      // We intentionally only react to mount + open transitions here.
    }, [open, refreshRect]);
    const showPing = ping ?? (count > 0 && !muted);
    const Icon = muted ? BellOff : Bell;
    const display = count > 9999 ? '9999+' : String(count);
    return (
      <button
        ref={setRef}
        type="button"
        aria-label={muted ? 'Notifications (muted)' : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={clsx(
          'relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
          muted
            ? 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
            : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
          className
        )}
        {...rest}
      >
        <Icon className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 flex min-w-[16px] items-center justify-center">
            {showPing && (
              <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400 opacity-25" />
            )}
            <span className="relative flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] leading-none font-bold text-white">
              {display}
            </span>
          </span>
        )}
      </button>
    );
  }
);

// ── Content (portal panel) ───────────────────────────────────────────────────

export type NotificationsPanelContentProps = {
  /** Tailwind width class. Default `w-96` (384px). */
  width?: string;
  className?: string;
  children: ReactNode;
};

const NotificationsPanelContent = ({
  width = 'w-96',
  className,
  children,
}: NotificationsPanelContentProps) => {
  const { open, setOpen, triggerRect, align } = useCtx();
  if (!open || !triggerRect) return null;

  const top = triggerRect.bottom + 8;
  const positionStyle =
    align === 'right'
      ? { top, right: window.innerWidth - triggerRect.right }
      : { top, left: triggerRect.left };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-label="Notifications"
        style={positionStyle}
        className={clsx(
          'fixed z-[9999] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900',
          width,
          className
        )}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

// ── Header ───────────────────────────────────────────────────────────────────

export type NotificationsPanelHeaderProps = {
  title: string;
  /** Right-side slot — pills, action buttons, etc. */
  children?: ReactNode;
  className?: string;
};

const NotificationsPanelHeader = ({
  title,
  children,
  className,
}: NotificationsPanelHeaderProps) => (
  <div
    className={clsx(
      'flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800',
      className
    )}
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
    {children && <div className="flex items-center gap-2">{children}</div>}
  </div>
);

// ── Counters (CRIT/WARN/INFO pills) ──────────────────────────────────────────

export type NotificationsPanelCountersProps = {
  crit?: number;
  warn?: number;
  info?: number;
};

const NotificationsPanelCounters = ({ crit, warn, info }: NotificationsPanelCountersProps) => (
  <>
    {crit !== undefined && crit > 0 && (
      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        {crit}
      </span>
    )}
    {warn !== undefined && warn > 0 && (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        {warn}
      </span>
    )}
    {info !== undefined && info > 0 && (
      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
        <Info className="h-3 w-3" />
        {info}
      </span>
    )}
  </>
);

// ── HeaderAction (mute / settings shortcut) ──────────────────────────────────

export type NotificationsPanelHeaderActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
};

const NotificationsPanelHeaderAction = forwardRef<
  HTMLButtonElement,
  NotificationsPanelHeaderActionProps
>(function NotificationsPanelHeaderAction({ icon: Icon, active, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300',
        className
      )}
      {...rest}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
});

// ── List ─────────────────────────────────────────────────────────────────────

export type NotificationsPanelListProps = {
  /** Optional max height. Default `max-h-96`. */
  maxHeight?: string;
  className?: string;
  children: ReactNode;
};

const NotificationsPanelList = ({
  maxHeight = 'max-h-96',
  className,
  children,
}: NotificationsPanelListProps) => (
  <div
    className={clsx(
      'divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800',
      maxHeight,
      className
    )}
  >
    {children}
  </div>
);

// ── Item ─────────────────────────────────────────────────────────────────────

export type NotificationsPanelItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  severity: NotificationSeverity;
  title: string;
  subtitle?: string;
  /** Small mono caption shown below the subtitle (e.g. check id, error code). */
  caption?: string;
  /** Right-side badge label. If omitted, derived from severity (CRIT/WARN/INFO/OK). */
  badgeLabel?: string;
  /** When true, the panel auto-closes after the item is clicked. Default true. */
  closeOnClick?: boolean;
};

const NotificationsPanelItem = forwardRef<HTMLButtonElement, NotificationsPanelItemProps>(
  function NotificationsPanelItem(
    {
      severity,
      title,
      subtitle,
      caption,
      badgeLabel,
      closeOnClick = true,
      onClick,
      className,
      ...rest
    },
    ref
  ) {
    const { setOpen } = useCtx();
    const meta = SEVERITY_META[severity];
    const Icon = meta.icon;
    const defaultLabel = severity === 'success' ? 'OK' : severity.toUpperCase();
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onClick?.(e);
          if (closeOnClick && !e.defaultPrevented) setOpen(false);
        }}
        className={clsx(
          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5',
          className
        )}
        {...rest}
      >
        <div
          className={clsx(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            meta.chipBg
          )}
        >
          <Icon className={clsx('h-4 w-4', meta.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {caption && (
            <p className="mt-0.5 truncate font-mono text-[10px] text-gray-400">{caption}</p>
          )}
        </div>
        <span
          className={clsx(
            'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white',
            BADGE_BG[severity]
          )}
        >
          {badgeLabel ?? defaultLabel}
        </span>
      </button>
    );
  }
);

// ── Empty ────────────────────────────────────────────────────────────────────

export type NotificationsPanelEmptyProps = {
  title?: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
};

const NotificationsPanelEmpty = ({
  title = 'No active alerts',
  subtitle = 'All systems nominal.',
  icon: Icon = Bell,
}: NotificationsPanelEmptyProps) => (
  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
    <Icon className="h-8 w-8 text-gray-300 dark:text-gray-700" />
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-xs text-gray-400 dark:text-gray-600">{subtitle}</p>
  </div>
);

// ── Footer ───────────────────────────────────────────────────────────────────

export type NotificationsPanelFooterProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** When true, the panel auto-closes after the footer is clicked. Default true. */
  closeOnClick?: boolean;
};

const NotificationsPanelFooter = ({
  children,
  closeOnClick = true,
  onClick,
  className,
  ...rest
}: NotificationsPanelFooterProps) => {
  const { setOpen } = useCtx();
  return (
    <div className="border-t border-gray-100 p-2 dark:border-gray-800">
      <button
        type="button"
        onClick={(e) => {
          onClick?.(e);
          if (closeOnClick && !e.defaultPrevented) setOpen(false);
        }}
        className={clsx(
          'text-brand-500 w-full rounded-lg py-2 text-center text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5',
          className
        )}
        {...rest}
      >
        {children}
      </button>
    </div>
  );
};

// ── Compound export ──────────────────────────────────────────────────────────

export const NotificationsPanel = Object.assign(NotificationsPanelRoot, {
  Trigger: NotificationsPanelTrigger,
  Content: NotificationsPanelContent,
  Header: NotificationsPanelHeader,
  Counters: NotificationsPanelCounters,
  HeaderAction: NotificationsPanelHeaderAction,
  List: NotificationsPanelList,
  Item: NotificationsPanelItem,
  Empty: NotificationsPanelEmpty,
  Footer: NotificationsPanelFooter,
});
