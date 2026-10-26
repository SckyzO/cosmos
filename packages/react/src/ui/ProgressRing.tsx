import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { ProgressBarIntent } from './ProgressBar';
import { ringGeometry, toPercent } from './progress';

export type ProgressRingSize = 'sm' | 'md' | 'lg';
export type ProgressRingIntent = ProgressBarIntent;

export type ProgressRingProps = {
  value?: number;
  max?: number;
  /** `sm` 32px, `md` 56px, `lg` 96px, or a side in pixels. Default `md`. */
  size?: ProgressRingSize | number;
  /** Stroke width in pixels. Default: about a tenth of the size. */
  thickness?: number;
  intent?: ProgressRingIntent;
  /**
   * The centre: a value, an icon, a label. It sits inside the progressbar, so
   * a screen reader reads the ring's name and value and not this text a second
   * time; say what matters in `aria-label`.
   */
  children?: ReactNode;
  /** A quarter arc that spins (not under reduced motion) when total progress is unknown. */
  indeterminate?: boolean;
  /**
   * Accessible name of the ring: what is progressing ("Course progress"). Without
   * this or `aria-labelledby` a screen reader announces a bare percentage.
   */
  'aria-label'?: string;
  /** Id of the element that names the ring, when a visible label already says it. */
  'aria-labelledby'?: string;
  className?: string;
};

const SIZE_PX: Record<ProgressRingSize, number> = { sm: 32, md: 56, lg: 96 };
const SIZE_THICKNESS: Record<ProgressRingSize, number> = { sm: 4, md: 6, lg: 9 };

// Darker than the bar's fills on the light themes: a thin arc has to keep 3:1 against its track.
const INTENT_STROKE: Record<ProgressRingIntent, string> = {
  brand: 'stroke-brand-500',
  success: 'stroke-green-700 dark:stroke-green-500',
  warning: 'stroke-amber-700 dark:stroke-amber-500',
  danger: 'stroke-red-500',
};

// Centre text follows the text size setting: the tokens, never a pixel size.
const centreText = (px: number) => (px < 40 ? 'text-3xs' : px < 80 ? 'text-xs' : 'text-xl');

export const ProgressRing = ({
  value = 0,
  max = 100,
  size = 'md',
  thickness,
  intent = 'brand',
  children,
  indeterminate = false,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className,
}: ProgressRingProps) => {
  const px = typeof size === 'number' ? size : SIZE_PX[size];
  const stroke =
    thickness ??
    (typeof size === 'number' ? Math.max(2, Math.round(size / 10)) : SIZE_THICKNESS[size]);
  const pct = toPercent(value, max);
  const { radius, circumference, dashArray, dashOffset } = ringGeometry(px, stroke, pct);
  const center = px / 2;
  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-busy={indeterminate || undefined}
      style={{ width: px, height: px }}
      className={clsx('relative inline-block shrink-0', className)}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        aria-hidden="true"
        className={clsx(
          'block fill-none',
          indeterminate ? 'motion-safe:animate-spin' : '-rotate-90'
        )}
      >
        <circle
          data-ring="track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        {indeterminate ? (
          <circle
            data-ring="arc"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference / 4} ${circumference}`}
            className="stroke-[var(--color-text-muted)]"
          />
        ) : (
          pct > 0 && (
            <circle
              data-ring="arc"
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className={clsx(
                'motion-safe:transition-[stroke-dashoffset] motion-safe:duration-300 motion-safe:ease-out',
                INTENT_STROKE[intent]
              )}
            />
          )
        )}
      </svg>
      {children != null && children !== false && (
        <span
          className={clsx(
            'absolute inset-0 flex items-center justify-center font-bold text-[var(--color-text-primary)] tabular-nums',
            centreText(px)
          )}
        >
          {children}
        </span>
      )}
    </div>
  );
};
