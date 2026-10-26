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
