import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { buildRange } from './pageRange';
import { useControllableState } from '../hooks/useControllableState';

export type PaginationVariant = 'text' | 'compact';
export type PaginationSize = 'sm' | 'md';
export type PaginationPrevNextLabel = 'icon' | 'text';

export type PaginationProps = {
  /** 1-indexed current page, when controlled. */
  page?: number;
  /** 1-indexed first page, when uncontrolled. Default `1`. */
  defaultPage?: number;
  totalPages: number;
  /** Called with the page to go to. */
  onPageChange?: (page: number) => void;
  /** Render "Showing X to Y of Z". Requires `pageSize` + `total`. */
  showInfo?: boolean;
  pageSize?: number;
  total?: number;
  /** `text` (default) shows numbered buttons. `compact` shows chevrons + "Page X of Y". */
  variant?: PaginationVariant;
  size?: PaginationSize;
  /**
   * How Previous and Next read. `icon` (default) is a chevron alone; `text` adds the word beside the
   * chevron ("‹ Previous", "Next ›"), for a long list or readers who don't take a chevron for a
   * direction. The accessible names stay "Previous page" and "Next page", and the words stay below
   * `sm`. The buttons of `showEdges` keep their icon.
   */
  prevNextLabel?: PaginationPrevNextLabel;
  /**
   * Add "First page" and "Last page" buttons around Previous and Next, for long lists. They stay
   * below `sm`, where Previous and Next do. Default `false`.
   */
  showEdges?: boolean;
  /**
   * Show every result on one page instead of paginating: the page buttons go away and the info
   * reads "Showing all N results". Controlled only; pair it with `onShowAllChange`, which also
   * adds the "Show all" / "Show paginated" button.
   */
  showAll?: boolean;
  /** Called with the mode to switch to. */
  onShowAllChange?: (showAll: boolean) => void;
  /**
   * A control that belongs with the paging ones (a rows-per-page select), shown before "Show all"
   * and the page buttons. The group wraps when the row is too narrow for all of them.
   */
  controls?: ReactNode;
  /** Names the landmark. Default `Pagination`; two pagers on one page need distinct names. */
  'aria-label'?: string;
  className?: string;
};

const SIZE_BTN: Record<PaginationSize, string> = {
  sm: 'h-ctrl-32 min-w-ctrl-32 px-2 text-xs',
  md: 'h-ctrl-36 min-w-ctrl-36 px-2.5 text-sm',
};

