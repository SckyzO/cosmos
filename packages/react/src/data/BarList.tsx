import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Sk } from '../feedback/Skeleton';
import type { Intent } from '../ui/intent';
import { barPercent, largestValue } from './bar-list';

export type BarListIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger' | 'info'>;

export type BarListItem = {
  /** Stable key of the row. */
  id: string;
  /** What is ranked: a page, a product, a country. A string label also reads in full on hover. */
  label: ReactNode;
  value: number;
  /** Before the label: an icon, or a flag. Decorative, the label names the row. */
  icon?: ReactNode;
  /** Makes the whole row one link. */
  href?: string;
  /** After the value: normally a `<TrendDelta size="sm" />`. */
  delta?: ReactNode;
  /** Muted text after the label ("/pricing" next to "Pricing"). Truncates with the label. */
  hint?: ReactNode;
  /** Color of this row's bar. Default: the list's `intent`. */
  intent?: BarListIntent;
};

export type BarListProps = {
  items: BarListItem[];
  /**
   * What a full bar stands for. Default: the largest value of `items`. Give two lists the same
   * `max` to put them on one scale.
   */
  max?: number;
  /** Writes a value. Default: grouped digits, `12,480`. */
  formatValue?: (value: number) => string;
  /** Numbers the rows, in the order they are shown, and makes the list an `ol`. */
  showRank?: boolean;
  /** `desc` orders the rows by value, largest first. Default `none`: the host orders them. */
  sort?: 'none' | 'desc';
  /** Color of the bars. Default `brand`. */
  intent?: BarListIntent;
  /** Makes every row one button that calls this with its item (a link when the item has `href`). */
  onItemClick?: (item: BarListItem) => void;
  /**
   * Shows skeleton rows and sets `aria-busy`. As many rows as `items`, so the list keeps its
   * height; five when there are none yet.
   */
  loading?: boolean;
  /** Shown in place of the list when `items` is empty. Default `No data`. */
  emptyMessage?: ReactNode;
  /** Names the list for assistive technology ("Top pages"). */
  'aria-label'?: string;
  className?: string;
};

const FILL: Record<BarListIntent, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

// A fixed locale keeps the default output the same on every machine.
const GROUPED = new Intl.NumberFormat('en-US');
const defaultFormat = (value: number) => GROUPED.format(value);

const SKELETON_ROWS = 5;

// Rank column: fixed, so the bars of every row start at the same place.
const RANK = 'w-5 shrink-0 text-xs text-[var(--color-text-muted)] tabular-nums';

const Track = ({ children }: { children?: ReactNode }) => (
  <span
    aria-hidden
    className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
  >
    {children}
  </span>
);

/**
 * BarList — a ranked list where each row is a label, a value and a thin bar scaled to the largest
 * value: top pages, top products, traffic by region, leaderboards. The value is text in the row
 * and the bar only repeats it, so it is hidden from assistive technology. With `showRank` the list
 * is an `ol`; with `href` or `onItemClick` each row is one link or button.
 */
export const BarList = ({
  items,
  max,
  formatValue = defaultFormat,
  showRank = false,
  sort = 'none',
  intent = 'brand',
  onItemClick,
  loading = false,
  emptyMessage = 'No data',
  'aria-label': ariaLabel,
  className,
}: BarListProps) => {
  const List = showRank ? 'ol' : 'ul';
  const listClass = clsx('m-0 flex list-none flex-col gap-3 p-0', className);

  if (loading) {
    return (
      <List aria-busy="true" aria-label={ariaLabel} className={listClass}>
        {Array.from({ length: items.length || SKELETON_ROWS }, (_, i) => (
          <li key={i} className="flex gap-3">
            {showRank && <span className={RANK} />}
            <span className="block min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <Sk as="span" h="h-5" w="w-1/3" round="rounded-md" />
                <Sk as="span" h="h-5" w="w-10" round="rounded-md" />
              </span>
              <Track>
                <Sk as="span" h="h-full" w="w-full" round="rounded-full" />
              </Track>
            </span>
          </li>
        ))}
      </List>
    );
  }

  if (items.length === 0)
    return (
      <p className={clsx('text-sm text-[var(--color-text-muted)]', className)}>{emptyMessage}</p>
    );

  const rows = sort === 'desc' ? [...items].sort((a, b) => b.value - a.value) : items;
  const scale = max ?? largestValue(items.map((item) => item.value));

  return (
    <List aria-label={ariaLabel} className={listClass}>
      {rows.map((item, index) => {
        const href = item.href;
        const interactive = Boolean(href || onItemClick);
        const content = (
          <>
            {showRank && <span className={RANK}>{index + 1}</span>}
            <span className="block min-w-0 flex-1">
              <span className="flex items-center gap-3">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {item.icon && (
                    <span aria-hidden className="flex shrink-0 items-center [&>svg]:size-4">
                      {item.icon}
                    </span>
                  )}
                  <span
                    title={typeof item.label === 'string' ? item.label : undefined}
                    className="min-w-0 truncate text-sm text-[var(--color-text-primary)]"
                  >
                    {item.label}
                    {item.hint && (
                      <span className="text-2xs ml-2 text-[var(--color-text-muted)]">
                        {item.hint}
                      </span>
                    )}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                  {formatValue(item.value)}
                </span>
                {item.delta && <span className="shrink-0">{item.delta}</span>}
              </span>
              <Track>
                <span
                  className={clsx(
                    'block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300',
                    FILL[item.intent ?? intent]
                  )}
                  style={{ width: `${barPercent(item.value, scale)}%` }}
                />
              </Track>
            </span>
          </>
        );
        // A row with a hover state is inset by the padding it adds, so its content lines up with
        // the rows that have none.
        const rowClass = interactive
          ? 'focus-visible:focus-indicator -mx-2 flex w-[calc(100%+1rem)] gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/5 focus-visible:ring-inset dark:hover:bg-white/5'
          : 'flex w-full gap-3 text-left';
        return (
          <li key={item.id}>
            {href ? (
              <a href={href} onClick={() => onItemClick?.(item)} className={rowClass}>
                {content}
              </a>
            ) : onItemClick ? (
              <button type="button" onClick={() => onItemClick(item)} className={rowClass}>
                {content}
              </button>
            ) : (
              <div className={rowClass}>{content}</div>
            )}
          </li>
        );
      })}
    </List>
  );
};
