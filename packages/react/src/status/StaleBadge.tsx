import { clsx } from 'clsx';
import { RelativeTime } from '../data/RelativeTime';
import type { DateTimeValue } from '../data/time';
import { useLabels } from '../labels/labelsContext';
import { STALE_BADGE_LABELS, type StaleBadgeLabels } from './labels';

/**
 * The mark of data that has stopped coming in: "Stale · 4 minutes ago". The components that take
 * `stale` draw it and mute their status colours; it is amber, so it stays out of what is muted.
 */
export const StaleBadge = ({
  since,
  now,
  labels: ownLabels,
  className,
}: {
  /** When the last data came in. */
  since: DateTimeValue;
  now?: Date | number;
  /** The text it writes, over `LabelsProvider`'s `staleBadge` and the English defaults. */
  labels?: Partial<StaleBadgeLabels>;
  className?: string;
}) => {
  const labels = useLabels('staleBadge', STALE_BADGE_LABELS, ownLabels);
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        className
      )}
    >
      <bdi>{labels.stale(<RelativeTime value={since} now={now} />)}</bdi>
    </span>
  );
};
