import { clsx } from 'clsx';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { RelativeTime } from '../data/RelativeTime';
import { toTimestamp, type DateTimeValue } from '../data/time';
import { RefreshButton, type RefreshButtonProps } from '../ui/RefreshButton';
import {
  STATUS_NAME,
  SEVERITY_ORDER,
  attentionCount,
  countStatuses,
  countsText,
  latestCheck,
  worstStatus,
  type HealthCheck,
} from './health';
import { StatusBadge } from './StatusBadge';
import { HealthDot } from './HealthDot';
import type { HealthStatus } from './types';

export type HealthSummaryProps = {
  /** The checks to roll up: the worst status among them is the summary's. */
  checks: HealthCheck[];
  /**
   * Forces the status the summary shows, when the host weighs the checks differently (a
   * warning on a backup job is not an outage). The counts still come from `checks`.
   */
  status?: HealthStatus;
  /**
   * The headline of each status. Defaults: "All systems operational" (OK), "Degraded
   * performance" (WARN), "Major outage" (CRIT), "Status unknown" (UNKNOWN) and "Operational,
   * with notices" (INFO). Give only the ones to change.
   */
  labels?: Partial<Record<HealthStatus, string>>;
  /**
   * `banner` is full width and tinted by the status, with the counts as badges. `compact` is
   * one line, for a card or a topbar. Default `banner`.
   */
  variant?: 'banner' | 'compact';
  /** When the checks last ran. Default: the most recent `checkedAt` among `checks`. */
  checkedAt?: DateTimeValue;
  /** Draws a `RefreshButton` with these props. Without it there is no refresh action. */
  refresh?: RefreshButtonProps;
  /**
   * Accessible name of the group. Default "System health". It is a group, not a landmark, so
   * several summaries on a page need no distinct name.
   */
  ariaLabel?: string;
  /** Freezes the "last check" text at this moment. For stories and tests. */
  now?: Date | number;
  className?: string;
};

const DEFAULT_SUMMARY_LABELS: Record<HealthStatus, string> = {
  OK: 'All systems operational',
  WARN: 'Degraded performance',
  CRIT: 'Major outage',
  UNKNOWN: 'Status unknown',
  INFO: 'Operational, with notices',
};

const ICON: Record<HealthStatus, LucideIcon> = {
  OK: CheckCircle,
  WARN: AlertTriangle,
  CRIT: XCircle,
  UNKNOWN: HelpCircle,
  INFO: Info,
};

// Surface, chip and text of the banner, per status. The text is one step darker than the
// badges', since it sits on a tint.
const TONE: Record<HealthStatus, { surface: string; chip: string; text: string }> = {
  OK: {
    surface: 'border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10',
    chip: 'bg-green-100 dark:bg-green-500/20',
    text: 'text-green-800 dark:text-green-300',
  },
  WARN: {
    surface: 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
    chip: 'bg-amber-100 dark:bg-amber-500/20',
    text: 'text-amber-800 dark:text-amber-300',
  },
  CRIT: {
    surface: 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
    chip: 'bg-red-100 dark:bg-red-500/20',
    text: 'text-red-800 dark:text-red-300',
  },
  UNKNOWN: {
    surface: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60',
    chip: 'bg-gray-200 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
  },
  INFO: {
    surface: 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10',
    chip: 'bg-blue-100 dark:bg-blue-500/20',
    text: 'text-blue-800 dark:text-blue-300',
  },
};

/**
 * HealthSummary — the roll-up of a set of checks, for the top of a status page.
 *
 * The worst status among `checks` wins (severity order: critical, warning, unknown, info,
 * OK) and `status` overrides it. It shows the counts per status, when the checks last ran
 * and, with `refresh`, a refresh button. The headline is a live region: a change of status is
 * announced.
 */
export const HealthSummary = ({
  checks,
  status,
  labels,
  variant = 'banner',
  checkedAt,
  refresh,
  ariaLabel = 'System health',
  now,
  className,
}: HealthSummaryProps) => {
  const counts = countStatuses(checks);
  const shown = status ?? worstStatus(checks.map((check) => check.status));
  const headline = labels?.[shown] ?? DEFAULT_SUMMARY_LABELS[shown];
  const attention = attentionCount(counts);
  const detail =
    checks.length === 0
      ? 'No checks'
      : attention === 0
        ? `${checks.length} ${checks.length === 1 ? 'check' : 'checks'}, none need attention`
        : `${attention} of ${checks.length} ${checks.length === 1 ? 'check needs' : 'checks need'} attention`;
  const last = checkedAt !== undefined ? toTimestamp(checkedAt) : latestCheck(checks);
  const lastCheck =
    last !== undefined && Number.isFinite(last) ? (
      <>
        {' · last check '}
        <RelativeTime value={last} now={now} />
      </>
    ) : null;
  const tone = TONE[shown];

  if (variant === 'compact') {
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        className={clsx(
          'flex min-h-12 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-3.5 py-2 text-sm',
          className
        )}
      >
        <span aria-hidden="true" className="flex">
          <HealthDot status={shown} />
        </span>
        <b role="status" className={clsx('font-semibold', tone.text)}>
          {headline}
        </b>
        <span className="text-[var(--color-text-secondary)]">
          {countsText(counts)}
          {lastCheck}
        </span>
        {refresh && <RefreshButton {...refresh} className={clsx('ml-auto', refresh.className)} />}
      </div>
    );
  }

  const Icon = ICON[shown];
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={clsx(
        'flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border px-5 py-4',
        tone.surface,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'flex size-11 shrink-0 items-center justify-center rounded-full',
          tone.chip,
          tone.text
        )}
      >
        <Icon className="size-[22px]" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p role="status" className={clsx('m-0 text-xl font-semibold', tone.text)}>
          {headline}
        </p>
        <p className={clsx('m-0 mt-0.5 text-sm', tone.text)}>
          {detail}
          {lastCheck}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => (
          <StatusBadge key={s} status={s} label={`${counts[s]} ${STATUS_NAME[s]}`} />
        ))}
      </div>
      {refresh && <RefreshButton {...refresh} />}
    </div>
  );
};
