import { clsx } from 'clsx';
import { Star } from 'lucide-react';
import { useState, type ReactNode, type Ref } from 'react';
import { onRadioGroupKeyDown, radioTabIndex } from '../forms/radioGroupA11y';
import { useControllableState } from '../hooks/useControllableState';

export type RatingProps = {
  /** Rating, when controlled. `0` is "no rating", a value like any other. */
  value?: number;
  /** Initial rating, when uncontrolled. Default `0`. */
  defaultValue?: number;
  /** Called with the rating the user picked (a multiple of 1, or of 0.5 with `allowHalf`). */
  onChange?: (value: number) => void;
  /** Number of stars. Default `5`. */
  max?: number;
  /**
   * Allow half stars: the pickable values move by 0.5, and a displayed value is rounded to the
   * nearest half. Without it a displayed value is rounded to the nearest whole star.
   */
  allowHalf?: boolean;
  /** Only display the rating (`role="img"`), no way to pick one. Default `false`. */
  readOnly?: boolean;
  /** Star size. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Accessible name. Interactive: the name of the radio group (default "Rating"). Read-only: the
   * subject, read before the value ("Product: 4.5 out of 5"); without it, "Rated 4.5 out of 5".
   */
  label?: string;
  /** Text after the stars, e.g. "(128 reviews)". */
  count?: ReactNode;
  /** Show the number ("4.5") next to the stars. */
  showValue?: boolean;
  /** Interactive only: the stars can't be picked. */
  disabled?: boolean;
  className?: string;
  /** Ref to the outer element. */
  ref?: Ref<HTMLSpanElement>;
};

const STAR_SIZE = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' } as const;
const TEXT_SIZE = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' } as const;

const starName = (n: number) => `${n} ${n === 1 ? 'star' : 'stars'}`;

export const Rating = ({
  value: valueProp,
  defaultValue = 0,
  onChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  size = 'md',
  label,
  count,
  showValue = false,
  disabled = false,
  className,
  ref,
}: RatingProps) => {
  const [stored, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'Rating.value',
  });
  const [hover, setHover] = useState<number | null>(null);
  const value = Math.min(Math.max(stored, 0), max);
  // The hover preview only exists while the stars can be picked.
  const interactive = !readOnly && !disabled;
  const shown = interactive && hover !== null ? hover : value;
  const step = allowHalf ? 0.5 : 1;
  // How much of star `i` is filled: 0, 0.5 or 1.
  const filled = (i: number) => {
    const part = Math.min(Math.max(shown - i, 0), 1);
    return Math.round(part / step) * step;
  };

  const stars = Array.from({ length: max }, (_, i) => (
    <span key={i} className={clsx('relative inline-block shrink-0', STAR_SIZE[size])}>
      {/* The empty star is an outline: a light gray fill nearly vanishes on a card. The colours
          are `color` so the glyph follows it with `currentColor`. */}
      <Star
        aria-hidden="true"
        strokeWidth={1.6}
        className={clsx(STAR_SIZE[size], 'fill-none stroke-current text-gray-500')}
      />
      {filled(i) > 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${filled(i) * 100}%` }}
        >
          {/* warning-600 holds 3:1 on a light card or sand page, amber-400 on a dark one. */}
          <Star
            strokeWidth={1.6}
            className={clsx(
              STAR_SIZE[size],
              'text-warning-600 max-w-none shrink-0 fill-current stroke-current dark:text-amber-400'
            )}
          />
        </span>
      )}
    </span>
  ));

  const text = (
    <>
      {showValue && (
        <span className={clsx('font-semibold text-[var(--color-text)]', TEXT_SIZE[size])}>
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && count !== null && (
        <span className={clsx('text-[var(--color-text-muted)]', TEXT_SIZE[size])}>{count}</span>
      )}
    </>
  );

  const root = clsx('inline-flex items-center gap-2', className);

  if (readOnly) {
    return (
      <span ref={ref} className={root}>
        <span
          role="img"
          aria-label={label ? `${label}: ${value} out of ${max}` : `Rated ${value} out of ${max}`}
          className="inline-flex gap-0.5"
        >
          {stars}
        </span>
        {text}
      </span>
    );
  }

  // One radio per pickable value, in order: two per star with `allowHalf`, the left half first.
  const radioValues = Array.from({ length: Math.round(max / step) }, (_, i) => (i + 1) * step);
  const anyChecked = radioValues.includes(value);
  return (
    <span ref={ref} className={root}>
      <span
        role="radiogroup"
        aria-label={label ?? 'Rating'}
        aria-disabled={disabled || undefined}
        onKeyDown={onRadioGroupKeyDown}
        onMouseLeave={() => setHover(null)}
        // Dimmed on the stars only: the value and count beside them keep their contrast.
        className={clsx('inline-flex gap-0.5', disabled && 'opacity-50')}
      >
        {stars.map((star, i) => (
          <span key={i} className="relative inline-flex">
            {star}
            {(allowHalf ? [i * 2, i * 2 + 1] : [i]).map((r) => {
              const v = radioValues[r]!;
              const checked = v === value;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={starName(v)}
                  disabled={disabled}
                  tabIndex={radioTabIndex(checked, r, anyChecked)}
                  onClick={() => setValue(v)}
                  onMouseEnter={() => setHover(v)}
                  className={clsx(
                    'focus-visible:focus-indicator absolute inset-y-0 cursor-pointer rounded-sm disabled:cursor-not-allowed',
                    !allowHalf ? 'inset-x-0' : r % 2 === 0 ? 'left-0 w-1/2' : 'right-0 w-1/2'
                  )}
                />
              );
            })}
          </span>
        ))}
      </span>
      {text}
    </span>
  );
};
