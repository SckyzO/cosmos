import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import type { SortDirection } from './types';

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
  className?: string;
};

const ALIGN_CLASS = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

export const ColumnHeader = ({
  label,
  align = 'left',
  sortable,
  filterable,
  sortDir = null,
  onSortToggle,
  filterValues = [],
  filterSelected,
  onFilterToggle,
  onFilterClear,
  className,
}: ColumnHeaderProps) => {
  const [open, setOpen] = useState(false);
  const filterCount = filterSelected?.size ?? 0;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <th
      className={clsx(
        'bg-gray-50 px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:bg-gray-800 dark:text-gray-400',
        ALIGN_CLASS[align],
        className
      )}
    >
      <div ref={ref} className="relative inline-flex items-center gap-1.5">
        {sortable ? (
          <button
            type="button"
            onClick={onSortToggle}
            className="flex items-center gap-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
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
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Filter column"
              className={clsx(
                'flex items-center gap-1 rounded p-0.5 transition-colors hover:bg-gray-200 dark:hover:bg-white/10',
                filterCount > 0 && 'text-brand-500'
              )}
            >
              <Filter className="h-3 w-3" />
              {filterCount > 0 && <span className="text-[10px]">{filterCount}</span>}
            </button>
            {open && filterSelected && onFilterToggle && onFilterClear && (
              <ColumnFilterDropdown
                values={filterValues}
                selected={filterSelected}
                onToggle={onFilterToggle}
                onClear={onFilterClear}
              />
            )}
          </>
        )}
      </div>
    </th>
  );
};
