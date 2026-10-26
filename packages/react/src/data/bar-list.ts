/** The scale of a list: its largest value, or 0 for no items. */
export const largestValue = (values: readonly number[]) =>
  values.length === 0 ? 0 : Math.max(...values);

/**
 * Width of a bar, 0 to 100, against `max`. A value at or under zero, a `max` at or under zero (a
 * list of zeros) and a non-finite value draw no bar; a value above `max` is capped.
 */
export const barPercent = (value: number, max: number) => {
  if (!Number.isFinite(value) || !(max > 0) || value <= 0) return 0;
  return Math.min(100, (value / max) * 100);
};
