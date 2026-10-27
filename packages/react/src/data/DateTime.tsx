import { useIsClient } from '../hooks/useIsClient';
import { TimeLabel, TimePlaceholder } from './TimeLabel';
import { formatDateTime, toTimestamp, type DateTimeFormat, type DateTimeValue } from './time';

export type { DateTimeFormat } from './time';

export type DateTimeProps = {
  /** A `Date`, a timestamp in milliseconds or a date string (ISO 8601: other forms depend on the browser). */
  value: DateTimeValue;
  /**
   * A preset: `date` ("Jan 15, 2026"), `time` ("12:00 PM"), `datetime` (both), `long` (month in
   * full, with seconds) and `full` (weekday and zone name); or `Intl.DateTimeFormat` options.
   * Default `datetime`.
   */
  format?: DateTimeFormat | Intl.DateTimeFormatOptions;
  /** BCP 47 tag (`fr-FR`). Default: the browser's language. */
  locale?: string;
  /** IANA zone (`Asia/Tokyo`). Default: the browser's zone. */
  timeZone?: string;
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
};

/**
 * DateTime — a date and time written by `Intl.DateTimeFormat`, in a `<time dateTime>` element.
 * It renders in the browser only (the server knows neither the user's locale nor zone), and
 * keeps the room of a typical date until then.
 */
export const DateTime = ({
  value,
  format = 'datetime',
  locale,
  timeZone,
  tooltip = false,
  className,
}: DateTimeProps) => {
  const isClient = useIsClient();
  if (!isClient)
    return (
      <TimePlaceholder
        width={typeof format === 'string' ? PLACEHOLDER_WIDTH[format] : '19ch'}
        className={className}
      />
    );
  const timestamp = toTimestamp(value);
  return (
    <TimeLabel
      timestamp={timestamp}
      text={Number.isFinite(timestamp) ? formatDateTime(timestamp, format, locale, timeZone) : ''}
      tooltip={tooltip}
      locale={locale}
      timeZone={timeZone}
      className={className}
    />
  );
};
