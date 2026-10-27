import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { useIsClient } from '../hooks/useIsClient';
import { useTicker } from '../hooks/useTicker';
import { INTENT_STYLE } from '../ui/intent';
import { clockTick, formatClockDate, formatClockTime, nextClockDelay } from './time';

/** `inline` sits in a line or a topbar, `card` is a dashboard widget, `display` is for a wall or a kiosk. */
export type ClockVariant = 'inline' | 'card' | 'display';

export type ClockProps = {
  /** Default `inline`. */
  variant?: ClockVariant;
  /** IANA zone (`Asia/Tokyo`). Default: the browser's zone. */
  timeZone?: string;
  /** BCP 47 tag (`fr-FR`). Default: the browser's language. */
  locale?: string;
  /** 12-hour clock when `true`, 24-hour when `false`. Default: the locale's. */
  hour12?: boolean;
  /** Shows the seconds, and ticks every second; without, it ticks every minute. Default `true`. */
  showSeconds?: boolean;
  /** Shows the date under the time (before it, in `inline`). Default `false`. */
  showDate?: boolean;
  /** Names the zone ("Tokyo"), above the time (before it, in `inline`). */
  label?: ReactNode;
  /**
   * Freezes the clock at this moment, and sets no timer. For stories and tests; leave it unset in
   * an app.
   */
  now?: Date | number;
  className?: string;
};

const ROOT: Record<ClockVariant, string> = {
  inline: 'inline-flex flex-wrap items-baseline gap-x-2 text-sm',
  card: clsx(
    'flex flex-col rounded-2xl border bg-white p-5 dark:bg-gray-900',
    INTENT_STYLE.neutral.border
  ),
  display: 'flex flex-col items-center text-center',
};

const LABEL: Record<ClockVariant, string> = {
  inline: 'text-gray-500 dark:text-gray-400',
  card: 'text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400',
  display: 'text-lg font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400',
};

const TIME: Record<ClockVariant, string> = {
  inline: 'font-medium text-gray-900 dark:text-white',
  card: 'mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white',
  display:
    'mt-2 text-4xl font-bold tracking-tight whitespace-nowrap text-gray-900 sm:text-7xl lg:text-8xl dark:text-white',
};

const DATE: Record<ClockVariant, string> = {
  inline: 'text-gray-500 dark:text-gray-400',
  card: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
  display: 'mt-3 text-lg text-gray-500 dark:text-gray-400',
};

// What each part reads before the browser's locale and zone are known: the dashes keep the
// width of the digits, so the clock does not jump when the time appears.
const PLACEHOLDER = { time: '--:--:--', timeNoSeconds: '--:--', date: '' };

/**
 * Clock — the time in a zone, ticking on the second boundary (on the minute without seconds):
 * a timeout to the next boundary, not an interval that drifts. It is a `timer` that is not
 * announced; every `Clock` on a page shares one timer. It renders in the browser only, with
 * dashes of the same width until then.
 */
export const Clock = ({
  variant = 'inline',
  timeZone,
  locale,
  hour12,
  showSeconds = true,
  showDate = false,
  label,
  now,
  className,
}: ClockProps) => {
  const isClient = useIsClient();
  const read = useCallback((at: number) => clockTick(at, showSeconds), [showSeconds]);
  const delay = useCallback((at: number) => nextClockDelay(at, showSeconds), [showSeconds]);
  const tick = useTicker(read, delay, now);
  const time = isClient
    ? formatClockTime(tick, { locale, timeZone, hour12, showSeconds })
    : showSeconds
      ? PLACEHOLDER.time
      : PLACEHOLDER.timeNoSeconds;
  const date =
    showDate && isClient
      ? formatClockDate(tick, variant === 'inline' ? 'medium' : 'full', locale, timeZone)
      : null;
  return (
    <div role="timer" className={clsx(ROOT[variant], className)}>
      {label && <span className={LABEL[variant]}>{label}</span>}
      <span className={clsx('tabular-nums', TIME[variant])}>{time}</span>
      {showDate && <span className={DATE[variant]}>{date ?? ' '}</span>}
    </div>
  );
};
