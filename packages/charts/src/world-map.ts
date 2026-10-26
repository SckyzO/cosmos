// The maths of WorldMap: the five color steps of a set of values, the step of a
// value, the bounds the legend prints and the order the keyboard walks the
// countries in. No DOM and no colors, so it runs in plain Node.

/** How many color steps the scale has. */
export const STEPS = 5;

export type Scale = {
  /** The lower bound of steps 1 to 4: a value at or above `thresholds[i]` is in step `i + 1` at least. */
  thresholds: number[];
  /** The lower bound of each step, step 0 first: what the legend prints. */
  bounds: number[];
  /** The ends values are clamped to, or `undefined` for none. */
  min?: number;
  max?: number;
};

/** The value kept inside `min` and `max`; an end that is not given leaves that side open. */
export const clamp = (value: number, min?: number, max?: number): number =>
  Math.min(Math.max(value, min ?? -Infinity), max ?? Infinity);

/**
 * The scale of a set of values: five steps by quantiles, so each step holds
 * about as many countries. The thresholds are the values a fifth, two fifths…
 * of the way up the sorted list, which a linear scale cannot do: one large
 * country would otherwise wash every other one out. A repeated value can
 * leave a step empty (all values equal: only the top step is used).
 *
 * `min` and `max` clamp every value before the quantiles are taken (a value
 * under `min` counts as `min`, one over `max` as `max`), so an outlier takes
 * the top step without stretching the others. `min` is also the first bound
 * the legend prints. Given the wrong way round they are swapped. `undefined`
 * when there is no finite value.
 */
export const scaleOf = (
  values: readonly number[],
  min?: number,
  max?: number
): Scale | undefined => {
  const [low, high] = min !== undefined && max !== undefined && min > max ? [max, min] : [min, max];
  const sorted = values
    .filter(Number.isFinite)
    .map((value) => clamp(value, low, high))
    .sort((a, b) => a - b);
  if (sorted.length === 0) return undefined;
  const thresholds = [1, 2, 3, 4].map((q) => sorted[Math.floor((sorted.length * q) / STEPS)]);
  return { thresholds, bounds: [low ?? sorted[0], ...thresholds], min: low, max: high };
};

/** The step, 0 to 4, of a value: the number of thresholds it reaches. */
export const stepOf = (value: number, scale: Scale): number => {
  const clamped = clamp(value, scale.min, scale.max);
  return scale.thresholds.filter((threshold) => clamped >= threshold).length;
};

/** The countries that have a value, largest first and, for equal values, by name: the order of the keyboard walk and of the hidden table. */
export const ranked = <T extends { name: string; value?: number }>(
  countries: readonly T[]
): (T & { value: number })[] =>
  countries
    .filter((country): country is T & { value: number } => country.value !== undefined)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

/** The country `delta` places from `current` in `order`, stopping at the ends; the first one when `current` is not in it. */
export const walk = <T extends { code: string }>(
  order: readonly T[],
  current: string | undefined,
  delta: number
): T | undefined => {
  const index = order.findIndex((country) => country.code === current);
  if (index < 0) return order[0];
  return order[Math.min(Math.max(index + delta, 0), order.length - 1)];
};
