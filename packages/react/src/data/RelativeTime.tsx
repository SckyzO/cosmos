import { useCallback } from 'react';
import { useIsClient } from '../hooks/useIsClient';
import { useTicker } from '../hooks/useTicker';
import { TimeLabel, TimePlaceholder } from './TimeLabel';
import { formatRelative, nextRelativeDelay, toTimestamp, type DateTimeValue } from './time';

export type RelativeTimeProps = {
  /** The moment to describe: a `Date`, a timestamp in milliseconds or an ISO 8601 string. */
  value: DateTimeValue;
  /** BCP 47 tag (`fr-FR`). Default: the browser's language. */
  locale?: string;
  /** IANA zone of the tooltip's full date. Default: the browser's zone. */
  timeZone?: string;
  /** Shows the full date and zone in a tooltip. Takes a tab stop, see `DateTime`. Default `false`. */
  tooltip?: boolean;
  /**
   * Freezes the component at this moment: it reads "5 minutes ago" against it and sets no timer.
   * For stories and tests; leave it unset in an app.
   */
  now?: Date | number;
  className?: string;
};

/**
 * RelativeTime — "5 minutes ago", "in 2 days", "yesterday", by `Intl.RelativeTimeFormat`. It
 * refreshes itself on one timer shared by every instance, and only when its text would change:
 * every second in the first minute, every minute in the first hour, and ever less often after.
 */
export const RelativeTime = ({
  value,
  locale,
  timeZone,
  tooltip = false,
  now,
  className,
}: RelativeTimeProps) => {
  const isClient = useIsClient();
  const timestamp = toTimestamp(value);
  const read = useCallback(
    (at: number) => (Number.isFinite(timestamp) ? formatRelative(timestamp - at, locale) : ''),
    [timestamp, locale]
  );
  const delay = useCallback(
    (at: number) => (Number.isFinite(timestamp) ? nextRelativeDelay(timestamp - at) : null),
    [timestamp]
  );
  const text = useTicker(read, delay, now);
  if (!isClient) return <TimePlaceholder width="12ch" className={className} />;
  return (
    <TimeLabel
      timestamp={timestamp}
      text={text}
      tooltip={tooltip}
      locale={locale}
      timeZone={timeZone}
      className={className}
    />
  );
};
