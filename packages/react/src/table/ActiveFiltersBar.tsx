import { clsx } from 'clsx';
import { X } from 'lucide-react';

export type ActiveFilter = {
  key: string;
  label: string;
  /** Comma-joined preview of selected values. */
  value: string;
};

export type ActiveFiltersBarProps = {
  filters: ActiveFilter[];
  onClearOne: (key: string) => void;
  onClearAll: () => void;
  className?: string;
};

/**
 * ActiveFiltersBar — chips row showing current column filters with per-chip
 * dismiss + a "Clear all" action. Renders nothing when there are no filters.
 */
export const ActiveFiltersBar = ({
  filters,
  onClearOne,
  onClearAll,
  className,
}: ActiveFiltersBarProps) => {
  if (filters.length === 0) return null;
  return (
    <div
      className={clsx(
        'bg-brand-50/50 dark:bg-brand-500/5 flex shrink-0 flex-wrap items-center gap-1.5 border-b border-gray-100 px-4 py-2 dark:border-gray-800',
        className
      )}
    >
      <span className="text-xs text-gray-400">Active filters:</span>
      {filters.map((f) => (
        <span
          key={f.key}
          className="border-brand-200 text-brand-600 dark:border-brand-700/50 dark:text-brand-400 flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs font-medium dark:bg-gray-900"
        >
          <span className="font-semibold capitalize">{f.label}</span>
          <span className="text-brand-400">·</span>
          <span className="max-w-[180px] truncate">{f.value}</span>
          <button
            type="button"
            onClick={() => onClearOne(f.key)}
            aria-label={`Clear ${f.label} filter`}
            className="hover:text-brand-800 dark:hover:text-brand-200 ml-0.5 rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        Clear all
      </button>
    </div>
  );
};
