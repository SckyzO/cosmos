import { clsx } from 'clsx';
import { AlertTriangle, Bell, BellOff, CheckCircle2, Info, XCircle } from 'lucide-react';
import {
  createContext,
  useContext,
  useRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
import { Badge } from './Badge';
import { FloatingPanel } from './FloatingPanel';
import type { Intent } from './intent';
import { mergeRefs } from './mergeRefs';
import { useControllableState } from '../hooks/useControllableState';

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationsPanelIntent = Extract<Intent, 'danger' | 'warning' | 'info' | 'success'>;

const INTENT_META: Record<
  NotificationsPanelIntent,
  { icon: ComponentType<{ className?: string }>; color: string; chipBg: string }
> = {
  danger: {
    icon: XCircle,
    color: 'text-red-500 dark:text-red-400',
    chipBg: 'bg-red-500/15 dark:bg-red-500/20',
  },
  warning: {
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

// Monitoring vocabulary on the badge: the label is data-facing, the prop is not.
const BADGE_LABEL: Record<NotificationsPanelIntent, string> = {
  danger: 'CRIT',
  warning: 'WARN',
  info: 'INFO',
  success: 'OK',
};

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  align: 'start' | 'end';
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
  /** Edge of the trigger the panel lines up with: where the text starts or ends. Default `end`. */
  align?: 'start' | 'end';
  children: ReactNode;
};

const NotificationsPanelRoot = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  align = 'end',
  children,
}: NotificationsPanelProps) => {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'NotificationsPanel.open',
  });
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <NotificationsPanelContext.Provider value={{ open, setOpen, triggerRef, align }}>
      {children}
    </NotificationsPanelContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type NotificationsPanelTriggerProps = Omit<
  ComponentPropsWithRef<'button'>,
  'onClick' | 'children'
> & {
  /** Number to show in the badge. 0 hides the badge. Values > 9999 render as "9999+". */
  count?: number;
  /** When true, shows the BellOff icon and dims the badge ping animation. */
  muted?: boolean;
  /** When true, shows the ping animation around the badge. Default: count > 0 && !muted. */
  ping?: boolean;
};

function NotificationsPanelTrigger({
  count = 0,
  muted = false,
  ping,
  className,
  ref,
  ...rest
}: NotificationsPanelTriggerProps) {
  const { open, setOpen, triggerRef } = useCtx();
  const showPing = ping ?? (count > 0 && !muted);
  const Icon = muted ? BellOff : Bell;
  const display = count > 9999 ? '9999+' : String(count);
  return (
    <button
      ref={mergeRefs(triggerRef, ref)}
      type="button"
      // The badge is visible text, so the name has to contain it (`label-content-name-mismatch`).
      aria-label={`${muted ? 'Notifications (muted)' : 'Notifications'}${count > 0 ? `, ${display}` : ''}`}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={clsx(
        // The ping around the count grows to twice its size: clipped to the bell, it never widens
        // the row that holds it. The focus ring is a shadow, outside the clip.
        'focus-visible:focus-indicator h-ctrl-40 w-ctrl-40 relative flex items-center justify-center overflow-hidden rounded-lg border transition-colors',
        muted
          ? 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
          : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
        className
      )}
      {...rest}
    >
      <Icon className="h-5 w-5" />
      {count > 0 && (
        <span className="inset-e-0.5 absolute top-0.5 flex min-w-[16px] items-center justify-center">
          {showPing && (
            <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400 opacity-25" />
          )}
          <span className="relative flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] leading-none font-bold text-white">
            <bdi>{display}</bdi>
          </span>
        </span>
      )}
    </button>
  );
}

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
  const { open, setOpen, triggerRef, align } = useCtx();
  return (
    <FloatingPanel
      open={open}
      onClose={() => setOpen(false)}
      triggerRef={triggerRef}
      placement={{ side: 'bottom', align, offset: 8 }}
      role="dialog"
      tabIndex={-1}
      aria-label="Notifications"
      className={clsx(
        'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl outline-none dark:border-gray-700 dark:bg-gray-900',
        width,
        className
      )}
    >
      {children}
    </FloatingPanel>
  );
};

// ── Header ───────────────────────────────────────────────────────────────────

export type NotificationsPanelHeaderProps = {
  title: string;
  /**
   * Shows a "Mark all as read" button in the header, which calls this. The button is not
   * rendered without it, and the panel stays open: the host clears its `unread` items.
   */
  onMarkAllRead?: () => void;
  /** Slot at the end of the line — pills, action buttons, etc. */
  children?: ReactNode;
  className?: string;
};

