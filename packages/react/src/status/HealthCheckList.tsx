import { clsx } from 'clsx';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { RelativeTime } from '../data/RelativeTime';
import { useControllableState } from '../hooks/useControllableState';
import { CodeBlock } from '../ui/CodeBlock';
import {
  STATUS_NAME,
  countStatuses,
  countsText,
  flattenChecks,
  formatLatency,
  groupWorst,
  sortChecks,
  sortGroups,
  type HealthCheck,
  type HealthCheckGroup,
} from './health';
import { StatusBadge } from './StatusBadge';
import type { HealthStatus } from './types';

export type HealthCheckListProps = {
  /** Checks outside any group, drawn first. */
  checks?: HealthCheck[];
  /**
   * Groups of checks: database, cache, queue, external APIs. A group nests, so a dependency
   * tree is groups inside groups, one level per dependency. Each header shows the worst status
   * under it and the counts, and collapses.
   */
  groups?: HealthCheckGroup[];
  /**
   * `severity` puts the failing checks first, and the group with the worst check first,
   * inside every level (critical, warning, unknown, info, OK; equals keep their order).
   * `none` keeps the order given. Default `none`.
   */
  sort?: 'none' | 'severity';
  /** `list` is one row per check, `grid` one small card per check, for a wall screen. Default `list`. */
  variant?: 'list' | 'grid';
  /** Ids of the collapsed groups. Controlled. */
  collapsedGroups?: string[];
  /** Ids of the groups collapsed at first, when uncontrolled. Default none: every group is open. */
  defaultCollapsedGroups?: string[];
  /** Called with the ids of the collapsed groups, once one is opened or closed. */
  onCollapsedGroupsChange?: (collapsedGroups: string[]) => void;
  /** Accessible name of the list. */
  ariaLabel?: string;
  /** Freezes the "last check" texts at this moment. For stories and tests. */
  now?: Date | number;
  className?: string;
};

// The accent edge of a card, and the tint of the ones that need a look.
const CARD_EDGE: Record<HealthStatus, string> = {
  OK: 'border-t-green-500',
  WARN: 'border-t-amber-500 bg-amber-50/50 dark:bg-amber-500/5',
  CRIT: 'border-t-red-500 bg-red-50/50 dark:bg-red-500/5',
  UNKNOWN: 'border-t-gray-500 dark:border-t-gray-400',
  INFO: 'border-t-blue-500',
};

type CheckProps = {
  check: HealthCheck;
  open: boolean;
  onToggle: () => void;
  outputId: string;
  now?: Date | number;
};

// The name of a check, a toggle when it has an output to show.
const CheckName = ({ check, open, onToggle, outputId }: Omit<CheckProps, 'now'>) =>
  check.output === undefined ? (
    <span className="min-w-0 font-medium break-words text-[var(--color-text-primary)]">
      <bdi>{check.name}</bdi>
    </span>
  ) : (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={outputId}
      onClick={onToggle}
      className="focus-visible:focus-indicator -mx-1 flex min-w-0 items-center gap-1 rounded px-1 text-start font-medium text-[var(--color-text-primary)] focus-visible:ring-inset"
    >
      {open ? (
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      ) : (
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 rtl:-scale-x-100" />
      )}
      <span className="min-w-0 break-words">
        <bdi>{check.name}</bdi>
      </span>
    </button>
  );

const Output = ({ check, open, outputId }: Pick<CheckProps, 'check' | 'open' | 'outputId'>) =>
  check.output === undefined ? null : (
    <div id={outputId} hidden={!open} className="min-w-0">
      {open && <CodeBlock code={check.output} />}
    </div>
  );

const Dash = () => (
  <span aria-hidden="true" className="text-[var(--color-text-muted)] max-sm:hidden">
    —
  </span>
);

const CheckRow = ({ check, open, onToggle, outputId, now }: CheckProps) => (
  <li
    className={clsx(
      'py-row-12 border-b border-[var(--color-border)] px-4 text-sm text-[var(--color-text-secondary)] last:border-b-0',
      (check.status === 'WARN' || check.status === 'CRIT') && 'bg-gray-50/60 dark:bg-white/[0.02]'
    )}
  >
    <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[6.5rem_minmax(0,10rem)_minmax(0,12rem)_minmax(0,1fr)_5rem_6rem] sm:items-center sm:gap-3">
      <span>
        <StatusBadge status={check.status} label={STATUS_NAME[check.status]} />
      </span>
      <CheckName check={check} open={open} onToggle={onToggle} outputId={outputId} />
      {check.target ? (
        <span className="font-mono text-xs break-all text-[var(--color-text-secondary)] sm:truncate">
          <bdi>{check.target}</bdi>
        </span>
      ) : (
        <Dash />
      )}
      {check.message ? (
        <span className="min-w-0 break-words">
          <bdi>{check.message}</bdi>
        </span>
      ) : (
        <Dash />
      )}
      {check.latency !== undefined ? (
        <span className="tabular-nums sm:text-end">
          <bdi>{formatLatency(check.latency)}</bdi>
        </span>
      ) : (
        <Dash />
      )}
      {check.checkedAt !== undefined ? (
        <span className="text-[var(--color-text-secondary)] tabular-nums sm:text-end">
          <RelativeTime value={check.checkedAt} now={now} />
        </span>
      ) : (
        <Dash />
      )}
    </div>
    {check.output !== undefined && (
      <div className={clsx(open && 'mt-3 sm:ms-[7.25rem]')}>
        <Output check={check} open={open} outputId={outputId} />
      </div>
    )}
  </li>
);

