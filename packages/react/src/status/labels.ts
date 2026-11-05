// The English the status components write, their part of `CosmosLabels` (`englishLabels`).

import { createElement, Fragment, type ReactNode } from 'react';
import type { HealthStatus } from './types';

// Words around a node: a label that holds a time to set apart is handed it as a node.
const sentence = (...parts: ReactNode[]) => createElement(Fragment, null, ...parts);

/**
 * The status in full, keyed by status code, for the name of a cell or a node, a legend, a count:
 * `OK`, `Warning`, `Critical`, `Unknown`, `Info`. One reading for every health component.
 */
export type HealthStatusLabels = Record<HealthStatus, string>;

/**
 * The status as a code, keyed by status code, for the text of a badge and the name of a dot:
 * `OK`, `WARN`, `CRIT`, `UNKNOWN`, `INFO`. Read by `StatusBadge` and `HealthDot`.
 */
export type StatusBadgeLabels = Record<HealthStatus, string>;

/** The headline of each status, keyed by status code, and the words around the counts. */
export type HealthSummaryLabels = Record<HealthStatus, string> & {
  /** Name of the group when the host gives no `ariaLabel`. Default `System health`. */
  group: string;
  /** The detail with no check at all. Default `No checks`. */
  noChecks: string;
  /** The detail when none needs attention, from the number of checks. Default `12 checks, none need attention`. */
  allClear: (total: number) => string;
  /** The detail when some do. Default `3 of 12 checks need attention`. */
  needAttention: (attention: number, total: number) => string;
  /** The words before the relative time of the last check. Default ` last check `, with its spaces. */
  lastCheck: string;
  /** Read out after the headline when the data is stale. Default `, stale data`. */
  staleNote: string;
};

export type HealthMatrixLabels = {
  /** The text of the first header cell when the host gives no `rowHeader`. Default `Service`. */
  rowHeader: string;
  /** Name of the legend. Default `Legend`. */
  legend: string;
  /** Heading of the strip of the rows that need attention. Default `Needs attention`. */
  needsAttention: string;
  /** What the strip says of the rows, from how many need attention. Default `2 of 12 rows`. */
  attentionRows: (attention: number, total: number) => string;
  /**
   * Name of the button of a cell. `status` is the status in full, `null` for a service that does not
   * run there. Default `API on prod: Critical`, `API on prod: no data`, `API on prod: OK, stale`.
   */
  cell: (row: string, column: string, status: string | null, stale: boolean) => string;
  /** Name of the popover of a cell. Default `API on prod`. */
  cellDetail: (row: string, column: string) => string;
  /** The time in the popover, handed the relative time as a node. Default `Checked 4 minutes ago`. */
  checked: (when: ReactNode) => ReactNode;
};

export type NodeGridLabels = {
  /** Name of the grid when the host gives no `ariaLabel`. Default `Node health`. */
  grid: string;
  /** Name of the legend. Default `Legend`. */
  legend: string;
  /** What is said when `show="alerting"` leaves no node to draw. Default `All nodes healthy`. */
  allHealthy: string;
  /** What is said when there is no node at all. Default `No nodes`. */
  noNodes: string;
};

export type StaleBadgeLabels = {
  /** The mark of stale data, handed the relative time as a node. Default `Stale · 4 minutes ago`. */
  stale: (since: ReactNode) => ReactNode;
};

export const HEALTH_STATUS_LABELS: HealthStatusLabels = {
  OK: 'OK',
  WARN: 'Warning',
  CRIT: 'Critical',
  UNKNOWN: 'Unknown',
  INFO: 'Info',
};

export const STATUS_BADGE_LABELS: StatusBadgeLabels = {
  OK: 'OK',
  WARN: 'WARN',
  CRIT: 'CRIT',
  UNKNOWN: 'UNKNOWN',
  INFO: 'INFO',
};

export const HEALTH_SUMMARY_LABELS: HealthSummaryLabels = {
  OK: 'All systems operational',
  WARN: 'Degraded performance',
  CRIT: 'Major outage',
  UNKNOWN: 'Status unknown',
  INFO: 'Operational, with notices',
  group: 'System health',
  noChecks: 'No checks',
  allClear: (total) => `${total} ${total === 1 ? 'check' : 'checks'}, none need attention`,
  needAttention: (attention, total) =>
    `${attention} of ${total} ${total === 1 ? 'check needs' : 'checks need'} attention`,
  lastCheck: ' last check ',
  staleNote: ', stale data',
};

export const HEALTH_MATRIX_LABELS: HealthMatrixLabels = {
  rowHeader: 'Service',
  legend: 'Legend',
  needsAttention: 'Needs attention',
  attentionRows: (attention, total) => `${attention} of ${total} ${total === 1 ? 'row' : 'rows'}`,
  cell: (row, column, status, stale) =>
    `${row} on ${column}: ${status ?? 'no data'}${stale ? ', stale' : ''}`,
  cellDetail: (row, column) => `${row} on ${column}`,
  checked: (when) => sentence('Checked ', when),
};

export const NODE_GRID_LABELS: NodeGridLabels = {
  grid: 'Node health',
  legend: 'Legend',
  allHealthy: 'All nodes healthy',
  noNodes: 'No nodes',
};

export const STALE_BADGE_LABELS: StaleBadgeLabels = {
  stale: (since) => sentence('Stale · ', since),
};
