import { toTimestamp, type DateTimeValue } from '../data/time';
import type { HealthStatus } from './types';

/**
 * One health check: a named probe and its last result.
 *
 * `latency` is in milliseconds. `checkedAt` is a `Date`, a timestamp in milliseconds or an
 * ISO 8601 string. `output` is the raw text of the probe, shown in a code block when a row is
 * expanded.
 */
export type HealthCheck = {
  id: string;
  name: string;
  status: HealthStatus;
  message?: string;
  /** What the check probes: a URL, a DSN, a host. */
  target?: string;
  latency?: number;
  checkedAt?: DateTimeValue;
  output?: string;
};

/**
 * A named set of checks. A group nests: `groups` holds the groups below it, one level per
 * dependency of a service for instance. Its status is never stored, it is the worst status
 * of everything under it (`groupWorst`).
 */
export type HealthCheckGroup = {
  id: string;
  name: string;
  checks?: HealthCheck[];
  groups?: HealthCheckGroup[];
};

/**
 * Worst first: CRIT, then WARN, then UNKNOWN (a check nobody could run is worse than one that
 * passes), then INFO, then OK. Every health component sorts and rolls up by this one list.
 */
export const SEVERITY_ORDER: readonly HealthStatus[] = ['CRIT', 'WARN', 'UNKNOWN', 'INFO', 'OK'];

const RANK: Record<HealthStatus, number> = {
  CRIT: 0,
  WARN: 1,
  UNKNOWN: 2,
  INFO: 3,
  OK: 4,
};

/** Position in `SEVERITY_ORDER`: 0 is the worst. */
export const severityRank = (status: HealthStatus): number => RANK[status];

/** Comparator for `Array.prototype.sort`: negative when `a` is worse than `b`. */
export const compareSeverity = (a: HealthStatus, b: HealthStatus): number => RANK[a] - RANK[b];

/** The worst of some statuses. With none to look at, nothing is known: `UNKNOWN`. */
export const worstStatus = (statuses: Iterable<HealthStatus>): HealthStatus => {
  let worst: HealthStatus | undefined;
  for (const status of statuses) {
    if (worst === undefined || RANK[status] < RANK[worst]) worst = status;
  }
  return worst ?? 'UNKNOWN';
};

/** The reading of each status, for badges, cell names and legends. */
export const STATUS_NAME: Record<HealthStatus, string> = {
  OK: 'OK',
  WARN: 'Warning',
  CRIT: 'Critical',
  UNKNOWN: 'Unknown',
  INFO: 'Info',
};

export type HealthCounts = Record<HealthStatus, number>;

export const countStatuses = (checks: readonly HealthCheck[]): HealthCounts => {
  const counts: HealthCounts = { OK: 0, WARN: 0, CRIT: 0, UNKNOWN: 0, INFO: 0 };
  for (const check of checks) counts[check.status] += 1;
  return counts;
};

/** "1 Warning · 2 OK": the statuses present, worst first. */
export const countsText = (counts: HealthCounts): string =>
  SEVERITY_ORDER.filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${STATUS_NAME[status]}`)
    .join(' · ');

/** How many checks need a look: warning, critical or unknown. */
export const attentionCount = (counts: HealthCounts): number =>
  counts.WARN + counts.CRIT + counts.UNKNOWN;

/** Every check under `groups`, depth first, in the order they were given. */
export const flattenChecks = (groups: readonly HealthCheckGroup[]): HealthCheck[] =>
  groups.flatMap((group) => [...(group.checks ?? []), ...flattenChecks(group.groups ?? [])]);

/** The worst status of the checks under a group, nested groups included. */
export const groupWorst = (group: HealthCheckGroup): HealthStatus =>
  worstStatus(flattenChecks([group]).map((check) => check.status));

/** Checks, worst first. Equal statuses keep their order. Returns a new array. */
export const sortChecks = (checks: readonly HealthCheck[]): HealthCheck[] =>
  [...checks].sort((a, b) => compareSeverity(a.status, b.status));

/**
 * Groups, the one with the worst check first, each with its checks and nested groups sorted
 * the same way. Equal groups keep their order. Returns new objects.
 */
export const sortGroups = (groups: readonly HealthCheckGroup[]): HealthCheckGroup[] =>
  groups
    .map((group) => ({
      ...group,
      checks: sortChecks(group.checks ?? []),
      groups: sortGroups(group.groups ?? []),
    }))
    .sort((a, b) => compareSeverity(groupWorst(a), groupWorst(b)));

/** The most recent `checkedAt` of the checks, in milliseconds, or `undefined` when none has one. */
export const latestCheck = (checks: readonly HealthCheck[]): number | undefined => {
  let latest: number | undefined;
  for (const check of checks) {
    if (check.checkedAt === undefined) continue;
    const at = toTimestamp(check.checkedAt);
    if (Number.isFinite(at) && (latest === undefined || at > latest)) latest = at;
  }
  return latest;
};

/** "312 ms", "1,820 ms". */
export const formatLatency = (ms: number): string => `${Math.round(ms).toLocaleString('en-US')} ms`;