const CheckCard = ({ check, open, onToggle, outputId, now }: CheckProps) => (
  <li
    className={clsx(
      'flex min-w-0 flex-col gap-1.5 rounded-xl border border-t-4 border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3.5 text-sm',
      CARD_EDGE[check.status]
    )}
  >
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <CheckName check={check} open={open} onToggle={onToggle} outputId={outputId} />
      </div>
      <StatusBadge status={check.status} size="sm" label={STATUS_NAME[check.status]} />
    </div>
    {check.target && (
      <span className="font-mono text-xs break-all text-[var(--color-text-secondary)]">
        <bdi>{check.target}</bdi>
      </span>
    )}
    {check.message && (
      <p className="m-0 break-words text-[var(--color-text-secondary)]">
        <bdi>{check.message}</bdi>
      </p>
    )}
    <Output check={check} open={open} outputId={outputId} />
    {(check.latency !== undefined || check.checkedAt !== undefined) && (
      <div className="mt-auto flex justify-between gap-2 pt-1 text-xs text-[var(--color-text-secondary)]">
        <span className="tabular-nums">
          {check.latency !== undefined ? <bdi>{formatLatency(check.latency)}</bdi> : ''}
        </span>
        {check.checkedAt !== undefined && <RelativeTime value={check.checkedAt} now={now} />}
      </div>
    )}
  </li>
);

/**
 * HealthCheckList — the checks of a system, as rows or as cards, in groups that collapse.
 *
 * Every row says its status in words (a badge), then the name, target, message, latency and
 * time of the last check. A check with an `output` has a toggle on its name that shows the raw
 * output in a code block. `sort="severity"` puts the failing checks, and the groups holding
 * them, first. Groups nest: use one level per dependency to read a dependency tree.
 */
export const HealthCheckList = ({
  checks = [],
  groups = [],
  sort = 'none',
  variant = 'list',
  collapsedGroups,
  defaultCollapsedGroups = [],
  onCollapsedGroupsChange,
  ariaLabel,
  now,
  className,
}: HealthCheckListProps) => {
  const uid = useId();
  const [collapsed, setCollapsed] = useControllableState<string[]>({
    value: collapsedGroups,
    defaultValue: defaultCollapsedGroups,
    onChange: onCollapsedGroupsChange,
    name: 'HealthCheckList.collapsedGroups',
  });
  const [expanded, setExpanded] = useState<string[]>([]);
  const shownChecks = useMemo(
    () => (sort === 'severity' ? sortChecks(checks) : checks),
    [checks, sort]
  );
  const shownGroups = useMemo(
    () => (sort === 'severity' ? sortGroups(groups) : groups),
    [groups, sort]
  );

  const toggleOutput = (id: string) =>
    setExpanded((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const toggleGroup = (id: string) =>
    setCollapsed((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const renderChecks = (list: HealthCheck[], scope: string) => {
    if (list.length === 0) return null;
    const Item = variant === 'grid' ? CheckCard : CheckRow;
    return (
      <ul
        className={clsx(
          'm-0 list-none p-0',
          variant === 'grid' &&
            'grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3 p-4'
        )}
      >
        {list.map((check) => {
          const key = `${scope}-${check.id}`;
          return (
            <Item
              key={check.id}
              check={check}
              open={expanded.includes(key)}
              onToggle={() => toggleOutput(key)}
              outputId={`${uid}-out-${key}`}
              now={now}
            />
          );
        })}
      </ul>
    );
  };

  const renderGroup = (group: HealthCheckGroup, path: string, depth: number) => {
    const panelId = `${uid}-group-${path}`;
    const isCollapsed = collapsed.includes(group.id);
    const everything = flattenChecks([group]);
    const counts = countStatuses(everything);
    return (
      <div
        key={group.id}
        className={clsx(
          depth > 0 && 'border-t border-[var(--color-border)]',
          depth === 0 &&
            variant === 'grid' &&
            'overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]'
        )}
      >
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-controls={panelId}
          onClick={() => toggleGroup(group.id)}
          style={{ paddingInlineStart: `${1 + depth * 1.25}rem` }}
          className="focus-visible:focus-indicator min-h-ctrl-44 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-[var(--color-border)] bg-gray-50 py-2 pe-4 text-start text-sm font-semibold text-[var(--color-text-primary)] focus-visible:ring-inset dark:bg-black/20"
        >
          {isCollapsed ? (
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 rtl:-scale-x-100" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          )}
          <span className="min-w-0 break-words">
            <bdi>{group.name}</bdi>
          </span>
          <StatusBadge status={groupWorst(group)} label={STATUS_NAME[groupWorst(group)]} />
          <span className="text-xs font-normal text-[var(--color-text-secondary)]">
            <bdi>{countsText(counts)}</bdi>
          </span>
        </button>
        <div id={panelId} hidden={isCollapsed}>
          {renderChecks(group.checks ?? [], path)}
          {(group.groups ?? []).map((child, i) => renderGroup(child, `${path}-${i}`, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      className={clsx(
        variant === 'list' &&
          'overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]',
        variant === 'grid' && 'flex flex-col gap-4',
        className
      )}
    >
      {renderChecks(shownChecks, 'top')}
      {shownGroups.map((group, i) => renderGroup(group, String(i), 0))}
    </div>
  );
};
