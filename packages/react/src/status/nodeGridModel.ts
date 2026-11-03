import type { ReactNode } from 'react';
import { SEVERITY_ORDER, type HealthCounts } from './health';
import type { HealthStatus } from './types';

/** One node: a host, a rack unit, a pod. Drawn as one mark. */
export type NodeGridNode = {
  id: string;
  status: HealthStatus;
  /** What the node is called. Default: its `id`. */
  label?: string;
  /** More for the tooltip, under the status: a reason, a metric. Plain text, the tooltip is not interactive. */
  detail?: ReactNode;
};

/** A group of nodes with a label above it: a room, a rack, a cluster. */
export type NodeGridGroup = {
  id: string;
  label: string;
  nodes: NodeGridNode[];
};

/** Which nodes are drawn. */
export type NodeGridShow = 'all' | 'alerting';

/** The shape of a mark. */
export type NodeGridMark = 'square' | 'diamond' | 'circle';

/** How many nodes there are of each status, in every group, whatever `show` hides. */
export const countNodes = (groups: readonly NodeGridGroup[]): HealthCounts => {
  const counts: HealthCounts = { OK: 0, WARN: 0, CRIT: 0, UNKNOWN: 0, INFO: 0 };
  for (const group of groups) {
    for (const node of group.nodes) counts[node.status] += 1;
  }
  return counts;
};

/**
 * The groups to draw. `alerting` keeps the nodes that are not OK (warning, critical, unknown and
 * info alike) and drops the group left with none. New objects when it filters, the given ones
 * otherwise. The order of groups and of nodes is the host's: it can mean a place in a room.
 */
export const visibleGroups = (
  groups: readonly NodeGridGroup[],
  show: NodeGridShow
): readonly NodeGridGroup[] => {
  if (show === 'all') return groups;
  return groups
    .map((group) => ({ ...group, nodes: group.nodes.filter((node) => node.status !== 'OK') }))
    .filter((group) => group.nodes.length > 0);
};

/** The statuses present in `groups`, worst first: the entries of a legend. */
export const statusesPresent = (groups: readonly NodeGridGroup[]): HealthStatus[] => {
  const counts = countNodes(groups);
  return SEVERITY_ORDER.filter((status) => counts[status] > 0);
};

/**
 * The statuses of the header counts, worst first. OK always shows, so the header is never blank
 * and "0 OK" reads as what it is; the others show only above 0.
 */
export const headerStatuses = (counts: HealthCounts): HealthStatus[] =>
  SEVERITY_ORDER.filter((status) => status === 'OK' || counts[status] > 0);

/** Identifies a node across groups: two rooms can both have a "node-01". */
export const nodeKey = (groupId: string, nodeId: string): string =>
  JSON.stringify([groupId, nodeId]);

/** The box of a mark on screen, as `getBoundingClientRect` gives it. */
export type Box = { top: number; left: number; width: number; height: number };

/**
 * The mark one row down (`step` 1) or up (`step` -1) from `from`, in the same visual column: the
 * mark of that row whose centre is nearest to the centre of `from`, the first in reading order
 * among equals. Rows are read from the boxes, since the grid wraps with the width it has, and
 * the groups' labels between two grids do not count. `undefined` when there is no row that way.
 */
export const verticalTarget = (
  boxes: readonly Box[],
  from: number,
  step: 1 | -1
): number | undefined => {
  const origin = boxes[from];
  if (!origin) return undefined;
  const tolerance = origin.height / 2;
  const centre = origin.left + origin.width / 2;
  // Marks of the same row differ by a sub-pixel at most: half a mark apart is another row.
  const beyond = (box: Box) =>
    step === 1 ? box.top > origin.top + tolerance : box.top < origin.top - tolerance;
  let rowTop: number | undefined;
  for (const box of boxes) {
    if (!beyond(box)) continue;
    if (rowTop === undefined || (step === 1 ? box.top < rowTop : box.top > rowTop)) {
      rowTop = box.top;
    }
  }
  if (rowTop === undefined) return undefined;
  let best: number | undefined;
  let bestDistance = Infinity;
  for (const [index, box] of boxes.entries()) {
    if (Math.abs(box.top - rowTop) > tolerance) continue;
    const distance = Math.abs(box.left + box.width / 2 - centre);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
};

/**
 * Where the key sends the focus, as an index into the marks in reading order, or `undefined` for
 * a key the grid does not handle. A key that cannot go further, the last mark and ArrowRight,
 * answers `from` itself: the grid stops the key, nothing moves. The arrows along the line follow
 * the reading direction (ArrowLeft is the next mark in `rtl`); ArrowUp and ArrowDown follow the
 * visual column, read from `boxes`, which is only asked for when one of them is pressed. Home and
 * End go to the first and the last mark of the whole grid.
 */
export const targetIndex = (
  key: string,
  from: number,
  count: number,
  direction: 'ltr' | 'rtl',
  boxes: () => readonly Box[]
): number | undefined => {
  const last = count - 1;
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  switch (key) {
    case forward:
      return Math.min(from + 1, last);
    case backward:
      return Math.max(from - 1, 0);
    case 'ArrowDown':
      return verticalTarget(boxes(), from, 1) ?? from;
    case 'ArrowUp':
      return verticalTarget(boxes(), from, -1) ?? from;
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return undefined;
  }
};
