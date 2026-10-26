export type FittedSegment = {
  /** Index of the segment in the list the host passed. */
  index: number;
  /** Its value once the sum is held to `max`. */
  value: number;
};

export type FittedSegments = {
  segments: FittedSegment[];
  /** What is left on the track: `max` minus the clamped sum. */
  rest: number;
  /** The clamped sum as a percentage of `max`, 0 to 100. */
  percent: number;
};

/** A value as a percentage of `max`, held between 0 and 100. */
export const toPercent = (value: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

/**
 * Lays segments out in order on a track of `max`: a negative or non-finite
 * value counts for nothing, and each segment gets what is left of the track
 * once the ones before it are placed, so the sum never goes over `max`.
 */
export const fitSegments = (values: readonly number[], max: number): FittedSegments => {
  const total = max > 0 ? max : 0;
  let left = total;
  const segments: FittedSegment[] = [];
  values.forEach((raw, index) => {
    const wanted = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    const value = Math.min(wanted, left);
    left -= value;
    segments.push({ index, value });
  });
  return { segments, rest: left, percent: toPercent(total - left, total) };
};
