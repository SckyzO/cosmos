import { clsx } from 'clsx';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ElementType, KeyboardEvent, ReactNode } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useScrollFade } from '../hooks/useScrollFade';

export type TabsOrientation = 'horizontal' | 'vertical';

export type TabsVariant =
  /** Accent line under the active tab, on a thin line under the list. */
  | 'underline'
  /**
   * File-folder tabs. The active tab is raised and joins the panel, which is
   * drawn as a bordered surface; inactive tabs sit recessed behind it, on the
   * panel's edge. Works in both orientations.
   */
  | 'folder';

type TabsContextValue = {
  value: string;
  onChange: (value: string) => void;
  orientation: TabsOrientation;
  variant: TabsVariant;
  /** Prefix for the tab and panel ids that link them through ARIA. */
  baseId: string;
  /** The values that have a `Tabs.Panel` mounted, for a tab to point at its panel only if there is one. */
  panels: ReadonlySet<string>;
  /** Called by a `Tabs.Panel` while it is mounted; returns what unregisters it. */
  registerPanel: (value: string) => () => void;
  /** Id of the tab that is the tab stop while no tab is selected: the first enabled one. */
  fallbackTabId: string | null;
  setFallbackTabId: (id: string | null) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
};

// Tab values may hold characters an id reference can't (spaces split IDREF lists).
const tabId = (baseId: string, value: string) => `${baseId}-tab-${encodeURIComponent(value)}`;
const panelId = (baseId: string, value: string) => `${baseId}-panel-${encodeURIComponent(value)}`;

// ── Class maps (variant × orientation) ───────────────────────────────────────

const LIST_CLASSES: Record<TabsVariant, Record<TabsOrientation, string>> = {
  underline: {
    horizontal:
      'flex w-max min-w-full items-center gap-1 border-b border-gray-200 dark:border-gray-800',
    vertical: 'flex shrink-0 flex-col gap-1 border-r border-gray-200 dark:border-gray-800',
  },
  // The list's border is the panel's edge: it runs under the inactive tabs and
  // the active tab covers it.
  folder: {
    horizontal: 'flex w-max min-w-full items-end gap-1 border-b border-[var(--folder-border)]',
    vertical: 'flex shrink-0 flex-col gap-1 border-r border-[var(--folder-border)]',
  },
};

type TriggerClasses = {
  base: string;
  active: string;
  /** Structure of an inactive tab; its text colors come from `IDLE_TEXT` and `hover`. */
  inactive: string;
  /** Hover feedback of an inactive tab, left out of a disabled one. */
  hover: string;
};

const IDLE_TEXT = 'text-gray-500 dark:text-gray-400';
const IDLE_HOVER = 'hover:text-gray-700 dark:hover:text-gray-200';
// A disabled tab trades the idle colors for the theme's muted text, exclusively: no opacity on top,
// which left gray-500 too faint on light themes.
const DISABLED_TEXT = 'text-[var(--color-text-muted)]';

const TRIGGER_CLASSES: Record<TabsVariant, Record<TabsOrientation, TriggerClasses>> = {
  underline: {
    horizontal: {
      base: '-mb-px border-b-2 px-3 py-2',
      active: 'border-brand-500 text-brand-600 dark:text-brand-400',
      inactive: 'border-transparent',
      hover: IDLE_HOVER,
    },
    vertical: {
      base: '-mr-px justify-start rounded-l-lg border-r-2 px-3 py-2 text-left whitespace-nowrap',
      active:
        'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
      inactive: 'border-transparent',
      hover: 'hover:bg-gray-50 dark:hover:bg-white/5 ' + IDLE_HOVER,
    },
  },
  // Every tab overlaps the list's border by 1px. The active one has the
  // panel's background and a transparent edge on the panel side, so it covers
  // the line and opens into the panel; it is also 4px taller (wider when
  // vertical) than the inactive ones, which sit on the line with the page's
  // background. The padding moves with the size so the labels don't shift.
  folder: {
    horizontal: {
      base: '-mb-px rounded-t-lg border border-[var(--folder-border)] px-3 pb-2',
      active:
        'border-b-transparent bg-[var(--color-bg-panel)] pt-3 text-brand-600 dark:text-brand-400',
      inactive: 'bg-[var(--color-bg-base)] pt-2',
      hover: IDLE_HOVER,
    },
    vertical: {
      base: '-mr-px justify-start rounded-l-lg border border-[var(--folder-border)] py-2 pr-3 text-left whitespace-nowrap',
      active:
        'border-r-transparent bg-[var(--color-bg-panel)] pl-4 text-brand-600 dark:text-brand-400',
      inactive: 'ml-1 bg-[var(--color-bg-base)] pl-3',
      hover: IDLE_HOVER,
    },
  },
};

