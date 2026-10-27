// Pure helpers behind DateTime, RelativeTime, Clock and Countdown: no DOM, no timer, so
// the formats, the relative unit and the refresh delays are tested in Node.

export type DateTimeValue = Date | number | string;

/** Presets of `DateTime`'s `format`, each a set of `Intl.DateTimeFormat` options. */
export type DateTimeFormat = 'date' | 'time' | 'datetime' | 'long' | 'full';

export const DATE_TIME_PRESETS: Record<DateTimeFormat, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: 'medium' },
  time: { timeStyle: 'short' },
  datetime: { dateStyle: 'medium', timeStyle: 'short' },
  long: { dateStyle: 'long', timeStyle: 'medium' },
  // The tooltip's: weekday and zone name included.
  full: { dateStyle: 'full', timeStyle: 'long' },
};

/** Milliseconds since the epoch, `NaN` for a string or a date that does not parse. */
export const toTimestamp = (value: DateTimeValue): number =>
  value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);

/** The longest delay `setTimeout` accepts (a larger one fires at once). */
export const MAX_TIMEOUT = 2 ** 31 - 1;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Intl.DateTimeFormat and RelativeTimeFormat are slow to build and cheap to reuse: a list
// of hundreds of timestamps shares a handful.
const formatters = new Map<string, Intl.DateTimeFormat>();
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

const dateTimeFormatter = (locale: string | undefined, options: Intl.DateTimeFormatOptions) => {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, formatter);
  }
  return formatter;
};

/** `ms` written by a preset or by Intl options, in `timeZone` (the browser's when unset). */
export const formatDateTime = (
  ms: number,
  format: DateTimeFormat | Intl.DateTimeFormatOptions,
  locale?: string,
  timeZone?: string
): string => {
  const options = typeof format === 'string' ? DATE_TIME_PRESETS[format] : format;
  return dateTimeFormatter(locale, timeZone ? { ...options, timeZone } : options).format(ms);
};

// ── Relative time ───────────────────────────────────────────────────────────

type RelativeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

// `ms` is one unit; the unit is used up to `limit`, where the next one takes over. A month is
// 30 days and a year 365: "3 months ago" does not need the calendar.
const RELATIVE_STEPS: { unit: RelativeUnit; ms: number; limit: number }[] = [
  { unit: 'second', ms: SECOND, limit: MINUTE },
  { unit: 'minute', ms: MINUTE, limit: HOUR },
  { unit: 'hour', ms: HOUR, limit: DAY },
  { unit: 'day', ms: DAY, limit: 7 * DAY },
  { unit: 'week', ms: 7 * DAY, limit: 30 * DAY },
  { unit: 'month', ms: 30 * DAY, limit: 365 * DAY },
  { unit: 'year', ms: 365 * DAY, limit: Infinity },
];

const stepFor = (abs: number) =>
  RELATIVE_STEPS.find((step) => abs < step.limit) ?? RELATIVE_STEPS[RELATIVE_STEPS.length - 1]!;

/**
 * The unit and the signed whole count that say `diffMs` (target minus now, so negative for the
 * past): the count is truncated, "59 minutes" until the hour is full.
 */
export const relativeUnit = (diffMs: number): { value: number; unit: RelativeUnit } => {
  const abs = Math.abs(diffMs);
  const step = stepFor(abs);
  const count = Math.floor(abs / step.ms);
  return { value: count === 0 ? 0 : diffMs < 0 ? -count : count, unit: step.unit };
};

/** "5 minutes ago", "in 2 days"; `numeric: 'auto'` gives "now" and "yesterday". */
export const formatRelative = (diffMs: number, locale?: string): string => {
  const key = locale ?? '';
  let formatter = relativeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    relativeFormatters.set(key, formatter);
  }
  const { value, unit } = relativeUnit(diffMs);
  return formatter.format(value, unit);
};

/**
 * Milliseconds until `formatRelative(diffMs)` next differs, as time passes: a second apart in the
 * first minute, a minute apart in the first hour, and so on, so an old date is rarely woken.
 */
