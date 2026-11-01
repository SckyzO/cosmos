import { clsx } from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';

/** The five levels a score of 0 to 4 stands for, from the weakest. */
export type PasswordStrengthLevels = readonly [string, string, string, string, string];

export type PasswordStrengthLabels = {
  /** The words before the level, in the visible text and in the announcement. Default "Password strength". */
  name?: string;
  /** The level for each score, 0 to 4. Default "Very weak", "Weak", "Fair", "Good", "Strong". */
  levels?: PasswordStrengthLevels;
};

export type PasswordStrengthMeterProps = {
  /**
   * How strong the password is, from 0 to 4 (zxcvbn's scale). Cosmos bundles no estimator: the
   * page works the score out. A value outside the range is held to it and rounded.
   */
  score: number;
  /**
   * Id of the visible text ("Password strength: Fair"). Point the field's `aria-describedby` at
   * it so the level is read when the field gets focus. Generated when omitted.
   */
  id?: string;
  /** The words, to translate with the rest of the page. */
  labels?: PasswordStrengthLabels;
  className?: string;
};

const SEGMENTS = 4;

// The level is announced once the person stops typing, not on every key.
const ANNOUNCE_DELAY = 800;

const DEFAULT_NAME = 'Password strength';
const DEFAULT_LEVELS: PasswordStrengthLevels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

// The colour of the lit segments for each score. A score of 0 lights none.
const LIT: readonly string[] = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500', 'bg-green-500'];

const toLevel = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(SEGMENTS, Math.round(score))) : 0;

/**
 * A strength gauge for a password field: four segments, as many lit as the score, and the level in
 * words below them. It draws what the page works out and bundles no estimator.
 *
 * The bar is decoration (`aria-hidden`); the text says the level. A polite status announces a new
 * level once the score has held for 800 ms, so a screen reader is not read to on every key, and
 * says nothing when the meter first shows.
 */
export const PasswordStrengthMeter = ({
  score,
  id,
  labels,
  className,
}: PasswordStrengthMeterProps) => {
  const generatedId = useId();
  const level = toLevel(score);
  const name = labels?.name ?? DEFAULT_NAME;
  const levelName = (labels?.levels ?? DEFAULT_LEVELS)[level];

  // The status region exists from the first render and starts empty: a live region only announces
  // a change to what it already holds.
  const [announcement, setAnnouncement] = useState('');
  const announced = useRef(level);
  // What the timer says when it fires: the latest words, without restarting it on a new `labels`.
  const text = useRef('');
  useEffect(() => {
    text.current = `${name}: ${levelName}`;
  });
  useEffect(() => {
    if (level === announced.current) return;
    const timer = setTimeout(() => {
      announced.current = level;
      setAnnouncement(text.current);
    }, ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [level]);

  return (
    <div className={className}>
      <div aria-hidden className="flex gap-1">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            data-segment=""
            data-lit={i < level ? '' : undefined}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i < level ? LIT[level] : 'bg-gray-100 dark:bg-gray-800'
            )}
          />
        ))}
      </div>
      <p id={id ?? generatedId} className="mt-1.5 text-xs text-[var(--color-text-muted)]">
        {name}: <span className="font-medium text-[var(--color-text-primary)]">{levelName}</span>
      </p>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
};
