import { clsx } from 'clsx';
import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { Amount } from './Amount';
import type { MoneySignDisplay } from './money';

// The money format of the block reaches its rows without a prop on each of them.
type MoneyFormat = { currency?: string; locale?: string; signDisplay?: MoneySignDisplay };
const MoneyFormatContext = createContext<MoneyFormat>({});

// ── Rows ─────────────────────────────────────────────────────────────────────

export type TotalsRowProps = Omit<ComponentPropsWithRef<'li'>, 'children'> & {
  /** What the figure is: "Subtotal", "Shipping", "VAT (20%)". Wraps when the row is narrow. */
  label: ReactNode;
  /** The amount, in units (`24.5`, not 2450 cents), written with the block's currency and locale. */
  value?: number;
  /**
   * The value as text or a node ("Free", "Calculated at the next step"), in place of `value`. A
   * text sits in a `<bdi>`, so it keeps its order in a right-to-left page. A row with neither
   * shows no value.
   */
  children?: ReactNode;
};

// A text value is an island of its own direction; a node is left as it is.
const isolate = (content: ReactNode) =>
  typeof content === 'string' || typeof content === 'number' ? <bdi>{content}</bdi> : content;

type LineProps = TotalsRowProps & { total?: boolean };

function Line({ label, value, children, total = false, className, ref, ...rest }: LineProps) {
  const format = useContext(MoneyFormatContext);
  return (
    <li
      ref={ref}
      className={clsx(
        'flex items-baseline justify-between gap-x-4',
        total
          ? 'py-row-12 border-t border-gray-200 text-base font-semibold text-[var(--color-text-primary)] dark:border-white/10'
          : 'py-row-6 text-sm text-[var(--color-text-secondary)]',
        className
      )}
      {...rest}
    >
      {/* A long label wraps; a word with no break point (a coupon code) breaks inside the row. */}
      <span className="min-w-0 break-words">{label}</span>
      <span
        className={clsx(
          'shrink-0 text-end',
          !total && 'font-medium text-[var(--color-text-primary)]'
        )}
      >
        {children !== undefined ? (
          isolate(children)
        ) : value !== undefined ? (
          <Amount value={value} {...format} />
        ) : null}
      </span>
    </li>
  );
}

/** Totals.Row — a label and its amount: a subtotal, a discount, shipping, tax. */
function Row(props: TotalsRowProps) {
  return <Line {...props} />;
}

/**
 * Totals.Total — the row that closes the block: a rule above it and a larger, bolder label and
 * amount. Takes the same props as `Totals.Row`.
 */
function Total(props: TotalsRowProps) {
  return <Line {...props} total />;
}

// ── Note ─────────────────────────────────────────────────────────────────────

export type TotalsNoteProps = ComponentPropsWithRef<'li'> & {
  /** The text under the rows: "Tax included", "Shipping calculated at checkout". */
  children: ReactNode;
};

/** Totals.Note — a line of small, muted text under the rows, at the end of the line with them. */
function Note({ className, children, ref, ...rest }: TotalsNoteProps) {
  return (
    <li
      ref={ref}
      className={clsx('pb-row-4 text-end text-xs text-[var(--color-text-muted)]', className)}
      {...rest}
    >
      {children}
    </li>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export type TotalsProps = Omit<ComponentPropsWithRef<'ul'>, 'children'> & {
  /** ISO 4217 code (`'EUR'`) of every amount. Without it, they are plain numbers. */
  currency?: string;
  /** BCP 47 locale of every amount. Default: the user's. Pass it when the page is in one. */
  locale?: string;
  /**
   * Which amounts get a sign. Default `negative`: a minus in front of a discount, nothing in front
   * of a subtotal or of zero. See `formatMoney`.
   */
  signDisplay?: MoneySignDisplay;
  /** `Totals.Row`, `Totals.Total` and `Totals.Note`, in the order they show. */
  children: ReactNode;
};

function TotalsRoot({
  currency,
  locale,
  signDisplay,
  className,
  children,
  ref,
  ...rest
}: TotalsProps) {
  const format = useMemo(
    () => ({ currency, locale, signDisplay }),
    [currency, locale, signDisplay]
  );
  return (
    <MoneyFormatContext value={format}>
      <ul ref={ref} role="list" className={clsx('w-full', className)} {...rest}>
        {children}
      </ul>
    </MoneyFormatContext>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

/**
 * Totals — the summary rows that end a cart, an order or an invoice: subtotal, discount,
 * shipping, tax, then a total that stands out and an optional note. It adds nothing up: every
 * amount is yours, and each is written by `formatMoney` with the block's `currency` and `locale`,
 * in tabular digits at the end of the line, so the figures line up and mirror in right to left.
 * A discount is a negative amount: it shows with a minus, in the colour of the text around it.
 * The block takes the width of its container; give it a `max-w-*` and `ms-auto` to sit at the end.
 */
export const Totals = Object.assign(TotalsRoot, { Row, Total, Note });
