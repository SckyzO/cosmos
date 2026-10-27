import type { DateTimeValue } from '../data/time';

/**
 * What one check of a monitor found. `maintenance` is a planned window, `pending` a check
 * that has not run or has not answered yet.
 */
export type BeatStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'pending';

/**
 * One check of a monitor: when it ran and what it found. `latency` is in milliseconds.
 * `time` is a `Date`, a timestamp in milliseconds or an ISO 8601 string. `message` says why
 * (a timeout, an HTTP status), and shows in the beat's tooltip.
 */
export type Beat = {
  time: DateTimeValue;
  status: BeatStatus;
  latency?: number;
  message?: string;
};

/**
 * One day of history. `uptime` is a share from 0 to 1 (0.9995 is 99.95 %), or `null` for a day
 * with no data (the monitor did not exist yet, or was paused). `date` is a `Date`, a timestamp or
 * an ISO string; a bare `YYYY-MM-DD` names that calendar day whatever the time zone of the
 * reader. `incidents` is how many incidents the day had.
 */
export type UptimeDay = {
  date: DateTimeValue;
  uptime: number | null;
  incidents?: number;
};

/**
 * The limits that colour an uptime, as shares from 0 to 1. An uptime of `good` or more is
 * green, one from `warning` up to `good` is amber, one below `warning` is red. Defaults: 0.999
 * (99.9 %) and 0.99 (99 %).
 */
export type UptimeThresholds = {
  good: number;
  warning: number;
};

/** What a threshold makes of an uptime. `none` is a day with no data. */
export type UptimeLevel = 'good' | 'warning' | 'bad' | 'none';

/** The statuses of a beat, worst last, as the legend lists them. */
export const BEAT_STATUSES: readonly BeatStatus[] = [
  'up',
  'degraded',
  'down',
  'maintenance',
  'pending',
];

/** The reading of each status, for names, tooltips and legends. */
export const BEAT_NAME: Record<BeatStatus, string> = {
  up: 'Up',
  down: 'Down',
  degraded: 'Degraded',
  maintenance: 'Maintenance',
  pending: 'Pending',
};
