import { clsx } from 'clsx';
import { useRef } from 'react';
import { MarkStrip, type StripMark } from './MarkStrip';
import { BEAT_FILL } from './styles';
import { BEAT_NAME, BEAT_STATUSES, type Beat, type BeatStatus } from './types';
import { useFitCount } from './useFitCount';
import { beatLines, beatName, beatsSummary, tail } from './uptime';

export type HeartbeatBarVariant = 'bars' | 'blocks' | 'dots';
export type HeartbeatBarSize = 'md' | 'sm';

export type HeartbeatBarProps = {
  /** The checks, oldest first: the newest is the last, at the end of the bar. */
  beats: Beat[];
  /**
   * `bars` (default) are thin rounded bars, `blocks` square cells and `dots` dots. A `down` beat
   * differs by shape as well as colour: a taller bar, a block crossed by a diagonal, a square dot.
   */
  variant?: HeartbeatBarVariant;
  /** `md` is 32px high (default), `sm` is 24px, the height inside a `MonitorRow`. */
  size?: HeartbeatBarSize;
  /**
   * Accessible name of the bar. Default: what it shows, "Last 60 checks: 54 up, 3 down", written
   * again as the bar is resized.
   */
  ariaLabel?: string;
  /** Draws the key of the statuses under the bar. Default `false`. */
  legend?: boolean;
  className?: string;
};

// Width of a mark and the gap between two, in px: how many fit is worked out from them.
const METRICS: Record<HeartbeatBarVariant, { size: number; gap: number; align: string }> = {
  bars: { size: 5, gap: 3, align: 'items-end gap-[3px]' },
  blocks: { size: 12, gap: 3, align: 'items-center gap-[3px]' },
  dots: { size: 9, gap: 5, align: 'items-center gap-[5px]' },
};

const HEIGHT: Record<HeartbeatBarSize, string> = { md: 'h-8', sm: 'h-6' };

// A bar's height, as a share of the bar: the down one fills it, a check that has not answered
// is a stub.
const BAR_HEIGHT: Record<BeatStatus, string> = {
  up: 'h-3/4',
  degraded: 'h-3/4',
  maintenance: 'h-3/4',
  down: 'h-full',
  pending: 'h-[30%]',
};

// A white diagonal across a block: the cross of a down beat. `white`, not a theme variable: the
// fill under it is the critical colour in every theme.
const CROSS =
  '[background-image:linear-gradient(135deg,transparent_42%,white_42%,white_58%,transparent_58%)]';

const markShape = (variant: HeartbeatBarVariant, status: BeatStatus): string => {
  const down = status === 'down';
  switch (variant) {
    case 'bars':
      return clsx('w-[5px] shrink-0 rounded-[3px]', BAR_HEIGHT[status]);
    case 'blocks':
      return clsx('size-3 shrink-0 rounded-[2px]', down && CROSS);
    case 'dots':
      return clsx('size-[9px] shrink-0', down ? 'rounded-[1px]' : 'rounded-full');
  }
};

const DOWN_SHAPE: Record<HeartbeatBarVariant, string> = {
  bars: 'taller bar',
  blocks: 'crossed block',
  dots: 'square dot',
};

/**
 * HeartbeatBar — one mark per check of a monitor, the newest at the end.
 *
 * It holds as many beats as its width allows and drops the oldest, so a narrow screen still shows
 * the latest history; give it the width of its container and it adapts. The bar is one tab stop
 * (the newest beat): the arrow keys, Home and End move between beats, and hovering or focusing a
 * beat shows its time, status, latency and message. Each beat is named in words (status, time,
 * latency, message), so no status rests on its colour alone.
 */
export const HeartbeatBar = ({
  beats,
  variant = 'bars',
  size = 'md',
  ariaLabel,
  legend = false,
  className,
}: HeartbeatBarProps) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const metrics = METRICS[variant];
  const fit = useFitCount(stripRef, metrics.size, metrics.gap);
  const shown = tail(beats, fit);

  const marks: StripMark[] = shown.map((beat) => ({
    name: beatName(beat),
    lines: beatLines(beat),
    className: clsx(markShape(variant, beat.status), BEAT_FILL[beat.status]),
  }));

  const summary = beatsSummary(shown);
  const label =
    ariaLabel ??
    (shown.length === 0
      ? 'No checks yet'
      : `Last ${shown.length} ${shown.length === 1 ? 'check' : 'checks'}: ${summary}`);

  return (
    <div className={clsx('min-w-0', className)}>
      <MarkStrip
        marks={marks}
        ariaLabel={label}
        stripRef={stripRef}
        className={clsx(
          'flex w-full min-w-0 overflow-clip [overflow-clip-margin:4px]',
          HEIGHT[size],
          metrics.align
        )}
      />
      {legend && (
        <ul
          aria-label="Legend"
          className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-[var(--color-text-secondary)]"
        >
          {BEAT_STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={clsx('size-2.5 shrink-0 rounded-[2px]', BEAT_FILL[status])}
              />
              {BEAT_NAME[status]}
              {status === 'down' && ` (${DOWN_SHAPE[variant]})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
