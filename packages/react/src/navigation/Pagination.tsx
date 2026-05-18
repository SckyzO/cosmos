import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type PaginationVariant = 'text' | 'compact';
export type PaginationSize = 'sm' | 'md';

export type PaginationProps = {
  /** 1-indexed current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Render "Showing X to Y of Z". Requires `pageSize` + `total`. */
  showInfo?: boolean;
  pageSize?: number;
  total?: number;
  /** `text` (default) shows numbered buttons. `compact` shows chevrons + "Page X of Y". */
  variant?: PaginationVariant;
  size?: PaginationSize;
  className?: string;
};

const SIZE_BTN: Record<PaginationSize, string> = {
  sm: 'h-8 min-w-8 px-2 text-xs',
  md: 'h-9 min-w-9 px-2.5 text-sm',
};

/**
 * Compute the list of pages to show with ellipsis markers.
 * `0` represents an ellipsis. Always includes first + last.
 *   < 8 pages: render all.
 *   page near start: 1 2 3 4 5 ... N
 *   page near end:   1 ... N-4 N-3 N-2 N-1 N
 *   middle:          1 ... p-1 p p+1 ... N
 */
const buildRange = (page: number, total: number): number[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 0, total];
  if (page >= total - 3) return [1, 0, total - 4, total - 3, total - 2, total - 1, total];
  return [1, 0, page - 1, page, page + 1, 0, total];
};

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
  showInfo = false,
  pageSize,
  total,
  variant = 'text',
  size = 'sm',
  className,
}: PaginationProps) => {
  const safePage = Math.max(1, Math.min(page, Math.max(1, totalPages)));
  const goTo = (p: number) => {
    if (p < 1 || p > totalPages || p === safePage) return;
    onPageChange(p);
  };
  const isFirst = safePage <= 1;
  const isLast = safePage >= totalPages;
  const btnClass =
    'inline-flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700';
  const activeClass =
    'bg-brand-500 border-brand-500 text-white hover:bg-brand-600 dark:hover:bg-brand-400';

  const infoNode =
    showInfo && pageSize !== undefined && total !== undefined ? (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Showing{' '}
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {Math.min(total, (safePage - 1) * pageSize + 1)}
        </span>{' '}
        to{' '}
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {Math.min(safePage * pageSize, total)}
        </span>{' '}
        of <span className="font-medium text-gray-700 dark:text-gray-200">{total}</span>
      </span>
    ) : null;

  return (
    <nav
      aria-label="Pagination"
      className={clsx(
        'flex items-center gap-3',
        showInfo ? 'justify-between' : 'justify-center',
        className
      )}
    >
      {infoNode}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={isFirst}
          onClick={() => goTo(safePage - 1)}
          className={clsx(btnClass, SIZE_BTN[size])}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {variant === 'compact' ? (
          <span className="px-3 text-xs text-gray-600 dark:text-gray-300">
            Page <span className="font-medium">{safePage}</span> of{' '}
            <span className="font-medium">{Math.max(1, totalPages)}</span>
          </span>
        ) : (
          buildRange(safePage, Math.max(1, totalPages)).map((p, i) =>
            p === 0 ? (
              <span
                key={`ellipsis-${i}`}
                aria-hidden
                className={clsx(
                  'inline-flex items-center justify-center text-gray-400',
                  SIZE_BTN[size]
                )}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-label={`Page ${p}`}
                aria-current={p === safePage ? 'page' : undefined}
                onClick={() => goTo(p)}
                className={clsx(btnClass, SIZE_BTN[size], p === safePage && activeClass)}
              >
                {p}
              </button>
            )
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={isLast}
          onClick={() => goTo(safePage + 1)}
          className={clsx(btnClass, SIZE_BTN[size])}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};
