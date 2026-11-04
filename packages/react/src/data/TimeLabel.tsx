import { clsx } from 'clsx';
import { Tooltip } from '../ui/Tooltip';
import { formatDateTime } from './time';

/**
 * The `<time>` element shared by `DateTime` and `RelativeTime`. With `tooltip` it is focusable
 * (a tooltip needs a trigger a keyboard can reach) and shows the full date and zone; without, it
 * stays plain text, out of the tab order.
 *
 * Internal to the package, not exported.
 */
export const TimeLabel = ({
  timestamp,
  text,
  detail,
  tooltip,
  locale,
  timeZone,
  className,
}: {
  timestamp: number;
  text: string;
  /** A second line under `text`, muted: the time under the date, in a stacked `DateTime`. */
  detail?: string;
  tooltip: boolean;
  locale?: string;
  timeZone?: string;
  className?: string;
}) => {
  if (!Number.isFinite(timestamp)) return <span className={className}>—</span>;
  const time = (
    <time
      dateTime={new Date(timestamp).toISOString()}
      tabIndex={tooltip ? 0 : undefined}
      className={clsx(
        detail !== undefined && 'inline-flex flex-col',
        tooltip && 'focus-visible:focus-indicator cursor-default rounded-sm',
        className
      )}
    >
      <bdi>{text}</bdi>
      {detail !== undefined && (
        <bdi className="text-xs text-[var(--color-text-muted)]">{detail}</bdi>
      )}
    </time>
  );
  if (!tooltip) return time;
  return <Tooltip content={formatDateTime(timestamp, 'full', locale, timeZone)}>{time}</Tooltip>;
};

/** Keeps the room of the text before the browser's locale and zone are known. */
export const TimePlaceholder = ({ width, className }: { width: string; className?: string }) => (
  <span
    aria-hidden
    className={clsx('inline-block h-[1em] align-middle', className)}
    style={{ width }}
  />
);
