import type { SeriesInput } from './data';

/**
 * The series of a mirrored chart, to draw: the first on the negative side of
 * the central axis, the others on the positive one. The values of a mirrored
 * chart are magnitudes (a population is not below zero), so the sign one
 * arrives with is dropped. A missing point stays missing. What it is given is
 * not changed.
 */
export const mirrorSeries = <T extends SeriesInput>(series: readonly T[]): T[] =>
  series.map((s, index) => ({
    ...s,
    data: s.data.map((value) =>
      typeof value === 'number' ? (index === 0 ? -Math.abs(value) : Math.abs(value)) : value
    ),
  }));

/**
 * `format` for a mirrored chart's labels and tooltip: it gets the magnitude, so
 * the side a value was drawn on never shows as a minus sign.
 */
export const absolute =
  (format?: (value: number) => string) =>
  (value: number): string =>
    (format ?? String)(Math.abs(value));

// The steps a value axis counts by, in a power of ten: 1, 2, 2.5 or 5 (and 10 for the next power).
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
 * The domain of the value axis of a mirrored chart: as far on each side of zero,
 * and no further than the data's larger side asks for a round number. The axis
 * has five ticks, so the reach is twice a step of 1, 2, 2.5 or 5 times a power of
 * ten: `[-20, 20]` for data up to 17 (ticks at 20, 10, 0, 10, 20), where Recharts'
 * own domain would stop at 17 and put no tick on zero. Zero data gives `[-1, 1]`.
 */
export const symmetricDomain = ([min, max]: readonly [number, number]): [number, number] => {
  const reach = Math.max(Math.abs(min), Math.abs(max));
  if (!(reach > 0)) return [-1, 1];
  const half = reach / 2;
  const power = 10 ** Math.floor(Math.log10(half));
  const step = (NICE_STEPS.find((nice) => nice * power >= half * (1 - 1e-9)) ?? 10) * power;
  const nice = Number((2 * step).toPrecision(12));
  return [-nice, nice];
};