const PANEL_CLASSES: Record<TabsVariant, Record<TabsOrientation, string>> = {
  underline: { horizontal: 'pt-5', vertical: 'flex-1' },
  // Bordered on three sides: the list's border closes the side facing the tabs.
  folder: {
    horizontal:
      'rounded-b-xl border border-t-0 border-[var(--folder-border)] bg-[var(--color-bg-panel)] p-5',
    vertical:
      'flex-1 rounded-r-xl border border-l-0 border-[var(--folder-border)] bg-[var(--color-bg-panel)] p-5',
  },
};

export type TabsProps = {
  /** Active tab, when controlled. Pass this or `defaultValue`: with neither, no tab is active. */
  value?: string;
  /** First active tab, when uncontrolled. */
  defaultValue?: string;
  /** Called with the tab to activate. */
  onChange?: (value: string) => void;
  /** Layout direction. `horizontal` (default) puts the tab list on top; `vertical` puts it on the left. */
  orientation?: TabsOrientation;
  /**
   * Visual style. `underline` (default) marks the active tab with an accent
   * line. `folder` draws file-folder tabs attached to their panel, which then
   * gets its own border, background and padding.
   */
  variant?: TabsVariant;
  children: ReactNode;
  className?: string;
};

const Root = ({
  value: valueProp,
  defaultValue,
  onChange: onChangeProp,
  orientation: orientationProp = 'horizontal',
  variant = 'underline',
  children,
  className,
}: TabsProps) => {
  // A vertical list beside its panel leaves the panel a few words per line on a phone: below `sm`
  // it lays out as a horizontal strip above the panel, and behaves as one (arrow keys, ARIA).
  const wide = useMediaQuery('(min-width: 40rem)', true);
  const orientation = orientationProp === 'vertical' && !wide ? 'horizontal' : orientationProp;
  const baseId = useId();
  const [fallbackTabId, setFallbackTabId] = useState<string | null>(null);
  const [panels, setPanels] = useState<ReadonlySet<string>>(() => new Set());
  const registerPanel = useCallback((panelValue: string) => {
    setPanels((current) => new Set(current).add(panelValue));
    return () =>
      setPanels((current) => {
        const next = new Set(current);
        next.delete(panelValue);
        return next;
      });
  }, []);
  const [value = '', onChange] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onChangeProp,
    name: 'Tabs.value',
  });
  return (
    <TabsContext.Provider
      value={{
        value,
        onChange,
        orientation,
        variant,
        baseId,
        panels,
        registerPanel,
        fallbackTabId,
        setFallbackTabId,
      }}
    >
      <div
        className={clsx(
          // Folder tabs touch their panel, so no gap between list and panel.
          orientation === 'vertical' && (variant === 'folder' ? 'flex' : 'flex gap-6'),
          // The outline of folder tabs and panel, one step stronger in dark where the theme's
          // border fades into the surfaces.
          variant === 'folder' &&
            '[--folder-border:var(--color-border)] dark:[--folder-border:var(--color-gray-600)]',
          className
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const List = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { orientation, variant, setFallbackTabId } = useTabs();
  const listRef = useRef<HTMLDivElement>(null);
  // With no tab selected (a value that matches none), every tab would be out of the tab
  // sequence: the first enabled one takes the tab stop until one is selected.
  useLayoutEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector('[role="tab"][aria-selected="true"]');
    setFallbackTabId(
      selected
        ? null
        : (list?.querySelector<HTMLElement>('[role="tab"]:not(:disabled)')?.id ?? null)
    );
  });
  // WAI-ARIA APG tabs with automatic activation: the arrow keys of the list's
  // orientation move focus to the previous/next enabled tab (wrapping), Home
  // and End to the first/last, and the focused tab is selected.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const [prev, next] =
      orientation === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    if (![prev, next, 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')
    );
    const current = tabs.indexOf(event.target as HTMLButtonElement);
    if (current === -1) return;
    event.preventDefault();
    const last = tabs.length - 1;
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === next
            ? (current + 1) % tabs.length
            : (current - 1 + tabs.length) % tabs.length;
    tabs[target].focus();
    tabs[target].click();
  };
  const list = (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={onKeyDown}
      className={clsx(LIST_CLASSES[variant][orientation], className)}
    >
      {children}
    </div>
  );
  return orientation === 'vertical' ? list : <ScrollStrip>{list}</ScrollStrip>;
};