export const Pagination = ({
  page: pageProp,
  defaultPage = 1,
  totalPages,
  onPageChange,
  showInfo = false,
  pageSize,
  total,
  variant = 'text',
  size = 'sm',
  prevNextLabel = 'icon',
  showEdges = false,
  showAll = false,
  onShowAllChange,
  controls,
  'aria-label': ariaLabel = 'Pagination',
  className,
}: PaginationProps) => {
  const [page, setPage] = useControllableState({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
    name: 'Pagination.page',
  });
  const safePage = Math.max(1, Math.min(page, Math.max(1, totalPages)));
  const goTo = (p: number) => {
    if (p < 1 || p > totalPages || p === safePage) return;
    setPage(p);
  };
  const isFirst = safePage <= 1;
  const isLast = safePage >= totalPages;
  // Colors live in two exclusive sets: a page button takes `idleClass` or `activeClass`, never both,
  // since Tailwind's CSS order (not clsx's) decides which of two `bg-*` classes wins.
  const btnClass =
    'items-center justify-center rounded-md border transition-colors focus-visible:focus-indicator disabled:cursor-not-allowed disabled:opacity-40';
  const idleClass =
    'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700';
  const activeClass =
    'border-brand-500 bg-brand-500 text-white hover:bg-brand-600 dark:hover:bg-brand-400';
  const withText = prevNextLabel === 'text';
  const stepClass = clsx(btnClass, idleClass, 'inline-flex', withText && 'gap-1', SIZE_BTN[size]);

  const strong = 'font-medium text-gray-700 dark:text-gray-200';
  let infoNode: ReactNode = null;
  if (showInfo && total !== undefined) {
    if (showAll) {
      infoNode = (
        <>
          Showing all <span className={strong}>{total}</span> results
        </>
      );
    } else if (pageSize !== undefined) {
      infoNode = (
        <>
          Showing <span className={strong}>{Math.min(total, (safePage - 1) * pageSize + 1)}</span>{' '}
          to <span className={strong}>{Math.min(safePage * pageSize, total)}</span> of{' '}
          <span className={strong}>{total}</span>
        </>
      );
    }
  }

  return (
    // Below `sm` the info takes its own row and the controls shrink to
    // "Previous · Page 2 / 9 · Next": the numbered buttons cannot wrap.
    <nav
      aria-label={ariaLabel}
      className={clsx(
        'flex items-center gap-3',
        infoNode
          ? 'flex-col sm:flex-row sm:justify-between'
          : onShowAllChange
            ? 'justify-between'
            : 'justify-center',
        className
      )}
    >
      {infoNode && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <bdi>{infoNode}</bdi>
        </span>
      )}
      <div
        className={clsx(
          'flex items-center gap-3',
          controls && 'max-w-full flex-wrap justify-center'
        )}
      >
        {controls}
        {onShowAllChange && (
          <button
            type="button"
            onClick={() => onShowAllChange(!showAll)}
            className="focus-visible:focus-indicator rounded text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showAll ? 'Show paginated' : 'Show all'}
          </button>
        )}
        {!showAll && (
          <div className="flex items-center gap-1">
            {showEdges && (
              <button
                type="button"
                aria-label="First page"
                disabled={isFirst}
                onClick={() => goTo(1)}
                className={clsx(btnClass, idleClass, 'inline-flex', SIZE_BTN[size])}
              >
                <ChevronsLeft className="h-4 w-4 rtl:-scale-x-100" />
              </button>
            )}
            <button
              type="button"
              aria-label="Previous page"
              disabled={isFirst}
              onClick={() => goTo(safePage - 1)}
              className={stepClass}
            >
              <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
              {withText && 'Previous'}
            </button>

            {variant === 'compact' ? (
              <span className="px-3 text-xs text-gray-600 dark:text-gray-300">
                <bdi>
                  Page <span className="font-medium">{safePage}</span> of{' '}
                  <span className="font-medium">{Math.max(1, totalPages)}</span>
                </bdi>
              </span>
            ) : (
              <>
                <span className="px-3 text-xs text-gray-600 sm:hidden dark:text-gray-300">
                  <bdi>
                    Page <span className="font-medium">{safePage}</span> /{' '}
                    <span className="font-medium">{Math.max(1, totalPages)}</span>
                  </bdi>
                </span>
                {buildRange(safePage, Math.max(1, totalPages)).map((p, i) =>
                  p === 0 ? (
                    <span
                      key={`ellipsis-${i}`}
                      aria-hidden
                      className={clsx(
                        'hidden items-center justify-center text-gray-500 sm:inline-flex dark:text-gray-400',
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
                      className={clsx(
                        btnClass,
                        SIZE_BTN[size],
                        'hidden sm:inline-flex',
                        p === safePage ? activeClass : idleClass
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
              </>
            )}

            <button
              type="button"
              aria-label="Next page"
              disabled={isLast}
              onClick={() => goTo(safePage + 1)}
              className={stepClass}
            >
              {withText && 'Next'}
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
            </button>
            {showEdges && (
              <button
                type="button"
                aria-label="Last page"
                disabled={isLast}
                onClick={() => goTo(Math.max(1, totalPages))}
                className={clsx(btnClass, idleClass, 'inline-flex', SIZE_BTN[size])}
              >
                <ChevronsRight className="h-4 w-4 rtl:-scale-x-100" />
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
