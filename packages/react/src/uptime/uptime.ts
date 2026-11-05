import { formatDateTime, toTimestamp, type DateTimeValue } from '../data/time';
import { formatLatency } from '../status/health';
import { UPTIME_LABELS, type UptimeLabels } from './labels';
import {
  BEAT_STATUSES,
  type Beat,
  type BeatStatus,
  type UptimeDay,
  type UptimeLevel,
  type UptimeThresholds,
} from './types';

// Pure helpers behind HeartbeatBar, UptimeBars, UptimeStat and MonitorRow: no DOM, so the
// thresholds, the formats and the "how many marks fit" maths are tested in Node.

/** 99.9 % and up is green, 99 % to 99.9 % amber, below 99 % red. */
export const DEFAULT_THRESHOLDS: UptimeThresholds = { good: 0.999, warning: 0.99 };

/**
 * The thresholds a component uses: the defaults, with the limits the host gave. A `warning`
 * limit above `good` would leave no amber range: it is lowered to `good`.
 */
export const resolveThresholds = (given?: Partial<UptimeThresholds>): UptimeThresholds => {
  const good = given?.good ?? DEFAULT_THRESHOLDS.good;
  const warning = Math.min(given?.warning ?? DEFAULT_THRESHOLDS.warning, good);
  return { good, warning };
};

/** The level of an uptime. `null` (no data) and `NaN` are `none`. */
export const uptimeLevel = (
  uptime: number | null | undefined,
  thresholds?: Partial<UptimeThresholds>
): UptimeLevel => {
  if (uptime === null || uptime === undefined || Number.isNaN(uptime)) return 'none';
  const { good, warning } = resolveThresholds(thresholds);
  if (uptime >= good) return 'good';
  if (uptime >= warning) return 'warning';
  return 'bad';
};

/**
 * "99.95%", "100%", "97.4%": at most two decimals, none when they are zero. The value is cut,
 * never rounded up, so 99.999 % never reads "100%": only a perfect uptime does.
 */
export const formatUptime = (uptime: number): string => {
  // The epsilon keeps 0.9995 * 10000 = 9994.999… from losing a hundredth.
  const hundredths = Math.floor(uptime * 10000 + 1e-6) / 100;
  return `${hundredths.toFixed(2).replace(/\.?0+$/, '')}%`;
};

/** "99.9%": a threshold as the legend writes it. */
const formatLimit = (limit: number): string => `${Number((limit * 100).toFixed(4))}%`;

/** The legend of the thresholds, one entry per level: "99.9% and up", "99% to 99.9%"… */
export const thresholdLegend = (
  given?: Partial<UptimeThresholds>,
  labels: UptimeLabels = UPTIME_LABELS
): { level: UptimeLevel; label: string }[] => {
  const { good, warning } = resolveThresholds(given);
  return [
    { level: 'good', label: labels.limitAndUp(formatLimit(good)) },
    { level: 'warning', label: labels.limitRange(formatLimit(warning), formatLimit(good)) },
    { level: 'bad', label: labels.limitBelow(formatLimit(warning)) },
    { level: 'none', label: labels.noData },
  ];
};

/**
 * How many marks of `size` px, `gap` px apart, a row `width` px wide holds. Never negative:
 * a row narrower than one mark holds none.
 */
export const fitCount = (width: number, size: number, gap: number): number =>
  Math.max(0, Math.floor((width + gap) / (size + gap)));

/** The last `count` items, the newest. A count of 0 gives none (`slice(-0)` would give all). */
export const tail = <T>(items: readonly T[], count: number): T[] =>
  count >= items.length ? [...items] : items.slice(items.length - Math.max(0, count));

/**
 * The uptime of a stretch of days: the mean of those with data, `null` when none has any.
 * Each day weighs the same, whatever the number of checks it held.
 */
export const averageUptime = (days: readonly UptimeDay[]): number | null => {
  const known = days.flatMap((day) => (day.uptime === null ? [] : [day.uptime]));
  if (known.length === 0) return null;
  return known.reduce((sum, uptime) => sum + uptime, 0) / known.length;
};

export type BeatCounts = Record<BeatStatus, number>;

export const countBeats = (beats: readonly Beat[]): BeatCounts => {
  const counts: BeatCounts = { up: 0, down: 0, degraded: 0, maintenance: 0, pending: 0 };
  for (const beat of beats) counts[beat.status] += 1;
  return counts;
};

/** "54 up, 3 down, 1 degraded": the statuses present, in the legend's order. */
export const beatsSummary = (
  beats: readonly Beat[],
  labels: UptimeLabels = UPTIME_LABELS
): string => {
  const counts = countBeats(beats);
  return BEAT_STATUSES.filter((status) => counts[status] > 0)
    .map((status) => labels.beatCount(counts[status], labels[status]))
    .join(', ');
};

