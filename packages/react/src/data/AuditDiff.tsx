import { clsx } from 'clsx';
import { Fragment, type ComponentPropsWithRef, type ReactNode, type Ref } from 'react';
import { isLongText, wordDiff } from './wordDiff';

export type AuditChange = {
  /** The field's key. Names the row when `label` is not given. */
  field: string;
  /** What the row is called, when it differs from `field` ("Role" for `role_id`). */
  label?: ReactNode;
  /** The value before the change. `null`, `undefined` and `''` mean the field was empty. */
  before?: unknown;
  /** The value after the change. `null`, `undefined` and `''` mean the field was removed. */
  after?: unknown;
};

export type AuditDiffVariant = 'table' | 'inline';

/** The texts the component writes itself, to translate or reword. */
export type AuditDiffLabels = {
  /** Header of the first column of the `table` variant. */
  field: string;
  /** Header of the old values, and the "before" a screen reader hears in `inline`. */
  before: string;
  /** Header of the new values, and the "after" a screen reader hears in `inline`. */
  after: string;
  /** Read in place of the "—" shown for a value that is absent. */
  empty: string;
  /** Read before a word the new text no longer has. */
  removed: string;
  /** Read before a word the new text adds. */
  added: string;
};

export type AuditDiffProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** One entry per field that changed. */
  changes: AuditChange[];
  /**
   * `table` (default): Field, Before and After columns, below `sm` each change stacked as a block.
   * `inline`: one line per field ("Role: Viewer → Admin"), for an entry of a feed or a timeline.
   */
  variant?: AuditDiffVariant;
  /**
   * Writes a value in place of the default text (strings as they are, numbers and booleans with
   * `String`, objects and arrays as compact JSON). The word diff of a long text is skipped for a
   * value this renders. Not called for an absent value, which shows "—".
   */
  formatValue?: (value: unknown, change: AuditChange, side: 'before' | 'after') => ReactNode;
  /** Replaces the texts of the component, e.g. for another language. Merged over the English ones. */
  labels?: Partial<AuditDiffLabels>;
};

const DEFAULT_LABELS: AuditDiffLabels = {
  field: 'Field',
  before: 'Before',
  after: 'After',
  empty: 'empty',
  removed: 'removed:',
  added: 'added:',
};

const isAbsent = (value: unknown) => value === undefined || value === null || value === '';

/** A value as text: strings as they are, objects and arrays as compact JSON. */
const valueText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      // A circular structure has no JSON form.
      return String(value);
    }
  }
  return String(value);
};

// The old value is tinted danger and struck through, the new one success: the `Intent` palette of
// TrendDelta and the alerts. A word mark inside a long text takes a stronger tint to stand out.
const REMOVED_CELL = 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
const ADDED_CELL = 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400';
// The strike goes on the value alone: a label above it, in the same tinted cell, stays legible.
const STRUCK = 'line-through';
const REMOVED_WORD =
  'rounded-sm bg-red-100 text-red-800 line-through dark:bg-red-500/20 dark:text-red-300';
const ADDED_WORD =
  'rounded-sm bg-green-100 text-green-800 no-underline dark:bg-green-500/20 dark:text-green-300';

const Empty = ({ labels }: { labels: AuditDiffLabels }) => (
  <>
    <span aria-hidden>—</span>
    <span className="sr-only">{labels.empty}</span>
  </>
);

type Side = 'before' | 'after';

type ValueProps = {
  change: AuditChange;
  side: Side;
  labels: AuditDiffLabels;
  formatValue: AuditDiffProps['formatValue'];
};

/** One side of a change, as a value or, for a long text, with the words that moved marked. */
const Value = ({ change, side, labels, formatValue }: ValueProps) => {
  const value = change[side];
  if (isAbsent(value)) return <Empty labels={labels} />;
  if (formatValue) return <>{formatValue(value, change, side)}</>;
  const text = valueText(value);
  const other = side === 'before' ? change.after : change.before;
  if (typeof value !== 'string' || typeof other !== 'string' || !isLongText(text, other)) {
    return <>{text}</>;
  }
  const parts = side === 'before' ? wordDiff(text, other) : wordDiff(other, text);
  const marked = side === 'before' ? 'delete' : 'insert';
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'equal') return <Fragment key={index}>{part.text}</Fragment>;
        if (part.type !== marked) return null;
        const Mark = part.type === 'delete' ? 'del' : 'ins';
        return (
          <Mark key={index} className={part.type === 'delete' ? REMOVED_WORD : ADDED_WORD}>
            <span className="sr-only">
              {part.type === 'delete' ? labels.removed : labels.added}{' '}
            </span>
            {part.text}
          </Mark>
        );
      })}
    </>
  );
};

/**
 * Does the cell hold a word diff: both sides are strings long enough to compare, and the host
 * does not draw the values itself.
 */
const hasWordDiff = ({ before, after }: AuditChange, formatValue: AuditDiffProps['formatValue']) =>
  !formatValue &&
  typeof before === 'string' &&
  typeof after === 'string' &&
  isLongText(before, after);

