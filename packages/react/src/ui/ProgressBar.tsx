import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { Intent } from './intent';
import { fitSegments } from './progress';

export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressBarIntent = Extract<
  Intent,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger'
>;
export type ProgressBarLabel = 'none' | 'inside' | 'outside';

type ProgressBarBaseProps = {
  max?: number;
  size?: ProgressBarSize;
  /** Replace the auto-computed % with custom content. */
  labelContent?: ReactNode;
  /**
   * Accessible name of the bar: what is progressing ("Storage used"). The bar
   * has no text of its own, so without this or `aria-labelledby` a screen
   * reader announces a bare percentage. The `label` text does not name it.
   */
  'aria-label'?: string;
  /** Id of the element that names the bar, when a visible label already says it. */
  'aria-labelledby'?: string;
  className?: string;
};

/** One part of a segmented bar. */
export type ProgressBarSegment = {
  /** Its share of the track, in the unit of `max`. */
  value: number;
  /** Colour of the part. The host picks it, so the meaning stays explicit. Default `brand`. */
  intent?: ProgressBarIntent;
  /** What the part is ("Documents"): the legend and the accessible text. */
  label: string;
  /** The value as the legend and the accessible text say it ("40 GB"). Default: the number. */
  valueLabel?: string;
};

/** One value in one colour. */
export type SingleProgressBarProps = ProgressBarBaseProps & {
  value?: number;
  /**
   * Color of the fill. `brand` (default) is the accent; `success`, `warning` and `danger` carry a
   * meaning; `neutral` is gray, for a gauge with none (space used, a quota).
   */
  intent?: ProgressBarIntent;
  /** Where to render the % label. `inside` requires `lg` size. Default `none`. */
  label?: ProgressBarLabel;
  /** Animated diagonal stripes pattern over the filled bar. */
  striped?: boolean;
  /** Loop a small bar across the container when total progress is unknown. */
  indeterminate?: boolean;
  segments?: undefined;
  legend?: undefined;
  free?: undefined;
};

/** A bar split in parts that share the track, in order, 2px apart. */
export type SegmentedProgressBarProps = ProgressBarBaseProps & {
  /**
   * The parts, laid out in order. Their sum is held to `max`: what goes over
   * is cut off, and the host shows the overflow itself ("112%").
   */
  segments: ProgressBarSegment[];
  /** Where to render the total %. Default `none`. */
  label?: Exclude<ProgressBarLabel, 'inside'>;
  /** A row of swatch, label and value under the bar, with what is left on the track. Default `false`. */
  legend?: boolean;
  /** The entry of the legend and of the accessible text for what is left on the track. */
  free?: { label?: string; valueLabel?: string };
  value?: undefined;
  intent?: undefined;
  striped?: undefined;
  indeterminate?: undefined;
};

export type ProgressBarProps = SingleProgressBarProps | SegmentedProgressBarProps;

const SIZE_TRACK: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-5',
};

const INTENT_BG: Record<ProgressBarIntent, string> = {
  // A gauge that means nothing (space used, a quota) has no color to carry: gray on the gray track.
  neutral: 'bg-gray-500 dark:bg-gray-400',
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

// The label inside a `lg` fill is white, except on the neutral one: gray-400 in dark is too light
// for white text (2.5:1), so it takes the dark text there.
const INTENT_LABEL: Record<ProgressBarIntent, string> = {
  neutral: 'text-white dark:text-gray-900',
  brand: 'text-white',
  success: 'text-white',
  warning: 'text-white',
  danger: 'text-white',
};

const SingleProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  intent = 'brand',
  label = 'none',
  labelContent,
  striped = false,
  indeterminate = false,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className,
}: SingleProgressBarProps) => {
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
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
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
                <span
                  className={clsx('text-3xs px-2 leading-none font-bold', INTENT_LABEL[intent])}
                >
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

const SegmentedProgressBar = ({
  segments,
  max = 100,
  size = 'md',
  label = 'none',
  labelContent,
  legend = false,
  free,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className,
}: SegmentedProgressBarProps) => {
  const fit = fitSegments(
    segments.map((s) => s.value),
    max
  );
  const freeLabel = free?.label ?? 'Free';
  const freeText = free?.valueLabel ?? String(fit.rest);
  const showFree = fit.rest > 0;
  // What a screen reader gets in place of a bare percentage: every part, and what is left.
  const valueText = [
    ...segments.map((s, i) => `${s.label} ${s.valueLabel ?? fit.segments[i].value}`),
    ...(showFree ? [`${freeLabel} ${freeText}`] : []),
  ].join(', ');
  const labelText = labelContent ?? `${Math.round(fit.percent)}%`;
  return (
    <div className={clsx('block', className)}>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={Math.round(fit.percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={valueText}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          className={clsx(
            'relative flex flex-1 gap-0.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800',
            SIZE_TRACK[size]
          )}
        >
          {/* The parts share the track by flex-grow: the gaps come out of the room first, so the widths stay proportional and never overflow. */}
          {fit.segments.map(({ index, value }) =>
            value > 0 ? (
              <div
                key={index}
                data-segment=""
                style={{ flexGrow: value, flexBasis: 0 }}
                className={clsx(
                  'h-full min-w-0 transition-[flex-grow] duration-300 ease-out',
                  INTENT_BG[segments[index].intent ?? 'brand']
                )}
              />
            ) : null
          )}
          {fit.rest > 0 && <div style={{ flexGrow: fit.rest, flexBasis: 0 }} className="min-w-0" />}
        </div>
        {label === 'outside' && (
          <span
            aria-live="polite"
            className="shrink-0 text-xs font-medium text-gray-700 tabular-nums dark:text-gray-300"
          >
            {labelText}
          </span>
        )}
      </div>
      {legend && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {segments.map((s, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={clsx('size-2.5 shrink-0 rounded-[3px]', INTENT_BG[s.intent ?? 'brand'])}
              />
              <span className="text-[var(--color-text-muted)]">{s.label}</span>
              <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                {s.valueLabel ?? fit.segments[i].value}
              </span>
            </li>
          ))}
          {showFree && (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-[3px] bg-gray-100 ring-1 ring-[var(--color-border)] ring-inset dark:bg-gray-800"
              />
              <span className="text-[var(--color-text-muted)]">{freeLabel}</span>
              <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                {freeText}
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export const ProgressBar = (props: ProgressBarProps) =>
  props.segments ? <SegmentedProgressBar {...props} /> : <SingleProgressBar {...props} />;
