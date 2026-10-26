/**
 * Conversion from one stage to the next, in percent: `current / previous * 100`. Above 100 when
 * a stage is larger than the one before it. `null` when there is nothing to divide by (the
 * previous stage is at 0 or below) or a count is not a finite, non-negative number: no rate is
 * shown rather than `Infinity%` or `NaN%`.
 */
export const conversionRate = (previous: number, current: number): number | null => {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return null;
  if (previous <= 0 || current < 0) return null;
  return (current / previous) * 100;
};

/** A rate with one decimal and a fixed `.`, whatever the machine's locale: `54.8%`. */
export const formatRate = (rate: number): string => `${rate.toFixed(1)}%`;
