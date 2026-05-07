import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

export type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  showAll?: boolean;
  onToggleShowAll?: (showAll: boolean) => void;
  className?: string;
};

/**
 * Computes a compact page list with ellipsis for long sequences.
 * Always shows first/last and a window of 3 around the active page.
 */
const buildPageList = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const out: (number | '...')[] = [0];
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  if (start > 1) out.push('...');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 2) out.push('...');
  out.push(total - 1);
  return out;
};

export const Pagination = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  showAll = false,
  onToggleShowAll,
  className,
}: PaginationProps) => {
  const safePage = Math.min(Math.max(0, page), Math.max(0, totalPages - 1));
  const firstEntry = total === 0 ? 0 : safePage * pageSize + 1;
  const lastEntry = Math.min(total, (safePage + 1) * pageSize);
  const pageNums = useMemo(() => buildPageList(safePage, totalPages), [safePage, totalPages]);

  return (
    <div
      className={clsx(
        'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800',
        className
      )}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {showAll ? (
          <>
            Showing all <b className="text-gray-700 dark:text-gray-200">{total}</b> results
          </>
        ) : (
          <>
            Showing{' '}
            <b className="text-gray-700 dark:text-gray-200">
              {firstEntry}–{lastEntry}
            </b>{' '}
            of <b className="text-gray-700 dark:text-gray-200">{total}</b> results
          </>
        )}
      </p>

      <div className="flex items-center gap-3">
        {onToggleShowAll && (
          <button
            type="button"
            onClick={() => onToggleShowAll(!showAll)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showAll ? 'Show paginated' : 'Show all'}
          </button>
        )}

        {!showAll && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex items-center gap-1">
              {pageNums.map((p, i) =>
                p === '...' ? (
                  <span
                    key={`e-${i}`}
                    className="flex h-9 w-9 items-center justify-center text-sm text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={clsx(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      p === safePage
                        ? 'bg-brand-500 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5'
                    )}
                  >
                    {p + 1}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
              disabled={safePage === totalPages - 1}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
