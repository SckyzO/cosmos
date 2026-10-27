import { clsx } from 'clsx';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { INTENT_STYLE, type Intent } from '../ui/intent';

export type TrendDeltaSize = 'sm' | 'md';

export type TrendDeltaProps = {
  /** The signed change. Its sign picks the arrow; `goodDirection` picks the color. */
  value: number;
  /** Writes the value. Default: signed, one decimal, as a percent (`+12.4%`, `-3.1%`, `0.0%`). */
  format?: (value: number) => string;
  /**
   * Which way is good news. `up` (default) turns a rise green and a drop red; `down` is for a
   * metric that should shrink (churn, latency, cost): a drop is green, with a downward arrow.
   */
  goodDirection?: 'up' | 'down';
  /** What the change is measured against, as muted text after the pill: "vs last month". */
  label?: ReactNode;
  size?: TrendDeltaSize;
  className?: string;
};

// A fixed locale keeps the default output the same on every machine.
const PERCENT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  // A + in front of a rise as well as a - in front of a drop, and nothing in front of zero.
  signDisplay: 'exceptZero',
});
const defaultFormat = (value: number) => `${PERCENT.format(value)}%`;

const SIZE_CLASS: Record<TrendDeltaSize, { pill: string; icon: string; label: string }> = {
  sm: { pill: 'gap-0.5 px-1.5 text-2xs', icon: 'size-3', label: 'text-xs' },
  md: { pill: 'gap-1 px-2 text-xs', icon: 'size-3.5', label: 'text-sm' },
};

/**
 * TrendDelta — a signed change as a tinted pill: trend arrow and value, then the period it is
 * measured against. The arrow follows the sign of `value`; the color follows whether that
 * direction is the good one (`goodDirection`), and zero is neutral. The arrow is decorative and a
 * visually hidden "increase" / "decrease" / "no change" is read before the value, so the color is
 * never the only cue. Standalone in a list or a table, or in the `delta` slot of a `KpiCard`.
 */
export const TrendDelta = ({
  value,
  format = defaultFormat,
  goodDirection = 'up',
  label,
  size = 'md',
  className,
}: TrendDeltaProps) => {
  const direction = value > 0 ? 'increase' : value < 0 ? 'decrease' : 'no change';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const intent: Intent =
    value === 0 ? 'neutral' : value > 0 === (goodDirection === 'up') ? 'success' : 'danger';
  const { tile, text } = INTENT_STYLE[intent];
  const sizes = SIZE_CLASS[size];
  return (
    <span className={clsx('inline-flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <span
        className={clsx(
          'inline-flex items-center rounded-full py-0.5 font-semibold tabular-nums',
          tile,
          text,
          sizes.pill
        )}
      >
        <Icon className={clsx('shrink-0', sizes.icon)} aria-hidden />
        <span className="sr-only">{direction} </span>
        <bdi>{format(value)}</bdi>
      </span>
      {label && (
        <span className={clsx('text-gray-500 dark:text-gray-400', sizes.label)}>{label}</span>
      )}
    </span>
  );
};
