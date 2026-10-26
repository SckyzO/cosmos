import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Tabs } from '../ui/Tabs';

export type DataTableFilterTabOption = {
  /** The column value the tab filters on. */
  value: string;
  label: ReactNode;
  /** Shown in a pill after the label. Given by the host, never computed from the rows. */
  count?: number;
};

export type DataTableFilterTabsConfig = {
  /** `key` of the column the tabs filter. */
  columnKey: string;
  options: DataTableFilterTabOption[];
  /** Label of the tab that clears the column's filter. Default "All". */
  allLabel?: ReactNode;
  /** Count of the "All" tab. */
  allCount?: number;
};

// Tab values are prefixed so a column value can never collide with the "All" tab.
const ALL = 'all';
const OPTION = 'option:';

const Count = ({ active, children }: { active: boolean; children: number }) => (
  <span
    className={clsx(
      'text-2xs rounded-full px-1.5 py-0.5 font-semibold',
      active
        ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    )}
  >
    {children}
  </span>
);

/**
 * The status tabs at the top of a DataTable card: "All" plus one tab per option, each setting
 * the filter of one column. The active tab is the one matching the column's current filter;
 * a filter picked in the column header that matches no single tab leaves none active.
 */
export const DataTableFilterTabsStrip = ({
  tabs,
  selected,
  onSelect,
}: {
  tabs: DataTableFilterTabsConfig;
  /** The values filtered on `tabs.columnKey` right now. */
  selected: ReadonlySet<string> | undefined;
  /** `undefined` clears the column's filter. */
  onSelect: (value: string | undefined) => void;
}) => {
  const { options, allLabel = 'All', allCount } = tabs;
  let active = '';
  if (!selected || selected.size === 0) active = ALL;
  else if (selected.size === 1) {
    const [only] = selected;
    if (options.some((o) => o.value === only)) active = OPTION + only;
  }
  return (
    <Tabs
      value={active}
      onChange={(next) => onSelect(next === ALL ? undefined : next.slice(OPTION.length))}
      className="shrink-0"
    >
      <Tabs.List className="px-4">
        <Tabs.Trigger value={ALL}>
          {allLabel}
          {allCount !== undefined && <Count active={active === ALL}>{allCount}</Count>}
        </Tabs.Trigger>
        {options.map((o) => (
          <Tabs.Trigger key={o.value} value={OPTION + o.value}>
            {o.label}
            {o.count !== undefined && <Count active={active === OPTION + o.value}>{o.count}</Count>}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
};
