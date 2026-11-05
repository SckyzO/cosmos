import { clsx } from 'clsx';
import { AlertTriangle, Bell, BellOff, Info, XCircle } from 'lucide-react';
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
import { mergeRefs } from './mergeRefs';
import {
  NotificationRow,
  type NotificationRowIntent,
  type NotificationRowProps,
} from './NotificationRow';
import { useControllableState } from '../hooks/useControllableState';
import { useLabels } from '../labels/labelsContext';
import { NOTIFICATIONS_PANEL_LABELS, type NotificationsPanelLabels } from './labels';

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationsPanelIntent = NotificationRowIntent;

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  align: 'start' | 'end';
  /** What the root's `labels` prop gave. */
  labels: Partial<NotificationsPanelLabels> | undefined;
};

const NotificationsPanelContext = createContext<Ctx | null>(null);

// For the parts that may stand outside a panel (`Header`, `Empty`): the root's labels, if any.
const useOwnLabels = () => useContext(NotificationsPanelContext)?.labels;

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
  /**
   * The texts its parts write (the trigger's name, "Mark all as read", the empty state), over
   * `LabelsProvider`'s `notificationsPanel` and the English defaults.
   */
  labels?: Partial<NotificationsPanelLabels>;
  children: ReactNode;
};

const NotificationsPanelRoot = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  align = 'end',
  labels,
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
    <NotificationsPanelContext.Provider value={{ open, setOpen, triggerRef, align, labels }}>
      {children}
    </NotificationsPanelContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────────────────────────────────────

export type NotificationsPanelTriggerProps = Omit<
  ComponentPropsWithRef<'button'>,
  'onClick' | 'children'
> & {
  /**
   * Number to show in the badge. 0 hides the badge. Values > 9999 render as "9999+". Up to two
   * characters the badge sits in the corner of the bell; from three it sits beside it, and the
   * button is wider.
   */
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
  const { open, setOpen, triggerRef, labels: ownLabels } = useCtx();
  const labels = useLabels('notificationsPanel', NOTIFICATIONS_PANEL_LABELS, ownLabels);
  const showPing = ping ?? (count > 0 && !muted);
  const Icon = muted ? BellOff : Bell;
  const display = count > 9999 ? '9999+' : String(count);
  // From three characters the count would cover the bell in the corner: it sits beside it.
  const wide = display.length > 2;
  return (
    <button
      ref={mergeRefs(triggerRef, ref)}
      type="button"
      // The badge is visible text, so the name has to contain it (`label-content-name-mismatch`).
      aria-label={labels.trigger(count > 0 ? display : '', muted)}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={clsx(
        // The ping around the count grows to twice its size: clipped to the bell, it never widens
        // the row that holds it. The focus ring is a shadow, outside the clip.
        'focus-visible:focus-indicator h-ctrl-40 relative flex items-center justify-center overflow-hidden rounded-lg border transition-colors',
        count > 0 && wide ? 'min-w-ctrl-40 gap-1 px-2' : 'w-ctrl-40',
        muted
          ? 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
          : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
        className
      )}
      {...rest}
    >
      <Icon className="h-5 w-5" />
      {count > 0 && (
        <span
          className={clsx(
            'flex min-w-[16px] items-center justify-center',
            wide ? 'relative' : 'inset-e-0.5 absolute top-0.5'
          )}
        >
          {showPing && (
            <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400 opacity-25 motion-reduce:animate-none" />
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
  const { open, setOpen, triggerRef, align, labels: ownLabels } = useCtx();
  const labels = useLabels('notificationsPanel', NOTIFICATIONS_PANEL_LABELS, ownLabels);
  return (
    <FloatingPanel
      open={open}
      onClose={() => setOpen(false)}
      triggerRef={triggerRef}
      placement={{ side: 'bottom', align, offset: 8 }}
      role="dialog"
      tabIndex={-1}
      aria-label={labels.panel}
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
}: NotificationsPanelHeaderProps) => {
  const labels = useLabels('notificationsPanel', NOTIFICATIONS_PANEL_LABELS, useOwnLabels());
  return (
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
              onClick={() => onMarkAllRead()}
              className="text-brand-600 dark:text-brand-400 focus-visible:focus-indicator rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            >
              {labels.markAllRead}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

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

export type NotificationsPanelItemProps = NotificationRowProps & {
  /** When true, the panel auto-closes after the item is clicked. Default true. */
  closeOnClick?: boolean;
};

/**
 * A `NotificationRow` in the panel: it closes the panel when its button is clicked (`closeOnClick`),
 * and nothing else. Its `actions` do not close it.
 */
function NotificationsPanelItem({
  closeOnClick = true,
  onClick,
  ...rest
}: NotificationsPanelItemProps) {
  const { setOpen } = useCtx();
  return (
    <NotificationRow
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (closeOnClick && !e.defaultPrevented) setOpen(false);
      }}
    />
  );
}

// ── Empty ────────────────────────────────────────────────────────────────────

export type NotificationsPanelEmptyProps = {
  /** Default `labels.emptyTitle`, 'No active alerts'. */
  title?: string;
  /** Default `labels.emptySubtitle`, 'All systems nominal.'. */
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
};

const NotificationsPanelEmpty = ({
  title,
  subtitle,
  icon: Icon = Bell,
}: NotificationsPanelEmptyProps) => {
  const labels = useLabels('notificationsPanel', NOTIFICATIONS_PANEL_LABELS, useOwnLabels());
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <Icon className="h-8 w-8 text-gray-300 dark:text-gray-700" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        <bdi>{title ?? labels.emptyTitle}</bdi>
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        <bdi>{subtitle ?? labels.emptySubtitle}</bdi>
      </p>
    </div>
  );
};

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