const NotificationsPanelHeader = ({
  title,
  onMarkAllRead,
  children,
  className,
}: NotificationsPanelHeaderProps) => (
  <div
    className={clsx(
      'flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800',
      className
    )}
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
      <bdi>{title}</bdi>
    </h3>
    {(onMarkAllRead || children) && (
      <div className="flex items-center gap-2">
        {onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-brand-600 dark:text-brand-400 focus-visible:focus-indicator rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
          >
            Mark all as read
          </button>
        )}
        {children}
      </div>
    )}
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
      <Badge intent="danger" icon={XCircle}>
        {crit}
      </Badge>
    )}
    {warn !== undefined && warn > 0 && (
      <Badge intent="warning" icon={AlertTriangle}>
        {warn}
      </Badge>
    )}
    {info !== undefined && info > 0 && (
      <Badge intent="info" icon={Info}>
        {info}
      </Badge>
    )}
  </>
);

// ── HeaderAction (mute / settings shortcut) ──────────────────────────────────

export type NotificationsPanelHeaderActionProps = ComponentPropsWithRef<'button'> & {
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
};

function NotificationsPanelHeaderAction({
  icon: Icon,
  active,
  className,
  ref,
  ...rest
}: NotificationsPanelHeaderActionProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        'focus-visible:focus-indicator h-ctrl-28 w-ctrl-28 flex items-center justify-center rounded-lg transition-colors',
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
}

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

export type NotificationsPanelItemProps = ComponentPropsWithRef<'button'> & {
  /** Color and icon of the item. */
  intent: NotificationsPanelIntent;
  title: string;
  subtitle?: string;
  /** Small mono caption shown below the subtitle (e.g. check id, error code). */
  caption?: string;
  /** When the notification happened, as a line under the text (e.g. "2 min ago"). */
  time?: ReactNode;
  /** Not read yet: a dot before the title and a tinted row. Default false. */
  unread?: boolean;
  /** Badge label at the end of the item. If omitted, derived from `intent` (CRIT/WARN/INFO/OK). */
  badgeLabel?: string;
  /** When true, the panel auto-closes after the item is clicked. Default true. */
  closeOnClick?: boolean;
};

function NotificationsPanelItem({
  intent,
  title,
  subtitle,
  caption,
  time,
  unread = false,
  badgeLabel,
  closeOnClick = true,
  onClick,
  className,
  ref,
  ...rest
}: NotificationsPanelItemProps) {
  const { setOpen } = useCtx();
  const meta = INTENT_META[intent];
  const Icon = meta.icon;
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClick?.(e);
        if (closeOnClick && !e.defaultPrevented) setOpen(false);
      }}
      className={clsx(
        'focus-visible:focus-indicator py-row-12 flex w-full items-start gap-3 px-4 text-start transition-colors focus-visible:ring-inset',
        unread
          ? 'bg-brand-50/60 hover:bg-brand-50 dark:bg-brand-500/10 dark:hover:bg-brand-500/15'
          : 'hover:bg-gray-50 dark:hover:bg-white/5',
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
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          {unread && (
            <>
              <span aria-hidden className="bg-brand-500 h-2 w-2 shrink-0 rounded-full" />
              <span className="sr-only">Unread: </span>
            </>
          )}
          <span className="min-w-0 truncate">
            <bdi>{title}</bdi>
          </span>
        </p>
        {subtitle && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            <bdi>{subtitle}</bdi>
          </p>
        )}
        {caption && (
          <p className="text-3xs mt-0.5 truncate font-mono text-gray-500 dark:text-gray-400">
            <bdi>{caption}</bdi>
          </p>
        )}
        {time && (
          <p className="text-3xs mt-1 text-gray-500 dark:text-gray-400">
            <bdi>{time}</bdi>
          </p>
        )}
      </div>
      <Badge appearance="solid" intent={intent} size="sm" className="mt-0.5 shrink-0">
        {badgeLabel ?? BADGE_LABEL[intent]}
      </Badge>
    </button>
  );
}

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
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      <bdi>{title}</bdi>
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      <bdi>{subtitle}</bdi>
    </p>
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
          'text-brand-600 dark:text-brand-400 focus-visible:focus-indicator py-row-8 w-full rounded-lg text-center text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5',
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