// The horizontal list scrolls instead of overflowing the page: the scrollbar is hidden, the active
// tab is brought into view when it changes, and an edge fades only on the side with more tabs.
const ScrollStrip = ({ children }: { children: ReactNode }) => {
  const { value } = useTabs();
  const ref = useRef<HTMLDivElement>(null);
  const fade = useScrollFade(ref);
  // Not on mount: scrolling the first tab into view could scroll the page to it.
  const shown = useRef(value);
  useEffect(() => {
    if (shown.current === value) return;
    shown.current = value;
    ref.current
      ?.querySelector('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);
  return (
    <div
      ref={ref}
      style={fade}
      className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
};

export type TabProps = {
  value: string;
  children: ReactNode;
  icon?: ElementType;
  badge?: ReactNode;
  disabled?: boolean;
  className?: string;
};

const Trigger = ({ value, children, icon: Icon, badge, disabled, className }: TabProps) => {
  const {
    value: active,
    onChange,
    orientation,
    variant,
    baseId,
    panels,
    fallbackTabId,
  } = useTabs();
  const isActive = value === active;
  const styles = TRIGGER_CLASSES[variant][orientation];
  return (
    <button
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={isActive}
      // Only the selected panel is rendered, and a set of tabs may have no panels at all
      // (navigation tabs): point at the panel from its own tab, and only if it exists.
      aria-controls={isActive && panels.has(value) ? panelId(baseId, value) : undefined}
      tabIndex={isActive || fallbackTabId === tabId(baseId, value) ? 0 : -1}
      disabled={disabled}
      onClick={() => onChange(value)}
      className={clsx(
        'focus-visible:focus-indicator flex shrink-0 items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-inset disabled:cursor-not-allowed',
        styles.base,
        isActive
          ? styles.active
          : [styles.inactive, disabled ? DISABLED_TEXT : [IDLE_TEXT, styles.hover]],
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      {badge !== undefined && (
        <span
          className={clsx(
            'text-3xs ms-auto rounded-full px-1.5 py-0.5 font-bold',
            isActive
              ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

const Panel = ({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) => {
  const { value: active, orientation, variant, baseId, registerPanel } = useTabs();
  // Registered while mounted, active or not, and before paint: a tab never shows without its link.
  useLayoutEffect(() => registerPanel(value), [registerPanel, value]);
  if (value !== active) return null;
  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      tabIndex={0}
      className={clsx(
        'focus-visible:focus-indicator focus-visible:ring-inset',
        PANEL_CLASSES[variant][orientation],
        className
      )}
    >
      {children}
    </div>
  );
};

export const Tabs = Object.assign(Root, { List, Trigger, Panel });