/** A date and a time to the second, in the reader's time zone: "Jan 15, 2026, 6:42:10 AM". */
export const formatBeatTime = (
  time: DateTimeValue,
  labels: UptimeLabels = UPTIME_LABELS
): string => {
  const ms = toTimestamp(time);
  return Number.isFinite(ms)
    ? formatDateTime(ms, { dateStyle: 'medium', timeStyle: 'medium' })
    : labels.unknownTime;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * "Jan 15, 2026". A bare `YYYY-MM-DD` is read in UTC and written in UTC, so it names the same
 * day for a reader on either side of the date line; any other value is written in the reader's
 * time zone.
 */
export const formatDay = (date: DateTimeValue, labels: UptimeLabels = UPTIME_LABELS): string => {
  const ms = toTimestamp(date);
  if (!Number.isFinite(ms)) return labels.unknownDate;
  const utc = typeof date === 'string' && DATE_ONLY.test(date);
  return formatDateTime(ms, { dateStyle: 'medium' }, undefined, utc ? 'UTC' : undefined);
};

/** The lines that say what a beat found: its status, when, how fast, and why. */
export const beatLines = (beat: Beat, labels: UptimeLabels = UPTIME_LABELS): string[] => {
  const lines = [`${labels[beat.status]} · ${formatBeatTime(beat.time, labels)}`];
  const detail = [
    beat.latency !== undefined ? formatLatency(beat.latency) : undefined,
    beat.message,
  ].filter(Boolean);
  if (detail.length > 0) lines.push(detail.join(' · '));
  return lines;
};

/** The accessible name of a beat: "Down, Jan 15, 2026, 6:42:10 AM, 5,003 ms, Timeout". */
export const beatName = (beat: Beat, labels: UptimeLabels = UPTIME_LABELS): string =>
  [
    labels[beat.status],
    formatBeatTime(beat.time, labels),
    beat.latency !== undefined ? formatLatency(beat.latency) : undefined,
    beat.message,
  ]
    .filter(Boolean)
    .join(', ');

const incidentsText = (incidents: number | undefined, labels: UptimeLabels): string =>
  incidents === undefined || incidents === 0 ? labels.noIncident : labels.incidents(incidents);

const dayFacts = (day: UptimeDay, labels: UptimeLabels): string[] =>
  day.uptime === null
    ? [labels.noData]
    : [labels.uptimeOf(formatUptime(day.uptime)), incidentsText(day.incidents, labels)];

/** The lines that say how a day went: its date, then its uptime and incidents. */
export const dayLines = (day: UptimeDay, labels: UptimeLabels = UPTIME_LABELS): string[] => [
  formatDay(day.date, labels),
  dayFacts(day, labels).join(' · '),
];

/** The accessible name of a day: "Jan 15, 2026: 99.95% uptime, 1 incident". */
export const dayName = (day: UptimeDay, labels: UptimeLabels = UPTIME_LABELS): string =>
  `${formatDay(day.date, labels)}: ${dayFacts(day, labels).join(', ')}`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long a period of `durationMs` was down at `uptime`, in words: "39 min", "2 h 5 min",
 * "3 d 4 h", "42 s". A perfect uptime is "No downtime".
 */
export const downtimeText = (
  uptime: number,
  durationMs: number,
  labels: UptimeLabels = UPTIME_LABELS
): string => {
  const down = Math.max(0, (1 - uptime) * durationMs);
  if (down < 500) return labels.noDowntime;
  if (down < MINUTE) return labels.seconds(Math.round(down / 1000));
  // Rounded to the unit before it is split, so 2 d 23 h 40 min reads "3 d", not "2 d 24 h".
  if (down < HOUR) return labels.minutes(Math.round(down / MINUTE));
  if (down < DAY) {
    const minutes = Math.round(down / MINUTE);
    const [hours, rest] = [Math.floor(minutes / 60), minutes % 60];
    return labels.hours(hours, rest);
  }
  const hoursTotal = Math.round(down / HOUR);
  const [days, hours] = [Math.floor(hoursTotal / 24), hoursTotal % 24];
  return labels.days(days, hours);
};

/** Whether a period at `uptime` was down for less than half a second: `downtimeText` says "no downtime". */
export const isNoDowntime = (uptime: number, durationMs: number): boolean =>
  Math.max(0, (1 - uptime) * durationMs) < 500;

/** "12 days left", "1 day left", "Expires today", "Expired". */
export const daysLeftText = (days: number, labels: UptimeLabels = UPTIME_LABELS): string => {
  if (days < 0) return labels.expired;
  if (days < 1) return labels.expiresToday;
  return labels.daysLeft(Math.floor(days));
};
