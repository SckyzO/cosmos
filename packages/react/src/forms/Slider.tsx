import * as RadixSlider from '@radix-ui/react-slider';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import type { Intent } from '../ui/intent';

export type SliderIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger'>;

/** A number draws one handle, a pair `[minimum, maximum]` draws two. */
export type SliderValue = number | [number, number];

export type SliderProps = {
  /** Value, when controlled. A number is one handle, a pair is a range. */
  value?: SliderValue;
  /**
   * Initial value, when uncontrolled: a number for one handle, a pair for a range. Default `min`
   * (one handle).
   */
  defaultValue?: SliderValue;
  /**
   * Called with the value to move to, in the shape of the current one: a number for one handle, a
   * pair `[minimum, maximum]` for a range.
   */
  onChange?: (value: SliderValue) => void;
  /** Lowest value. Default `0`. */
  min?: number;
  /** Highest value. Default `100`. */
  max?: number;
  /** What the arrow keys and the pointer snap to. Default `1`. */
  step?: number;
  /**
   * Names the slider, on the left of the header row. The handles take it as their accessible
   * name; a range names them "<label> minimum" and "<label> maximum".
   */
  label?: string;
  /** Names the handles when there is no visible `label`. It wins over `label` as the name. */
  'aria-label'?: string;
  /**
   * Writes one number: the current value in the header (a range reads `$200 – $800`), the two end
   * labels under the track, and the value a screen reader announces. Default: the number as it is.
   */
  formatValue?: (value: number) => string;
  /** Color of the filled part and of the handle's border. Default `brand`. */
  intent?: SliderIntent;
  /**
   * Draws a tick under the track at every `step`. A fine step makes a dense row of ticks: use it
   * with a coarse one.
   */
  marks?: boolean;
  disabled?: boolean;
  className?: string;
};

// Tailwind scans for whole class names, so each is written out. The `-600` of a status color is
// what holds 3:1 on a light surface, the `-500` what holds it on a dark one.
const INTENT_CLASSES: Record<SliderIntent, { fill: string; handle: string }> = {
  brand: { fill: 'bg-brand-500', handle: 'border-brand-500' },
  success: {
    fill: 'bg-green-600 dark:bg-green-500',
    handle: 'border-green-600 dark:border-green-500',
  },
  warning: {
    fill: 'bg-amber-600 dark:bg-amber-500',
    handle: 'border-amber-600 dark:border-amber-500',
  },
  danger: { fill: 'bg-red-600 dark:bg-red-500', handle: 'border-red-600 dark:border-red-500' },
};

// The handle is `size-5`. Radix keeps it inside the track: its center travels from half a handle
// from the left edge to half a handle from the right one, so a tick takes the same offset.
const HANDLE_REM = 1.25;

const tickPosition = (percent: number) =>
  `calc(${percent}% + ${(0.5 - percent / 100) * HANDLE_REM}rem)`;

/** The values a tick is drawn at: `min`, then every `step` up to `max`. */
const markValues = (min: number, max: number, step: number) => {
  if (!(step > 0) || !(max > min)) return [];
  const count = Math.floor((max - min) / step + 1e-9);
  return Array.from({ length: count + 1 }, (_, i) => min + i * step);
};

/**
 * Slider — a position on a scale, or a range of it with two handles. One `value`, whose shape picks
 * the handles: a number draws one, a pair draws two. The handles move with the pointer, with touch
 * and with the keyboard (arrows by `step`, Page Up and Page Down by ten, Home and End to the ends),
 * and the two handles of a range can meet but never cross.
 *
 * The header shows the `label` and the current value; the end labels under the track show `min`
 * and `max`. `formatValue` writes all of them.
 */
export const Slider = ({
  value: valueProp,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  'aria-label': ariaLabel,
  formatValue,
  intent = 'brand',
  marks = false,
  disabled = false,
  className,
}: SliderProps) => {
  const [value, setValue] = useControllableState<SliderValue>({
    value: valueProp,
    defaultValue: defaultValue ?? min,
    onChange,
    name: 'Slider.value',
  });
  const isRange = Array.isArray(value);
  // Radix takes and gives arrays. The array of a range is the value itself, so Radix sees the
  // same one until it changes.
  const values = useMemo(() => (Array.isArray(value) ? value : [value]), [value]);
  const format = (n: number) => (formatValue ? formatValue(n) : String(n));
  const name = ariaLabel ?? label;
  // A range tells its two handles apart; Radix names them "Minimum" and "Maximum" when there is
  // nothing to build on.
  const handleName = (index: number) =>
    name === undefined
      ? undefined
      : isRange
        ? `${name} ${index === 0 ? 'minimum' : 'maximum'}`
        : name;
  const styles = INTENT_CLASSES[intent];
  const ticks = marks ? markValues(min, max, step) : [];

  return (
    <div
      // Dimmed with the control: aria-disabled tells axe the text belongs to an inactive control,
      // exempt from contrast (WCAG 1.4.3).
      aria-disabled={disabled || undefined}
      className={clsx('w-full', disabled && 'opacity-50', className)}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        {label && (
          <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </span>
        )}
        <span className="text-brand-600 dark:text-brand-400 ml-auto shrink-0 text-sm font-semibold tabular-nums">
          {values.map((n) => format(n)).join(' – ')}
        </span>
      </div>
      <RadixSlider.Root
        value={values}
        onValueChange={(next) => setValue(isRange ? [next[0], next[1]] : next[0])}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        // The handles keep their order: one stops at the other instead of swapping places with it.
        preserveThumbOrder
        className={clsx(
          'relative flex h-5 w-full touch-none items-center select-none',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <RadixSlider.Track className="relative h-2 grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <RadixSlider.Range className={clsx('absolute h-full rounded-full', styles.fill)} />
        </RadixSlider.Track>
        {values.map((current, index) => (
          <RadixSlider.Thumb
            key={index}
            aria-label={handleName(index)}
            aria-valuetext={formatValue ? formatValue(current) : undefined}
            className={clsx(
              'focus-visible:focus-indicator block size-5 rounded-full border-2 bg-white',
              styles.handle,
              disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
            )}
          />
        ))}
      </RadixSlider.Root>
      {ticks.length > 0 && (
        <div aria-hidden="true" className="relative mt-1 h-1.5">
          {ticks.map((tick) => (
            <span
              key={tick}
              data-slider-tick=""
              style={{ left: tickPosition(((tick - min) / (max - min)) * 100) }}
              className="absolute top-0 h-full w-0.5 -translate-x-1/2 rounded-full bg-gray-400 dark:bg-gray-500"
            />
          ))}
        </div>
      )}
      <div className="mt-1 flex justify-between gap-3 text-xs text-[var(--color-text-muted)] tabular-nums">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
};
