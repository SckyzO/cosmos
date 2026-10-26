import { STATUS_CRIT, STATUS_WARN, SUCCESS } from './colors';

/** A value as a percentage, the default `formatValue` of the radial charts. */
export const percent = (value: number) => `${value}%`;

/** The value clamped to `min`–`max`: a gauge's arc stops at an end, its text still gives the value. */
export const clampTo = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** The name a gauge is read by: `name` (the host's `ariaLabel`, else the label) and the formatted value. */
export const gaugeName = (name: string, formatted: string) => `${name}: ${formatted}`;

/**
 * The arc color of a status gauge: success, then warning from `warnAt` and
 * critical from `critAt`. A threshold left out is never reached.
 */
export const statusColor = (value: number, warnAt?: number, critAt?: number) =>
  value >= (critAt ?? Infinity)
    ? STATUS_CRIT
    : value >= (warnAt ?? Infinity)
      ? STATUS_WARN
      : SUCCESS;

/** Where `value` sits in `min`–`max`, from 0 (the start) to 1 (the end); one outside the range stops at an end. */
export const rangeShare = (value: number, min: number, max: number) =>
  (clampTo(value, min, max) - min) / (max - min);

/**
 * The two ends of a radial mark across a half-circle arc that opens upward,
 * centered on (`cx`, `cy`): at `share` of the arc (0 on the left end, 1 on the
 * right one), from the radius `inner` to the radius `outer`.
 */
export const arcMark = (
  { cx, cy }: { cx: number; cy: number },
  { inner, outer }: { inner: number; outer: number },
  share: number
) => {
  const angle = Math.PI * (1 - share);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return {
    x1: cx + inner * cos,
    y1: cy - inner * sin,
    x2: cx + outer * cos,
    y2: cy - outer * sin,
  };
};
