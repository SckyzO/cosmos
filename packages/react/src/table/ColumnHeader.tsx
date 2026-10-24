import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { HEADER_CELL_PADDING } from './density';
import type { DataTableDensity, SortDirection } from './types';

export type ColumnHeaderProps = {
  label: ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  filterable?: boolean;
  /** Current sort direction for this column, or null if not active. */
  sortDir?: SortDirection | null;
  onSortToggle?: () => void;
  /** Filter popover state — values, selected set, callbacks. */
  filterValues?: string[];
  filterSelected?: Set<string>;
  onFilterToggle?: (v: string) => void;
  onFilterClear?: () => void;
  /** Cell padding, matching the `density` of the table it heads. Default `default`. */
  density?: DataTableDensity;
  className?: string;
};

const ALIGN_CLASS = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

const ARIA_SORT = { asc: 'ascending', desc: 'descending', none: 'none' } as const;

// No filter applied yet: the column still opens, with nothing checked.
const NO_SELECTION: Set<string> = new Set();

export const ColumnHeader = ({
  label,
  align = 'left',
  sortable,
  filterable,
  sortDir = null,
  onSortToggle,
  filterValues = [],
  filterSelected = NO_SELECTION,
  onFilterToggle,
  onFilterClear,
  density = 'default',
  className,
}: ColumnHeaderProps) => {
  const [open, setOpen] = useState(false);
  const filterCount = filterSelected.size;
  // The button shows how many values are checked; its name says so too, with the number as a
  // word of its own (WCAG 2.5.3). A comma, not parentheses: those do not count in a name.
  const filterName = typeof label === 'string' ? `Filter ${label}` : 'Filter column';
  // The label and the filter button: the dropdown opens under them, left-aligned.
  const anchorRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLButtonElement>(null);

  return (
    <th
      aria-sort={sortable ? ARIA_SORT[sortDir ?? 'none'] : undefined}
      className={clsx(
        'bg-gray-50 px-4',
        HEADER_CELL_PADDING[density],
        'text-xs font-semibold tracking-wider text-gray-500 uppercase dark:bg-gray-800 dark:text-gray-400',
        ALIGN_CLASS[align],
        className
      )}
    >
      <div ref={anchorRef} className="relative inline-flex items-center gap-1.5">
        {sortable ? (
          <button
            type="button"
            onClick={onSortToggle}
            className="focus-visible:focus-indicator flex items-center gap-1 rounded transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            {label}
            {sortDir === 'asc' && <ChevronUp className="h-3 w-3" />}
            {sortDir === 'desc' && <ChevronDown className="h-3 w-3" />}
          </button>
        ) : (
          <span>{label}</span>
        )}

        {filterable && filterValues.length > 0 && (
          <>
            <button
              ref={filterRef}
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              aria-label={filterCount > 0 ? `${filterName}, ${filterCount} selected` : filterName}
              className={clsx(
                'focus-visible:focus-indicator flex items-center gap-1 rounded p-0.5 transition-colors hover:bg-gray-200 dark:hover:bg-white/10',
                filterCount > 0 && 'text-brand-600 dark:text-brand-400'
              )}
            >
              <Filter className="h-3 w-3" />
              {filterCount > 0 && <span className="text-3xs">{filterCount}</span>}
            </button>
            {onFilterToggle && onFilterClear && (
              <FloatingPanel
                open={open}
                onClose={() => setOpen(false)}
                triggerRef={filterRef}
                anchorRef={anchorRef}
                placement={{ side: 'bottom', align: 'start', offset: 4 }}
                tabIndex={-1}
                className="outline-none"
              >
                <ColumnFilterDropdown
                  values={filterValues}
                  selected={filterSelected}
                  onToggle={onFilterToggle}
                  onClear={onFilterClear}
                />
              </FloatingPanel>
            )}
          </>
        )}
      </div>
    </th>
  );
};
