import { clsx } from 'clsx';
import { createContext, useContext } from 'react';
import type { ElementType, ReactNode } from 'react';

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
};

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
};

// ── Class maps (variant × orientation) ───────────────────────────────────────

const LIST_CLASSES: Record<TabsVariant, Record<TabsOrientation, string>> = {
  underline: {
    horizontal: 'flex items-center gap-1 border-b border-gray-200 dark:border-gray-800',
    vertical: 'flex shrink-0 flex-col gap-1 border-r border-gray-200 dark:border-gray-800',
  },
  // The list's border is the panel's edge: it runs under the inactive tabs and
  // the active tab covers it.
  folder: {
    horizontal: 'flex items-end gap-1 border-b border-[var(--color-border)]',
    vertical: 'flex shrink-0 flex-col gap-1 border-r border-[var(--color-border)]',
  },
};

type TriggerClasses = { base: string; active: string; inactive: string };

const TRIGGER_CLASSES: Record<TabsVariant, Record<TabsOrientation, TriggerClasses>> = {
  underline: {
    horizontal: {
      base: '-mb-px border-b-2 px-3 py-2',
      active: 'border-brand-500 text-brand-600 dark:text-brand-400',
      inactive:
        'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
    },
    vertical: {
      base: '-mr-px justify-start rounded-l-lg border-r-2 px-3 py-2 text-left whitespace-nowrap',
      active:
        'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
      inactive:
        'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
    },
  },
  // Every tab overlaps the list's border by 1px. The active one has the
  // panel's background and a transparent edge on the panel side, so it covers
  // the line and opens into the panel; it is also 4px taller (wider when
  // vertical) than the inactive ones, which sit on the line with the page's
  // background. The padding moves with the size so the labels don't shift.
  folder: {
    horizontal: {
      base: '-mb-px rounded-t-lg border border-[var(--color-border)] px-3 pb-2',
      active:
        'border-b-transparent bg-[var(--color-bg-panel)] pt-3 text-brand-600 dark:text-brand-400',
      inactive:
        'bg-[var(--color-bg-base)] pt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
    },
    vertical: {
      base: '-mr-px justify-start rounded-l-lg border border-[var(--color-border)] py-2 pr-3 text-left whitespace-nowrap',
      active:
        'border-r-transparent bg-[var(--color-bg-panel)] pl-4 text-brand-600 dark:text-brand-400',
      inactive:
        'ml-1 bg-[var(--color-bg-base)] pl-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
    },
  },
};

const PANEL_CLASSES: Record<TabsVariant, Record<TabsOrientation, string>> = {
  underline: { horizontal: 'pt-5', vertical: 'flex-1' },
  // Bordered on three sides: the list's border closes the side facing the tabs.
  folder: {
    horizontal:
      'rounded-b-xl border border-t-0 border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5',
    vertical:
      'flex-1 rounded-r-xl border border-l-0 border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5',
  },
};

export type TabsProps = {
  value: string;
  onChange: (value: string) => void;
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
  value,
  onChange,
  orientation = 'horizontal',
  variant = 'underline',
  children,
  className,
}: TabsProps) => (
  <TabsContext.Provider value={{ value, onChange, orientation, variant }}>
    <div
      className={clsx(
        // Folder tabs touch their panel, so no gap between list and panel.
        orientation === 'vertical' && (variant === 'folder' ? 'flex' : 'flex gap-6'),
        className
      )}
    >
      {children}
    </div>
  </TabsContext.Provider>
);

const List = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { orientation, variant } = useTabs();
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={clsx(LIST_CLASSES[variant][orientation], className)}
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
  const { value: active, onChange, orientation, variant } = useTabs();
  const isActive = value === active;
  const styles = TRIGGER_CLASSES[variant][orientation];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onChange(value)}
      className={clsx(
        'flex items-center gap-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        styles.base,
        isActive ? styles.active : styles.inactive,
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
  const { value: active, orientation, variant } = useTabs();
  if (value !== active) return null;
  return (
    <div role="tabpanel" className={clsx(PANEL_CLASSES[variant][orientation], className)}>
      {children}
    </div>
  );
};

export const Tabs = Object.assign(Root, { List, Trigger, Panel });
