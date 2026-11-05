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

/**
 * A rate with one decimal: `54.8%`. With no `locale` the decimal is a fixed `.`, whatever the
 * machine's, and with one it is written as that locale writes a percent (`54,8 %` in `fr-FR`).
 */
export const formatRate = (rate: number, locale?: string): string =>
  locale === undefined
    ? `${rate.toFixed(1)}%`
    : new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        useGrouping: false,
      }).format(rate);
