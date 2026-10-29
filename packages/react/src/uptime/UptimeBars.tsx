import { clsx } from 'clsx';
import { useRef, type ReactNode } from 'react';
import { MarkStrip, type StripMark } from './MarkStrip';
import { LEVEL_FILL, LEVEL_TEXT } from './styles';
import type { UptimeDay, UptimeThresholds } from './types';
import { useFitCount } from './useFitCount';
import {
  averageUptime,
  dayLines,
  dayName,
  formatUptime,
  tail,
  thresholdLegend,
  uptimeLevel,
} from './uptime';

export type UptimeBarsPeriod = 30 | 60 | 90;

export type UptimeBarsProps = {
  /** One entry per day, oldest first: the last is today. */
  days: UptimeDay[];
  /** How many days to show, the latest ones: 30, 60 or 90 (default). */
  period?: UptimeBarsPeriod;
  /** Overrides the limits that colour a day. Default: 99.9 % and up green, 99 % and up amber, below red. */
  thresholds?: Partial<UptimeThresholds>;
  /** Shown at the start of the header, above the bars: the name of the service. */
  title?: ReactNode;
  /**
   * The uptime written in the header, 0 to 1. Default: the mean of the days shown that have
   * data. Set it when the host has the exact figure for the period.
   */
  uptime?: number | null;
  /** Draws the key of the thresholds under the bars. Default `false`. */
  legend?: boolean;
  /**
   * The compact form for a card: lower bars, with no header, captions or legend. The days stay
   * named and reachable.
   */
  compact?: boolean;
  /** Accessible name of the bars. Default: "Daily uptime over N days". */
  ariaLabel?: string;
  className?: string;
};

// A day's bar is as wide as the room allows, never under this (px), with this gap between two.
const MIN_DAY = 4;
const GAP = 2;

/**
 * UptimeBars — one bar per day over 30, 60 or 90 days, the block of a public status page.
 *
 * Each day is coloured by its uptime against the thresholds (green, amber, red), and grey without
 * data. The captions read "90 days ago" and "Today", and the header gives the uptime of the whole
 * period. When the width cannot hold every day, the oldest days are dropped, and the caption and
 * the uptime follow: they always describe what is drawn. The bars are one tab stop (today): the
 * arrow keys, Home and End move between days, and hovering or focusing a day shows its date, uptime
 * and incidents. Every day is named in words, and `legend` writes the thresholds.
 */
export const UptimeBars = ({
  days,
  period = 90,
  thresholds,
  title,
  uptime,
  legend = false,
  compact = false,
  ariaLabel,
  className,
}: UptimeBarsProps) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const fit = useFitCount(stripRef, MIN_DAY, GAP);
  const shown = tail(days, Math.min(period, fit));

  const marks: StripMark[] = shown.map((day) => ({
    name: dayName(day),
    lines: dayLines(day),
    className: clsx(
      'h-full min-w-0 flex-1 rounded-[2px]',
      LEVEL_FILL[uptimeLevel(day.uptime, thresholds)]
    ),
  }));

  const overall = uptime !== undefined ? uptime : averageUptime(shown);
  const overallLevel = uptimeLevel(overall, thresholds);
  const count = shown.length;

  return (
    <div className={clsx('min-w-0', className)}>
      {!compact && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {title && (
            <span className="min-w-0 text-sm font-semibold text-[var(--color-text-primary)]">
              <bdi>{title}</bdi>
            </span>
          )}
          <span className={clsx('ms-auto text-sm font-semibold', LEVEL_TEXT[overallLevel])}>
            <bdi>{overall === null ? 'No data' : `${formatUptime(overall)} uptime`}</bdi>
          </span>
        </div>
      )}
      <MarkStrip
        marks={marks}
        ariaLabel={
          ariaLabel ??
          (count === 0
            ? 'No daily uptime'
            : `Daily uptime over ${count} ${count === 1 ? 'day' : 'days'}`)
        }
        stripRef={stripRef}
        className={clsx(
          'flex w-full min-w-0 gap-[2px] overflow-clip [overflow-clip-margin:4px]',
          compact ? 'h-5' : 'h-[34px]'
        )}
      />
      {!compact && count > 1 && (
        <div
          dir="ltr"
          className="mt-1.5 flex justify-between text-xs text-[var(--color-text-secondary)]"
        >
          <span>{count} days ago</span>
          <span>Today</span>
        </div>
      )}
      {!compact && legend && (
        <ul
          aria-label="Legend"
          className="m-0 mt-2.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-[var(--color-text-secondary)]"
        >
          {thresholdLegend(thresholds).map(({ level, label }) => (
            <li key={level} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={clsx('size-3 shrink-0 rounded-[2px]', LEVEL_FILL[level])}
              />
              <bdi>{label}</bdi>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