export const nextRelativeDelay = (diffMs: number): number => {
  const abs = Math.abs(diffMs);
  const step = stepFor(abs);
  const count = Math.floor(abs / step.ms);
  let delay: number;
  if (diffMs <= 0) {
    // In the past the age grows: the text changes when the next whole unit is full, or the
    // next unit takes over.
    delay = Math.min((count + 1) * step.ms, step.limit) - abs;
  } else if (count === 0) {
    // Under a second ahead reads "now", and so does the first second after it.
    delay = abs + SECOND;
  } else {
    // In the future the time left shrinks: the text changes one millisecond below the whole unit.
    delay = abs - count * step.ms + 1;
  }
  return delay;
};

// ── Clock ───────────────────────────────────────────────────────────────────

export type ClockFormatOptions = {
  locale?: string;
  timeZone?: string;
  /** 12-hour clock when `true`, 24-hour when `false`, the locale's when unset. */
  hour12?: boolean;
  showSeconds?: boolean;
};

/** The time of day in `ms`, hours and minutes, seconds when `showSeconds` is not `false`. */
export const formatClockTime = (
  ms: number,
  { locale, timeZone, hour12, showSeconds = true }: ClockFormatOptions
): string =>
  dateTimeFormatter(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12,
    timeZone,
  }).format(ms);

/** The date in `ms`: `full` is "Thursday, January 15, 2026", `medium` "Jan 15, 2026". */
export const formatClockDate = (
  ms: number,
  dateStyle: 'full' | 'medium',
  locale?: string,
  timeZone?: string
): string => dateTimeFormatter(locale, { dateStyle, timeZone }).format(ms);

/** The tick `ms` falls in: a second, or a minute when the clock shows no seconds. */
export const clockTick = (ms: number, showSeconds: boolean): number => {
  const step = showSeconds ? SECOND : MINUTE;
  return Math.floor(ms / step) * step;
};

/** Milliseconds until the next tick of the clock, on the boundary and not a fixed period after. */
export const nextClockDelay = (ms: number, showSeconds: boolean): number => {
  const step = showSeconds ? SECOND : MINUTE;
  return step - (((ms % step) + step) % step);
};

// ── Countdown ───────────────────────────────────────────────────────────────

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };
export type CountdownUnit = keyof CountdownParts;

const COUNTDOWN_UNITS: CountdownUnit[] = ['days', 'hours', 'minutes', 'seconds'];

/** Whole seconds left, rounded up so the display reads zero only once the target is reached. */
export const remainingSeconds = (targetMs: number, nowMs: number): number =>
  Math.max(0, Math.ceil((targetMs - nowMs) / SECOND));

/**
 * Milliseconds until `remainingSeconds` next drops, `null` once the target is reached (nothing
 * left to wait for).
 */
export const nextCountdownDelay = (targetMs: number, nowMs: number): number | null => {
  const left = targetMs - nowMs;
  if (!(left > 0)) return null;
  return left - (Math.ceil(left / SECOND) - 1) * SECOND;
};

export const countdownParts = (totalSeconds: number): CountdownParts => {
  const total = Math.max(0, Math.floor(totalSeconds));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};

const two = (n: number) => String(n).padStart(2, '0');

/** "02:04:15", with the days before it ("2d 04:15:30") once there are some. */
export const formatCountdownCompact = (parts: CountdownParts, dayLabel: string): string => {
  const clock = `${two(parts.hours)}:${two(parts.minutes)}:${two(parts.seconds)}`;
  return parts.days > 0 ? `${parts.days}${dayLabel} ${clock}` : clock;
};

/** "2d 4h": the largest unit left and the one after it, "30s" at the end. */
export const formatCountdownInline = (
  parts: CountdownParts,
  labels: Record<CountdownUnit, string>
): string => {
  const first = Math.max(
    0,
    COUNTDOWN_UNITS.findIndex((unit) => parts[unit] > 0)
  );
  const start = COUNTDOWN_UNITS.every((unit) => parts[unit] === 0) ? 3 : first;
  return COUNTDOWN_UNITS.slice(start, start + 2)
    .map((unit) => `${parts[unit]}${labels[unit]}`)
    .join(' ');
};
