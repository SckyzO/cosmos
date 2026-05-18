import { clsx } from 'clsx';
import { createContext, useContext } from 'react';
import type { ElementType, ReactNode } from 'react';

export type TabsOrientation = 'horizontal' | 'vertical';

type TabsContextValue = {
  value: string;
  onChange: (value: string) => void;
  orientation: TabsOrientation;
};

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
};

export type TabsProps = {
  value: string;
  onChange: (value: string) => void;
  /** Layout direction. `horizontal` (default) puts the tab list on top; `vertical` puts it on the left. */
  orientation?: TabsOrientation;
  children: ReactNode;
  className?: string;
};

const Root = ({ value, onChange, orientation = 'horizontal', children, className }: TabsProps) => (
  <TabsContext.Provider value={{ value, onChange, orientation }}>
    <div className={clsx(orientation === 'vertical' ? 'flex gap-6' : '', className)}>
      {children}
    </div>
  </TabsContext.Provider>
);

const List = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { orientation } = useTabs();
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={clsx(
        orientation === 'vertical'
          ? 'flex shrink-0 flex-col gap-1 border-r border-gray-200 dark:border-gray-800'
          : 'flex items-center gap-1 border-b border-gray-200 dark:border-gray-800',
        className
      )}
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
  const { value: active, onChange, orientation } = useTabs();
  const isActive = value === active;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onChange(value)}
      className={clsx(
        'flex items-center gap-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        orientation === 'vertical'
          ? clsx(
              '-mr-px justify-start rounded-l-lg border-r-2 px-3 py-2 text-left whitespace-nowrap',
              isActive
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
            )
          : clsx(
              '-mb-px border-b-2 px-3 py-2',
              isActive
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            ),
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      {badge !== undefined && (
        <span
          className={clsx(
            'ms-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold',
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
  const { value: active, orientation } = useTabs();
  if (value !== active) return null;
  return (
    <div
      role="tabpanel"
      className={clsx(orientation === 'vertical' ? 'flex-1' : 'pt-5', className)}
    >
      {children}
    </div>
  );
};

export const Tabs = Object.assign(Root, { List, Trigger, Panel });
