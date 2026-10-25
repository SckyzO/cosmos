import { clsx } from 'clsx';
import type { ElementType, ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';
import { IconBox } from '../ui/IconBox';

// The cells tables keep rebuilding. Each is the content of a cell (`TableCell`, a `ColumnDef`'s
// `render`), not a `<td>`: the table sets the padding and the alignment.

// ── Identity ─────────────────────────────────────────────────────────────────

export type TableIdentityCellProps = {
  /** The name of the row's subject. Truncated, and the avatar's initials when there is no image. */
  title: string;
  /** A line under the title: an email, a role, a location. Truncated. */
  subtitle?: ReactNode;
  /** Image of the avatar. Without it, and without `icon`, the avatar shows the initials of `title`. */
  src?: string;
  /** A `lucide` icon in a box, in place of an avatar: for things that are not people. */
  icon?: ElementType;
  /** Tailwind max-width class: a table that lays its columns out by content needs one to truncate. */
  className?: string;
};

/**
 * TableIdentityCell — a name with its avatar or icon and, under it, a line of detail. The text
 * is truncated, with the full title as a tooltip, so a long name never widens the column.
 */
export const TableIdentityCell = ({
  title,
  subtitle,
  src,
  icon,
  className,
}: TableIdentityCellProps) => (
  <div className={clsx('flex max-w-xs min-w-0 items-center gap-3', className)}>
    {icon ? (
      <IconBox icon={icon} size="md" />
    ) : (
      // The title beside it names the row: the avatar says nothing more.
      <span aria-hidden className="flex shrink-0">
        <Avatar src={src} name={title} size={subtitle ? 'md' : 'sm'} />
      </span>
    )}
    <div className="min-w-0">
      <div title={title} className="truncate font-medium text-[var(--color-text-primary)]">
        {title}
      </div>
      {subtitle && (
        <div
          title={typeof subtitle === 'string' ? subtitle : undefined}
          className="truncate text-xs text-[var(--color-text-muted)]"
        >
          {subtitle}
        </div>
      )}
    </div>
  </div>
);

// ── Identifier ───────────────────────────────────────────────────────────────

export type TableIdCellProps = {
  children: string;
  /** Tailwind max-width class. */
  className?: string;
};

/** TableIdCell — an identifier (an order, a host, a hash) in a monospaced face, truncated. */
export const TableIdCell = ({ children, className }: TableIdCellProps) => (
  <code
    title={children}
    className={clsx(
      'block max-w-40 truncate font-mono text-xs text-[var(--color-text-secondary)]',
      className
    )}
  >
    {children}
  </code>
);

// ── Description ──────────────────────────────────────────────────────────────

const CLAMP = { 1: 'truncate', 2: 'line-clamp-2', 3: 'line-clamp-3' } as const;

export type TableDescriptionCellProps = {
  children: string;
  /** How many lines show before the text is cut. Default 1. */
  lines?: keyof typeof CLAMP;
  /** Tailwind max-width class. Default `max-w-sm`. */
  className?: string;
};

/** TableDescriptionCell — free text cut after `lines` lines, with the whole text as a tooltip. */
export const TableDescriptionCell = ({
  children,
  lines = 1,
  className,
}: TableDescriptionCellProps) => (
  <p
    title={children}
    className={clsx('max-w-sm text-[var(--color-text-secondary)]', CLAMP[lines], className)}
  >
    {children}
  </p>
);

// ── Amount ───────────────────────────────────────────────────────────────────

export type TableAmountCellProps = {
  value: number;
  /** ISO 4217 code (`'EUR'`): formats the value as a price. Without it, as a plain number. */
  currency?: string;
  /** BCP 47 locale of the number. Default: the user's. */
  locale?: string;
  /** Formats the value yourself, in place of `currency` and `locale`. */
  format?: (value: number) => string;
};

const defaultFormat = (value: number, currency?: string, locale?: string) =>
  new Intl.NumberFormat(locale, {
    ...(currency ? { style: 'currency', currency } : {}),
    // A + in front of a gain as well as a - in front of a loss, and nothing in front of zero.
    signDisplay: 'exceptZero',
  }).format(value);

/**
 * TableAmountCell — a signed amount tinted by its sign: green for a gain, red for a loss, plain
 * for zero. The sign is written too, so the colour is never the only cue. Put it in a numeric
 * column (`align="right"`, or `numeric` on `TableCell`).
 */
export const TableAmountCell = ({ value, currency, locale, format }: TableAmountCellProps) => (
  <span
    className={clsx(
      'font-medium whitespace-nowrap tabular-nums',
      value > 0 && 'text-green-700 dark:text-green-400',
      value < 0 && 'text-red-700 dark:text-red-400'
    )}
  >
    {format ? format(value) : defaultFormat(value, currency, locale)}
  </span>
);