/**
 * AuditDiff — what an audit log entry changed: each field with its old value and its new one.
 * `table` is a real table (Field, Before, After) that stacks below `sm`; `inline` is one line per
 * field for a feed or timeline entry. The old value is struck through on a red tint and the new one
 * on a green tint, and every cue also has a text: the column headers say Before and After, an
 * absent value reads "empty", and the words that moved in a long text are wrapped in `<del>` and
 * `<ins>` with a visually hidden "removed:" / "added:", so colour is never the only signal.
 * Values are React text, so markup in one shows as written. Each field name and value is isolated
 * in a `<bdi>`, so a phone number or a size keeps its order in a right-to-left page.
 */
export const AuditDiff = ({
  changes,
  variant = 'table',
  formatValue,
  labels: labelOverrides,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ref,
  ...rest
}: AuditDiffProps) => {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const name = { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy };

  if (variant === 'inline') {
    return (
      // Spans, not a `ul`: a Timeline or ActivityFeed entry is a paragraph, which only holds phrasing
      // content. The roles give back the list. The props are a div's, so the ref is cast.
      <span
        ref={ref as Ref<unknown> as Ref<HTMLSpanElement>}
        role="list"
        className={clsx('block space-y-1 text-sm text-[var(--color-text-secondary)]', className)}
        {...(rest as ComponentPropsWithRef<'span'>)}
        {...name}
      >
        {changes.map((change, index) => {
          const wordLevel = hasWordDiff(change, formatValue);
          return (
            <span
              key={`${change.field}-${index}`}
              role="listitem"
              className="block min-w-0 break-words"
            >
              <bdi className="font-medium text-gray-900 dark:text-white">
                {change.label ?? change.field}
              </bdi>
              <span aria-hidden>: </span>
              <span className="sr-only">, {labels.before} </span>
              <span
                className={clsx(
                  'rounded-sm px-1',
                  !wordLevel && !isAbsent(change.before) && REMOVED_CELL
                )}
              >
                <bdi className={clsx(!wordLevel && !isAbsent(change.before) && STRUCK)}>
                  <Value change={change} side="before" labels={labels} formatValue={formatValue} />
                </bdi>
              </span>
              {/* From the old value to the new one, which swap sides in right to left. */}
              <span aria-hidden>
                {' '}
                <span className="inline-block rtl:-scale-x-100">→</span>{' '}
              </span>
              <span className="sr-only">, {labels.after} </span>
              <span
                className={clsx(
                  'rounded-sm px-1',
                  !wordLevel && !isAbsent(change.after) && ADDED_CELL
                )}
              >
                <bdi>
                  <Value change={change} side="after" labels={labels} formatValue={formatValue} />
                </bdi>
              </span>
            </span>
          );
        })}
      </span>
    );
  }

  // Below `sm` the table is laid out as blocks (a header row would have nothing to head), so the
  // roles are written out: `display: block` takes the table semantics from some browsers.
  return (
    <div
      ref={ref}
      className={clsx(
        'overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className
      )}
      {...rest}
    >
      <table
        role="table"
        className="w-full border-collapse text-start text-sm max-sm:block"
        {...name}
      >
        <thead role="rowgroup" className="max-sm:sr-only">
          <tr
            role="row"
            className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/5"
          >
            {[labels.field, labels.before, labels.after].map((header, index) => (
              <th
                key={index}
                role="columnheader"
                scope="col"
                className="py-row-10 px-4 text-xs font-medium text-gray-500 sm:w-[30%] first:sm:w-[20%] dark:text-gray-400"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className="max-sm:block">
          {changes.map((change, index) => {
            const wordLevel = hasWordDiff(change, formatValue);
            return (
              <tr
                key={`${change.field}-${index}`}
                role="row"
                className="border-b border-gray-100 align-top last:border-b-0 max-sm:block dark:border-white/5"
              >
                <th
                  role="rowheader"
                  scope="row"
                  className="py-row-12 max-sm:pb-row-4 min-w-0 px-4 font-medium break-words text-gray-900 max-sm:block dark:text-white"
                >
                  <bdi>{change.label ?? change.field}</bdi>
                </th>
                {(['before', 'after'] as const).map((side) => {
                  const absent = isAbsent(change[side]);
                  const plain = absent || wordLevel;
                  return (
                    <td
                      key={side}
                      role="cell"
                      className={clsx(
                        'py-row-12 max-sm:py-row-6 min-w-0 px-4 break-words max-sm:block',
                        plain
                          ? 'text-[var(--color-text-secondary)]'
                          : side === 'before'
                            ? REMOVED_CELL
                            : ADDED_CELL
                      )}
                    >
                      <span
                        className={clsx(
                          'text-2xs mb-0.5 block font-medium sm:hidden',
                          plain && 'text-gray-500 dark:text-gray-400'
                        )}
                        aria-hidden
                      >
                        {labels[side]}
                      </span>
                      <bdi className={clsx(!plain && side === 'before' && STRUCK)}>
                        <Value
                          change={change}
                          side={side}
                          labels={labels}
                          formatValue={formatValue}
                        />
                      </bdi>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
