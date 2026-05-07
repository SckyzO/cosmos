import { clsx } from 'clsx';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

type TabsContextValue = {
  value: string;
  onChange: (value: string) => void;
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
  children: ReactNode;
  className?: string;
};

const Root = ({ value, onChange, children, className }: TabsProps) => (
  <TabsContext.Provider value={{ value, onChange }}>
    <div className={className}>{children}</div>
  </TabsContext.Provider>
);

const List = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    role="tablist"
    className={clsx(
      'flex items-center gap-1 border-b border-gray-200 dark:border-gray-800',
      className
    )}
  >
    {children}
  </div>
);

export type TabProps = {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

const Trigger = ({ value, children, disabled, className }: TabProps) => {
  const { value: active, onChange } = useTabs();
  const isActive = value === active;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onChange(value)}
      className={clsx(
        '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        isActive
          ? 'border-brand-500 text-brand-600 dark:text-brand-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
        className
      )}
    >
      {children}
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
  const { value: active } = useTabs();
  if (value !== active) return null;
  return (
    <div role="tabpanel" className={clsx('pt-4', className)}>
      {children}
    </div>
  );
};

export const Tabs = Object.assign(Root, { List, Trigger, Panel });
