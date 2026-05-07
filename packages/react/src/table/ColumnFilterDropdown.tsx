import { clsx } from 'clsx';
import { useState } from 'react';

export type ColumnFilterDropdownProps = {
  values: string[];
  selected: Set<string>;
  searchable?: boolean;
  onToggle: (value: string) => void;
  onClear: () => void;
  className?: string;
};

/**
 * ColumnFilterDropdown — popover with multi-select checkboxes for filtering
 * a column. Optional search input filters the visible options.
 */
export const ColumnFilterDropdown = ({
  values,
  selected,
  searchable = true,
  onToggle,
  onClear,
  className,
}: ColumnFilterDropdownProps) => {
  const [query, setQuery] = useState('');
  const visible = query
    ? values.filter((v) => v.toLowerCase().includes(query.toLowerCase()))
    : values;

  return (
    <div
      className={clsx(
        'absolute top-full left-0 z-50 mt-1 min-w-[200px] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900',
        className
      )}
    >
      {searchable && (
        <div className="border-b border-gray-100 p-2 dark:border-gray-800">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="focus:border-brand-400 h-7 w-full rounded-lg border border-gray-200 px-2.5 text-xs placeholder-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>
      )}
      <div className="max-h-52 overflow-y-auto py-1">
        {visible.length === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-400">No results</p>
        ) : (
          visible.map((val) => (
            <label
              key={val}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={selected.has(val)}
                onChange={() => onToggle(val)}
                className="accent-brand-500 h-3.5 w-3.5 cursor-pointer rounded"
              />
              <span className="truncate text-gray-700 dark:text-gray-300">{val}</span>
            </label>
          ))
        )}
      </div>
      {selected.size > 0 && (
        <div className="border-t border-gray-100 p-2 dark:border-gray-800">
          <button
            type="button"
            onClick={onClear}
            className="w-full rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          >
            Clear ({selected.size} selected)
          </button>
        </div>
      )}
    </div>
  );
};
