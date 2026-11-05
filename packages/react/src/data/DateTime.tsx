import { clsx } from 'clsx';
import type { ElementType } from 'react';
import { useIsClient } from '../hooks/useIsClient';
import { useLocale } from '../labels/labelsContext';
import { Badge } from '../ui/Badge';
import { TimeLabel, TimePlaceholder } from './TimeLabel';
import {
  formatDateTime,
  formatDateTimeLines,
  toTimestamp,
  type DateTimeFormat,
  type DateTimeValue,
} from './time';

export type { DateTimeFormat } from './time';

/** `inline` is text in a line, `stacked` puts the time under the date, `badge` is a neutral pill. */
export type DateTimeVariant = 'inline' | 'stacked' | 'badge';

export type DateTimeProps = {
  /** A `Date`, a timestamp in milliseconds or a date string (ISO 8601: other forms depend on the browser). */
  value: DateTimeValue;
  /**
   * A preset: `date` ("Jan 15, 2026"), `time` ("12:00 PM"), `datetime` (both), `long` (month in
   * full, with seconds), `full` (weekday and zone name), `short` (the numeric date, "01/15/2026"),
   * `monthDay` ("Jan 15"), `weekday` ("Thursday") and `iso` ("2026-01-15", in any locale); or
   * `Intl.DateTimeFormat` options. Default `datetime`.
   */
  format?: DateTimeFormat | Intl.DateTimeFormatOptions;
  /** BCP 47 tag (`fr-FR`). Default `LabelsProvider`'s `locale`, else the browser's language. */
  locale?: string;
  /** IANA zone (`Asia/Tokyo`). Default: the browser's zone. */
  timeZone?: string;
  /** 12-hour clock when `true`, 24-hour when `false`. Default: the locale's. Needs a format with a time. */
  hour12?: boolean;
  /** Adds the zone's short name ("UTC", "GMT+9") after the time. Needs a format with a time. Default `false`. */
  showZone?: boolean;
  /**
   * `inline` (default) is plain text in the line. `stacked` writes the date, and the time under it
   * in a smaller muted line (a format with only one of them stays one line); for a table cell or a
   * list row. `badge` is a neutral pill, a `Badge`.
   */
  variant?: DateTimeVariant;
  /** Lucide icon before the text (a calendar, a clock). */
  icon?: ElementType;
  /**
   * Shows the full date and zone in a tooltip. The `<time>` then takes a tab stop, so a keyboard
   * reaches the tooltip: leave it off in a long list. Default `false`.
   */
  tooltip?: boolean;
  className?: string;
};

// What the date takes while the browser's locale and zone are unknown, so the line does not jump.
const PLACEHOLDER_WIDTH: Record<DateTimeFormat, string> = {
  date: '10ch',
  time: '8ch',
  datetime: '19ch',
  long: '30ch',
  full: '48ch',
  short: '10ch',
  monthDay: '6ch',
  weekday: '9ch',
  iso: '10ch',
};

// Stacked, the lines are the date and the time: each takes about this much until the text is known.
const STACKED_PLACEHOLDER_WIDTH = '10ch';

/**
 * DateTime — a date and time written by `Intl.DateTimeFormat`, in a `<time dateTime>` element.
 * It renders in the browser only (the server knows neither the user's locale nor zone), and
 * keeps the room of a typical date until then.
 */
export const DateTime = ({
  value,
  format = 'datetime',
  locale: ownLocale,
  timeZone,
  hour12,
  showZone = false,
  variant = 'inline',
  icon: Icon,
  tooltip = false,
  className,
}: DateTimeProps) => {
  const locale = useLocale(ownLocale);
  const isClient = useIsClient();
  // Without an icon, a plain date is the `<time>` alone, and `className` is on it. Otherwise
  // something wraps it, and carries `className`.
  const bare = variant === 'inline' && !Icon;
  const timestamp = toTimestamp(value);
  const extras = { hour12, showZone };

  let body;
  if (!isClient) {
    // Stacked, one placeholder per line; the rest take the width of a typical date of the format.
    const count =
      variant === 'stacked' ? formatDateTimeLines(0, format, undefined, 'UTC').length : 1;
    const width =
      variant === 'stacked'
        ? STACKED_PLACEHOLDER_WIDTH
        : typeof format === 'string'
          ? PLACEHOLDER_WIDTH[format]
          : '19ch';
    const placeholder = (key: number) => (
      <TimePlaceholder key={key} width={width} className={bare ? className : undefined} />
    );
    body =
      count > 1 ? (
        <span className="inline-flex flex-col">{[0, 1].map(placeholder)}</span>
      ) : (
        placeholder(0)
      );
  } else {
    const lines = Number.isFinite(timestamp)
      ? variant === 'stacked'
        ? formatDateTimeLines(timestamp, format, locale, timeZone, extras)
        : [formatDateTime(timestamp, format, locale, timeZone, extras)]
      : [''];
    body = (
      <TimeLabel
        timestamp={timestamp}
        text={lines[0]!}
        detail={lines[1]}
        tooltip={tooltip}
        locale={locale}
        timeZone={timeZone}
        className={bare ? className : undefined}
      />
    );
  }

  if (variant === 'badge')
    return (
      <Badge icon={Icon} className={className}>
        {body}
      </Badge>
    );
  if (bare) return body;
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      {Icon && <Icon aria-hidden className="size-4 shrink-0 text-[var(--color-text-muted)]" />}
      {body}
    </span>
  );
};
