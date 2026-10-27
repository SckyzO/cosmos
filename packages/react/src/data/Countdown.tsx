import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useIsClient } from '../hooks/useIsClient';
import { useTicker } from '../hooks/useTicker';
import { INTENT_STYLE } from '../ui/intent';
import {
  countdownParts,
  formatCountdownCompact,
  formatCountdownInline,
  nextCountdownDelay,
  remainingSeconds,
  toTimestamp,
  type CountdownUnit,
  type DateTimeValue,
} from './time';

export type { CountdownUnit } from './time';

/** `tiles` boxes days, hours, minutes and seconds; `inline` reads "Ends in 2d 4h"; `compact` is "02:04:15". */
export type CountdownVariant = 'tiles' | 'inline' | 'compact';

export type CountdownProps = {
  /** The moment to count down to: a `Date`, a timestamp in milliseconds or an ISO 8601 string. */
  target: DateTimeValue;
  /** Default `tiles`. */
  variant?: CountdownVariant;
  /**
   * Called once when the count reaches zero, then the countdown stops. It is also called on mount
   * when `target` is already past. A new `target` in the future arms it again.
   */
  onComplete?: () => void;
  /** The captions of the `tiles`, for another language. Default `Days`, `Hours`, `Minutes`, `Seconds`. */
  labels?: Partial<Record<CountdownUnit, string>>;
  /** The suffixes of `inline` and `compact`, for another language. Default `d`, `h`, `m`, `s`. */
  shortLabels?: Partial<Record<CountdownUnit, string>>;
  /** `inline` only: the text before the count. Default `Ends in`. */
  label?: ReactNode;
  /** `inline` only: the text once the count has reached zero. Default `Ended`. */
  completedLabel?: ReactNode;
  /** Names the timer. `compact` defaults to the full count ("2 days 4 hours…"), read from `labels`. */
  'aria-label'?: string;
  /**
   * Freezes the countdown at this moment, and sets no timer. For stories and tests; leave it unset in
   * an app.
   */
  now?: Date | number;
  className?: string;
};

const UNITS: CountdownUnit[] = ['days', 'hours', 'minutes', 'seconds'];

const LABELS: Record<CountdownUnit, string> = {
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
};

const SHORT_LABELS: Record<CountdownUnit, string> = {
  days: 'd',
  hours: 'h',
  minutes: 'm',
  seconds: 's',
};

const two = (n: number) => String(n).padStart(2, '0');

/**
 * Countdown — counts down to `target`, in boxes (`tiles`), in a sentence (`inline`) or as a
 * clock (`compact`). It is a `timer` that is not announced every second, calls `onComplete` once
 * and stops at zero. It renders in the browser only, with dashes of the same width until then.
 */
export const Countdown = ({
  target,
  variant = 'tiles',
  onComplete,
  labels,
  shortLabels,
  label = 'Ends in',
  completedLabel = 'Ended',
  'aria-label': ariaLabel,
  now,
  className,
}: CountdownProps) => {
  const isClient = useIsClient();
  const targetMs = toTimestamp(target);
  const read = useCallback((at: number) => remainingSeconds(targetMs, at), [targetMs]);
  const delay = useCallback((at: number) => nextCountdownDelay(targetMs, at), [targetMs]);
  const seconds = useTicker(read, delay, now);
  const done = Number.isFinite(targetMs) && seconds === 0;

  // Once per target: a re-render, or Strict Mode running the effect twice, must not call it again.
  const firedFor = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  useEffect(() => {
    if (!done) {
      firedFor.current = null;
      return;
    }
    if (firedFor.current === targetMs) return;
    firedFor.current = targetMs;
    onCompleteRef.current?.();
  }, [done, targetMs]);

  const long = { ...LABELS, ...labels };
  const short = { ...SHORT_LABELS, ...shortLabels };
  const parts = countdownParts(seconds);
  // Dashes in the same layout until the browser is there, and for a target that is no date.
  const blank = !isClient || !Number.isFinite(targetMs);
  const digits = (unit: CountdownUnit) => (blank ? '--' : two(parts[unit]));

  if (variant === 'tiles')
    return (
      <div
        role="timer"
        aria-label={ariaLabel}
        className={clsx('grid grid-cols-4 gap-2 sm:gap-3', className)}
      >
        {UNITS.map((unit) => (
          <div
            key={unit}
            className={clsx(
              'flex min-w-0 flex-col items-center rounded-xl border bg-white px-1 py-3 sm:px-3 sm:py-4 dark:bg-gray-900',
              INTENT_STYLE.neutral.border
            )}
          >
            <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums sm:text-4xl dark:text-white">
              {digits(unit)}
            </span>
            <span className="text-3xs mt-1 max-w-full truncate tracking-wider text-gray-500 uppercase sm:text-xs dark:text-gray-400">
              {long[unit]}
            </span>
          </div>
        ))}
      </div>
    );

  if (variant === 'compact')
    return (
      <span
        role="timer"
        aria-label={
          ariaLabel ??
          (blank
            ? undefined
            : UNITS.filter((unit) => unit !== 'days' || parts.days > 0)
                .map((unit) => `${parts[unit]} ${long[unit].toLowerCase()}`)
                .join(' '))
        }
        className={clsx(
          'text-sm font-medium text-gray-900 tabular-nums dark:text-white',
          className
        )}
      >
        {blank ? '--:--:--' : formatCountdownCompact(parts, short.days)}
      </span>
    );

  return (
    <span
      role="timer"
      aria-label={ariaLabel}
      className={clsx('text-sm text-gray-500 tabular-nums dark:text-gray-400', className)}
    >
      {done ? (
        completedLabel
      ) : (
        <>
          {label}
          {label ? ' ' : null}
          <span className="font-medium text-gray-900 dark:text-white">
            {blank ? '--' : formatCountdownInline(parts, short)}
          </span>
        </>
      )}
    </span>
  );
};
