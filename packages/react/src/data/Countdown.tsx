import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useIsClient } from '../hooks/useIsClient';
import { useTicker } from '../hooks/useTicker';
import { INTENT_STYLE, type Intent } from '../ui/intent';
import {
  countdownParts,
  formatCountdownClock,
  formatCountdownInline,
  nextCountdownDelay,
  remainingSeconds,
  toTimestamp,
  type CountdownUnit,
  type DateTimeValue,
} from './time';

export type { CountdownUnit } from './time';

/**
 * `tiles` boxes days, hours, minutes and seconds; `inline` reads "Ends in 2d 4h"; `compact` is
 * "02:04:15"; `card` is one bordered card with a caption over the clock, like `Clock`'s; `display`
 * is huge digits for a wall screen.
 */
export type CountdownVariant = 'tiles' | 'inline' | 'compact' | 'card' | 'display';

/** The size of the `tiles`: `md` is the default. */
export type CountdownSize = 'sm' | 'md' | 'lg';

export type CountdownProps = {
  /** The moment to count down to: a `Date`, a timestamp in milliseconds or an ISO 8601 string. */
  target: DateTimeValue;
  /** Default `tiles`. */
  variant?: CountdownVariant;
  /** `tiles` only: `sm`, `md` (default) or `lg`. */
  size?: CountdownSize;
  /**
   * The units `tiles`, `card` and `display` show, default all four. A unit left out rolls into the
   * next smaller one: without `days`, 2 days 4 hours read 52 hours. In `card` and `display` the
   * days also stay out of the clock while there are none left ("02:04:15", then "2d 04:15:30").
   */
  units?: CountdownUnit[];
  /** The meaning of the count, as a color: `neutral` (default), or any `Intent`. */
  intent?: Intent;
  /**
   * Seconds left under which the intent becomes `danger`, whatever `intent` says: "The sale ends"
   * in red for the last hour (`3600`). Unset: the color never changes.
   */
  urgentBelow?: number;
  /**
   * Called once when the count reaches zero, then the countdown stops. It is also called on mount
   * when `target` is already past. A new `target` in the future arms it again.
   */
  onComplete?: () => void;
  /** The captions of the `tiles`, for another language. Default `Days`, `Hours`, `Minutes`, `Seconds`. */
  labels?: Partial<Record<CountdownUnit, string>>;
  /** The suffixes of `inline`, `compact`, `card` and `display`, for another language. Default `d`, `h`, `m`, `s`. */
  shortLabels?: Partial<Record<CountdownUnit, string>>;
  /**
   * `inline`, `card` and `display`: the text before the count (above it, in `card` and `display`).
   * Default `Ends in`; `null` for none.
   */
  label?: ReactNode;
  /**
   * `inline`, `card` and `display`: the text once the count has reached zero, in place of `label`.
   * Default `Ended`.
   */
  completedLabel?: ReactNode;
  /** Names the timer. `compact`, `card` and `display` default to the full count ("2 days 4 hours…"), read from `labels`. */
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

// The tiles, by size: `md` is how they always looked.
const TILE_SIZE: Record<CountdownSize, { box: string; digits: string; caption: string }> = {
  sm: {
    box: 'rounded-lg px-1 py-2 sm:px-2 sm:py-2.5',
    digits: 'text-lg sm:text-2xl',
    caption: 'text-3xs mt-0.5',
  },
  md: {
    box: 'rounded-xl px-1 py-3 sm:px-3 sm:py-4',
    digits: 'text-2xl sm:text-4xl',
    caption: 'text-3xs mt-1 sm:text-xs',
  },
  lg: {
    box: 'rounded-xl px-2 py-4 sm:px-4 sm:py-6',
    digits: 'text-3xl sm:text-6xl',
    caption: 'text-2xs mt-1.5 sm:text-sm',
  },
};

// A boxed countdown (tiles, card): neutral is a white card; any other intent tints the box and
// takes its text color, for the digits and the caption alike.
const surfaceOf = (intent: Intent) =>
  intent === 'neutral'
    ? clsx('bg-white dark:bg-gray-900', INTENT_STYLE.neutral.border)
    : INTENT_STYLE[intent].surface;
const digitsOf = (intent: Intent) =>
  intent === 'neutral' ? 'text-gray-900 dark:text-white' : INTENT_STYLE[intent].text;
const captionOf = (intent: Intent) =>
  intent === 'neutral' ? 'text-gray-500 dark:text-gray-400' : INTENT_STYLE[intent].text;

/**
 * Countdown — counts down to `target`, in boxes (`tiles`), in a sentence (`inline`), as a clock
 * (`compact`), in a card (`card`) or in digits for a wall screen (`display`). It is a `timer` that
 * is not announced every second, calls `onComplete` once and stops at zero. It renders in the
 * browser only, with dashes of the same width until then.
 */
export const Countdown = ({
  target,
  variant = 'tiles',
  size = 'md',
  units,
  intent = 'neutral',
  urgentBelow,
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
  // Dashes in the same layout until the browser is there, and for a target that is no date.
  const blank = !isClient || !Number.isFinite(targetMs);
  // The tiles, the card and the display show `units`; the one-line forms always read the four.
  const shown = units && units.length > 0 ? UNITS.filter((unit) => units.includes(unit)) : UNITS;
  const parts = countdownParts(
    seconds,
    variant === 'inline' || variant === 'compact' ? UNITS : shown
  );
  const digits = (unit: CountdownUnit) => (blank ? '--' : two(parts[unit]));
  // The count read aloud: the units shown, the days only once there are some.
  const spoken = (list: CountdownUnit[]) =>
    list
      .filter((unit) => unit !== 'days' || parts.days > 0)
      .map((unit) => `${parts[unit]} ${long[unit].toLowerCase()}`)
      .join(' ');
  // Under `urgentBelow` seconds the count is `danger`; before the browser knows the time, it is not.
  const tone: Intent =
    !blank && urgentBelow !== undefined && seconds < urgentBelow ? 'danger' : intent;

  if (variant === 'tiles') {
    const look = TILE_SIZE[size];
    return (
      <div
        role="timer"
        aria-label={ariaLabel}
        className={clsx('grid auto-cols-fr grid-flow-col gap-2 sm:gap-3', className)}
      >
        {shown.map((unit) => (
          <div
            key={unit}
            className={clsx('flex min-w-0 flex-col items-center border', look.box, surfaceOf(tone))}
          >
            <span
              className={clsx('font-bold tracking-tight tabular-nums', look.digits, digitsOf(tone))}
            >
              {digits(unit)}
            </span>
            <span
              className={clsx(
                'max-w-full truncate tracking-wider uppercase',
                look.caption,
                captionOf(tone)
              )}
            >
              {long[unit]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card' || variant === 'display') {
    const card = variant === 'card';
    const caption = done ? completedLabel : label;
    const clock = blank
      ? shown
          .filter((unit) => unit !== 'days')
          .map(() => '--')
          .join(':') || '--'
      : formatCountdownClock(parts, shown, short.days);
    return (
      <div
        role="timer"
        aria-label={ariaLabel ?? (blank ? undefined : spoken(shown))}
        className={clsx(
          card
            ? clsx('flex flex-col rounded-2xl border p-5', surfaceOf(tone))
            : 'flex flex-col items-center text-center',
          className
        )}
      >
        {caption !== null && caption !== undefined && caption !== '' && (
          <span
            className={clsx(
              'font-medium tracking-wider uppercase',
              card ? 'text-xs' : 'text-lg',
              captionOf(tone)
            )}
          >
            <bdi>{caption}</bdi>
          </span>
        )}
        <span
          className={clsx(
            'mt-2 font-bold tracking-tight tabular-nums',
            card ? 'text-3xl' : 'text-4xl whitespace-nowrap sm:text-7xl lg:text-8xl',
            digitsOf(tone)
          )}
        >
          <bdi>{clock}</bdi>
        </span>
      </div>
    );
  }

  if (variant === 'compact')
    return (
      <span
        role="timer"
        aria-label={ariaLabel ?? (blank ? undefined : spoken(UNITS))}
        className={clsx('text-sm font-medium tabular-nums', digitsOf(tone), className)}
      >
        <bdi>{blank ? '--:--:--' : formatCountdownClock(parts, UNITS, short.days)}</bdi>
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
          <span className={clsx('font-medium', digitsOf(tone))}>
            <bdi>{blank ? '--' : formatCountdownInline(parts, short)}</bdi>
          </span>
        </>
      )}
    </span>
  );
};
