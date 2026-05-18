import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressBarIntent = 'brand' | 'success' | 'warning' | 'danger';
export type ProgressBarLabel = 'none' | 'inside' | 'outside';

export type ProgressBarProps = {
  value?: number;
  max?: number;
  size?: ProgressBarSize;
  intent?: ProgressBarIntent;
  /** Where to render the % label. `inside` requires `lg` size. Default `none`. */
  label?: ProgressBarLabel;
  /** Replace the auto-computed % with custom content. */
  labelContent?: ReactNode;
  /** Animated diagonal stripes pattern over the filled bar. */
  striped?: boolean;
  /** Loop a small bar across the container when total progress is unknown. */
  indeterminate?: boolean;
  className?: string;
};

const SIZE_TRACK: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-5',
};

const INTENT_BG: Record<ProgressBarIntent, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  intent = 'brand',
  label = 'none',
  labelContent,
  striped = false,
  indeterminate = false,
  className,
}: ProgressBarProps) => {
  const pct = indeterminate ? 100 : Math.max(0, Math.min(100, (value / max) * 100));
  const labelText = labelContent ?? `${Math.round(pct)}%`;
  // Inside label only fits in lg size (h-5 = 20px) — fall back to outside otherwise.
  const effectiveLabel: ProgressBarLabel = label === 'inside' && size !== 'lg' ? 'outside' : label;
  const showInsideLabel = effectiveLabel === 'inside' && !indeterminate;
  const showOutsideLabel = effectiveLabel === 'outside';
  return (
    <div className={clsx('block', className)}>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-busy={indeterminate || undefined}
          className={clsx(
            'relative flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800',
            SIZE_TRACK[size]
          )}
        >
          {indeterminate ? (
            <div
              className={clsx(
                'absolute h-full w-1/3 rounded-full motion-safe:animate-[progressIndeterminate_1.4s_ease-in-out_infinite]',
                INTENT_BG[intent],
                striped && 'bg-gradient-to-r bg-[length:1rem_1rem]'
              )}
              style={{
                backgroundImage: striped
                  ? 'linear-gradient(45deg, rgba(255,255,255,.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.18) 75%, transparent 75%, transparent)'
                  : undefined,
                backgroundSize: striped ? '1rem 1rem' : undefined,
              }}
            />
          ) : (
            <div
              style={{
                width: `${pct}%`,
                backgroundImage: striped
                  ? 'linear-gradient(45deg, rgba(255,255,255,.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.18) 75%, transparent 75%, transparent)'
                  : undefined,
                backgroundSize: striped ? '1rem 1rem' : undefined,
              }}
              className={clsx(
                'flex h-full items-center justify-center rounded-full transition-[width] duration-300 ease-out',
                INTENT_BG[intent],
                striped && 'motion-safe:animate-[progressStripes_1s_linear_infinite]'
              )}
            >
              {showInsideLabel && (
                <span className="px-2 text-[10px] leading-none font-bold text-white">
                  {labelText}
                </span>
              )}
            </div>
          )}
        </div>
        {showOutsideLabel && (
          <span
            aria-live="polite"
            className="shrink-0 text-xs font-medium text-gray-700 tabular-nums dark:text-gray-300"
          >
            {labelText}
          </span>
        )}
      </div>
      {/* Inline keyframes — local to ProgressBar so consumers don't need to register them globally. */}
      <style>{`
        @keyframes progressIndeterminate {
          0% { left: -33%; }
          100% { left: 100%; }
        }
        @keyframes progressStripes {
          0% { background-position: 0 0; }
          100% { background-position: 1rem 0; }
        }
      `}</style>
    </div>
  );
};
