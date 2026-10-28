import { clsx } from 'clsx';
import { Tag } from '../ui/Tag';

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
      <span className="text-xs text-gray-600 dark:text-gray-400">Active filters:</span>
      {filters.map((f) => (
        <Tag
          key={f.key}
          intent="brand"
          size="md"
          onRemove={() => onClearOne(f.key)}
          removeLabel={`Clear ${f.label} filter`}
        >
          <span className="font-semibold capitalize">
            <bdi>{f.label}</bdi>
          </span>
          <span aria-hidden className="opacity-60">
            {' · '}
          </span>
          <span className="inline-block max-w-[180px] truncate align-bottom">
            <bdi>{f.value}</bdi>
          </span>
        </Tag>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="focus-visible:focus-indicator ms-1 rounded text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Clear all
      </button>
    </div>
  );
};
