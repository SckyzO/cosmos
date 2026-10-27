import { clsx } from 'clsx';
import { formatLatency } from '../status/health';
import { AppLink } from '../ui/AppLink';
import { HeartbeatBar } from './HeartbeatBar';
import { BEAT_FILL, LEVEL_TEXT } from './styles';
import { BEAT_NAME, type Beat, type BeatStatus, type UptimeThresholds } from './types';
import { formatUptime, uptimeLevel } from './uptime';

/** What a monitor is doing: the status of its last check, or paused. */
export type MonitorState = BeatStatus | 'paused';

export type MonitorRowProps = {
  /** The monitor's name. */
  name: string;
  /** What it checks: `HTTP`, `TCP`, `DNS`, `ping`, `keyword`… a free string, shown as a tag. */
  type?: string;
  /** Its recent checks, oldest first. Drawn as a `HeartbeatBar` of 24px. */
  beats: Beat[];
  /**
   * The monitor's state. Default: the status of the last beat, `pending` without beats. `paused`
   * is set by `paused`, which wins.
   */
  status?: BeatStatus;
  /**
   * The monitor is paused: it is not checked. The status turns grey, the uptime reads "Paused" and
   * the row is dimmed. The beats it has stay shown.
   */
  paused?: boolean;
  /** Uptime over the last 24 hours, 0 to 1. `null` or unset: no data. */
  uptime?: number | null;
  /** The current response time, in milliseconds. Default: the latency of the last beat. */
  latency?: number;
  /** Overrides the limits that colour the uptime. Default: 99.9 % and up green, 99 % and up amber, below red. */
  thresholds?: Partial<UptimeThresholds>;
  /** Makes the name a link, to the monitor's page. */
  href?: string;
  /**
   * `row` (default) is one line in a list, the host drawing the list and its separators; it
   * stacks on a narrow screen. `card` is a tile for a grid of monitors.
   */
  variant?: 'row' | 'card';
  className?: string;
};

const STATE_NAME: Record<MonitorState, string> = { ...BEAT_NAME, paused: 'Paused' };

// The chip behind the dot: a tint of the status, as the badges have.
const CHIP: Record<MonitorState, string> = {
  up: 'bg-green-100 dark:bg-green-500/15',
  degraded: 'bg-amber-100 dark:bg-amber-500/15',
  down: 'bg-red-100 dark:bg-red-500/15',
  maintenance: 'bg-blue-100 dark:bg-blue-500/15',
  pending: 'bg-gray-100 dark:bg-gray-800',
  paused: 'bg-gray-100 dark:bg-gray-800',
};

const DOT: Record<MonitorState, string> = {
  ...BEAT_FILL,
  paused: 'bg-gray-400 dark:bg-gray-500',
};

const StateChip = ({ state }: { state: MonitorState }) => (
  <span
    role="img"
    aria-label={STATE_NAME[state]}
    className={clsx('flex size-7 shrink-0 items-center justify-center rounded-full', CHIP[state])}
  >
    <span aria-hidden="true" className={clsx('size-2 rounded-full', DOT[state])} />
  </span>
);

/**
 * MonitorRow — one monitor: its state, name and type, its recent checks, its uptime over 24 hours
 * and its current response time.
 *
 * `row` is a line of a list (the host draws the list), `card` a tile of a grid. The state is a
 * chip named in words ("Down"); the beats are a 24px `HeartbeatBar` and keep its keyboard model
 * and tooltips. A paused monitor says "Paused" where its uptime was.
 */
export const MonitorRow = ({
  name,
  type,
  beats,
  status,
  paused = false,
  uptime,
  latency,
  thresholds,
  href,
  variant = 'row',
  className,
}: MonitorRowProps) => {
  const last = beats[beats.length - 1];
  const state: MonitorState = paused ? 'paused' : (status ?? last?.status ?? 'pending');
  const currentLatency = latency ?? last?.latency;
  const level = uptimeLevel(uptime, thresholds);
  const card = variant === 'card';

  const title = (
    <span className="flex min-w-0 items-center gap-2">
      {href ? (
        <AppLink
          href={href}
          className="focus-visible:focus-indicator min-w-0 truncate rounded font-medium text-[var(--color-text-primary)] hover:underline"
        >
          {name}
        </AppLink>
      ) : (
        <span className="min-w-0 truncate font-medium text-[var(--color-text-primary)]">
          {name}
        </span>
      )}
      {type && (
        <span className="text-2xs shrink-0 rounded bg-gray-100 px-1.5 font-mono leading-[18px] text-[var(--color-text-secondary)] dark:bg-gray-800">
          {type}
        </span>
      )}
    </span>
  );

  const uptimeText = paused ? (
    <span className="text-[var(--color-text-secondary)]">Paused</span>
  ) : uptime === null || uptime === undefined ? (
    <span className="text-[var(--color-text-secondary)]">
      —<span className="sr-only">No data</span>
    </span>
  ) : (
    <span className={LEVEL_TEXT[level]}>{formatUptime(uptime)}</span>
  );

  const latencyText =
    currentLatency === undefined || paused || state === 'down' ? (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">No response time</span>
      </>
    ) : (
      formatLatency(currentLatency)
    );

  const bar = <HeartbeatBar beats={beats} size="sm" ariaLabel={`${name}: recent checks`} />;

  if (card) {
    return (
      <div
        className={clsx(
          'flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4 text-sm',
          paused && 'bg-gray-50 dark:bg-gray-900/50',
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <StateChip state={state} />
          {title}
        </div>
        {bar}
        <dl className="m-0 flex gap-6 text-[var(--color-text-secondary)]">
          <div>
            <dt className="text-xs">24 h uptime</dt>
            <dd className="m-0 font-semibold tabular-nums">{uptimeText}</dd>
          </div>
          <div>
            <dt className="text-xs">Latency</dt>
            <dd className="m-0 font-semibold text-[var(--color-text-primary)] tabular-nums">
              {latencyText}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'grid min-w-0 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2.5 px-4 py-3 text-sm sm:grid-cols-[28px_minmax(0,13rem)_minmax(0,1fr)_5.5rem_5rem] sm:gap-y-0',
        paused && 'bg-gray-50 dark:bg-gray-900/50',
        className
      )}
    >
      <StateChip state={state} />
      {title}
      <div className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto">{bar}</div>
      <div className="flex gap-3 sm:contents">
        <span className="text-right font-semibold tabular-nums sm:font-normal">
          <span className="sr-only">24 h uptime: </span>
          {uptimeText}
        </span>
        <span className="text-right text-[var(--color-text-secondary)] tabular-nums">
          <span className="sr-only">Latency: </span>
          {latencyText}
        </span>
      </div>
    </div>
  );
};
