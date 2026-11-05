import { clsx } from 'clsx';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLabels } from '../labels/labelsContext';
import { formatLatency } from '../status/health';
import { UptimeBars } from './UptimeBars';
import { LEVEL_TEXT } from './styles';
import { UPTIME_LABELS, type UptimeLabels } from './labels';
import type { UptimeDay, UptimeThresholds } from './types';
import { daysLeftText, downtimeText, formatUptime, isNoDowntime, uptimeLevel } from './uptime';

/** The uptime of one period: "24 hours", "30 days". */
export type UptimePeriod = {
  /** What the period is called: "24 hours", "7 days", "1 year". */
  label: string;
  /** 0 to 1, or `null` when there is no data for the period. */
  uptime: number | null;
  /**
   * How long the period is, in milliseconds. With it the `card` says the downtime the uptime
   * stands for ("39 min down").
   */
  duration?: number;
};

/** The certificate of the monitored host. */
export type UptimeCertificate = {
  /** Days until it expires; a negative number is an expired certificate. */
  daysLeft: number;
  /**
   * Days left under which the figure is a warning. Default 14. It is a warning for fewer days
   * than this, never at it.
   */
  warnBelow?: number;
};

export type UptimeStatProps = {
  /**
   * `row` (default) puts the figures side by side, for a monitor's header: the uptime of each
   * period, the average response time and the certificate. `card` is one figure for a dashboard
   * tile: the first of `periods`, and the downtime it stands for.
   */
  variant?: 'row' | 'card';
  /** The periods, in the order shown. The `card` shows the first one only. */
  periods: UptimePeriod[];
  /** Overrides the limits that colour an uptime. Default: 99.9 % and up green, 99 % and up amber, below red. */
  thresholds?: Partial<UptimeThresholds>;
  /** Average response time over the period, in milliseconds. `row` only. */
  responseTime?: number;
  /** The certificate and its expiry. `row` only. */
  certificate?: UptimeCertificate;
  /** What the `card` is about: "API uptime, 30 days". Default: "Uptime, " and the period. */
  label?: ReactNode;
  /** The days of the `card`, drawn as compact bars under the figure. */
  days?: UptimeDay[];
  /** Accessible name of the `row`. Default `labels.uptimeGroup`, "Uptime". */
  ariaLabel?: string;
  /** The texts it writes, over `LabelsProvider`'s `uptime` and the English defaults. */
  labels?: Partial<UptimeLabels>;
  className?: string;
};

const DEFAULT_WARN_BELOW = 14;

const figure = (uptime: number | null): string => (uptime === null ? '—' : formatUptime(uptime));

// The figure of an uptime: the number, coloured by its level, and the words "No data" for a
// period with none, so a grey dash never stands alone.
const Figure = ({
  uptime,
  thresholds,
  noData,
  className,
}: {
  uptime: number | null;
  thresholds?: Partial<UptimeThresholds>;
  /** What a screen reader hears for a period with no figure. */
  noData: string;
  className?: string;
}) => (
  <span className={clsx('tabular-nums', LEVEL_TEXT[uptimeLevel(uptime, thresholds)], className)}>
    <bdi>{figure(uptime)}</bdi>
    {uptime === null && <span className="sr-only">{noData}</span>}
  </span>
);

const CARD = 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]';

/**
 * UptimeStat — the uptime figures of a monitor.
 *
 * `row` lines up the uptime of several periods (24 h, 7 d, 30 d, 1 y: the host names them), each
 * coloured by the thresholds, then the average response time and the certificate expiry, which
 * turns to a warning under `certificate.warnBelow` days. `card` is one period's figure and the
 * downtime it stands for, with the days as compact bars when given.
 */
export const UptimeStat = ({
  variant = 'row',
  periods,
  thresholds,
  responseTime,
  certificate,
  label,
  days,
  ariaLabel,
  labels: ownLabels,
  className,
}: UptimeStatProps) => {
  const labels = useLabels('uptime', UPTIME_LABELS, ownLabels);
  if (variant === 'card') {
    const period = periods[0];
    const down =
      period && period.uptime !== null && period.duration !== undefined
        ? downtimeText(period.uptime, period.duration, labels)
        : undefined;
    const noDowntime =
      period?.uptime != null &&
      period.duration !== undefined &&
      isNoDowntime(period.uptime, period.duration);
    return (
      <div className={clsx(CARD, 'min-w-0 px-5 py-[18px]', className)}>
        <p className="m-0 text-xs text-[var(--color-text-secondary)]">
          <bdi>{label ?? labels.uptimeCard(period?.label ?? '')}</bdi>
        </p>
        <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5">
          <Figure
            uptime={period?.uptime ?? null}
            thresholds={thresholds}
            noData={labels.noData}
            className="text-3xl font-semibold"
          />
          {down && (
            <span className="text-sm text-[var(--color-text-secondary)]">
              <bdi>{noDowntime ? down : labels.downFor(down)}</bdi>
            </span>
          )}
        </p>
        {days && (
          <UptimeBars
            days={days}
            thresholds={thresholds}
            compact
            ariaLabel={labels.dailyUptimeCard(period?.label ?? labels.period)}
            labels={labels}
            className="mt-3"
          />
        )}
      </div>
    );
  }

  const warnBelow = certificate?.warnBelow ?? DEFAULT_WARN_BELOW;
  const expiring = certificate !== undefined && certificate.daysLeft < warnBelow;
  const expired = certificate !== undefined && certificate.daysLeft < 0;
  const item =
    'flex min-w-0 flex-col gap-0.5 sm:border-e sm:border-[var(--color-border)] sm:px-5 sm:first:ps-0 sm:last:border-e-0';
  return (
    <div
      role="group"
      aria-label={ariaLabel ?? labels.uptimeGroup}
      className={clsx(CARD, 'px-5 py-4', className)}
    >
      <dl className="m-0 grid grid-cols-2 gap-y-4 sm:flex sm:flex-wrap">
        {periods.map((period) => (
          <div key={period.label} className={item}>
            <dt className="text-xs text-[var(--color-text-secondary)]">
              <bdi>{period.label}</bdi>
            </dt>
            <dd className="m-0 text-xl font-semibold">
              <Figure uptime={period.uptime} thresholds={thresholds} noData={labels.noData} />
            </dd>
          </div>
        ))}
        {responseTime !== undefined && (
          <div className={item}>
            <dt className="text-xs text-[var(--color-text-secondary)]">{labels.avgResponse}</dt>
            <dd className="m-0 text-xl font-semibold text-[var(--color-text-primary)] tabular-nums">
              <bdi>{formatLatency(responseTime)}</bdi>
            </dd>
          </div>
        )}
        {certificate && (
          <div className={item}>
            <dt className="text-xs text-[var(--color-text-secondary)]">{labels.certificate}</dt>
            <dd
              className={clsx(
                'm-0 inline-flex flex-wrap items-center gap-1.5 text-xl font-semibold',
                expired
                  ? 'text-red-700 dark:text-red-400'
                  : expiring
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-[var(--color-text-primary)]'
              )}
            >
              {expiring && (
                <AlertTriangle role="img" aria-label={labels.warning} className="size-4 shrink-0" />
              )}
              {/* One phrase: a narrow cell moves it whole, it never leaves "left" alone. */}
              <bdi className="whitespace-nowrap">{daysLeftText(certificate.daysLeft, labels)}</bdi>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
};
