import { clsx } from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { useLabels } from '../labels/labelsContext';
import { PASSWORD_STRENGTH_LABELS, type PasswordStrengthLabels } from './labels';

/** The five levels a score of 0 to 4 stands for, from the weakest. */
export type PasswordStrengthLevels = readonly [string, string, string, string, string];

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
  /** The texts it writes, over `LabelsProvider`'s `passwordStrengthMeter` and the English defaults. */
  labels?: Partial<PasswordStrengthLabels>;
  className?: string;
};

const SEGMENTS = 4;

// The level is announced once the person stops typing, not on every key.
const ANNOUNCE_DELAY = 800;

// The colour of the lit segments for each score. A score of 0 lights none: its colour is the one the
// first segment is already wearing when it grows in.
const FILL: readonly string[] = [
  'bg-red-500',
  'bg-red-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-green-500',
];

const toLevel = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(SEGMENTS, Math.round(score))) : 0;

/**
 * A strength gauge for a password field: the level in words, and a bar of four slots with as many
 * lit as the score. A slot fills from the start edge when the score reaches it and empties when it
 * falls back, the colour fading as the level changes, in 300 ms; nothing moves with reduced motion.
 * It draws what the page works out and bundles no estimator.
 *
 * The bar is decoration (`aria-hidden`); the text says the level. A polite status announces a new
 * level once the score has held for 800 ms, so a screen reader is not read to on every key, and
 * says nothing when the meter first shows.
 */
export const PasswordStrengthMeter = ({
  score,
  id,
  labels: ownLabels,
  className,
}: PasswordStrengthMeterProps) => {
  const labels = useLabels('passwordStrengthMeter', PASSWORD_STRENGTH_LABELS, ownLabels);
  const generatedId = useId();
  const level = toLevel(score);
  const { name } = labels;
  const levelName = labels.levels[level];

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
      <p id={id ?? generatedId} className="mb-2 text-xs text-[var(--color-text-muted)]">
        {name}: <span className="font-medium text-[var(--color-text-primary)]">{levelName}</span>
      </p>
      {/* The bar repeats the text: a screen reader skips it. */}
      <div aria-hidden className="grid grid-cols-4 gap-0.5">
        {Array.from({ length: SEGMENTS }, (_, slot) => (
          <div key={slot} className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              // Only a lit fill is a segment. The unlit ones stay in place, shrunk to nothing, so
              // the next score grows them in from the start edge, mirrored in right to left.
              // `scale-x-*` sets the `scale` property (Tailwind 4), not `transform`: that is what
              // the transition names.
              data-segment={slot < level ? '' : undefined}
              className={clsx(
                'h-full origin-left transition-[scale,background-color] duration-300 ease-out motion-reduce:transition-none rtl:origin-right',
                FILL[level],
                slot < level ? 'scale-x-100' : 'scale-x-0'
              )}
            />
          </div>
        ))}
      </div>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
};
