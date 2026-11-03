import { clsx } from 'clsx';
import { CheckCircle } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { directionOf } from '../hooks/direction';
import { FloatingPanel } from '../ui/FloatingPanel';
import { SectionLabel } from '../ui/SectionLabel';
import { STATUS_NAME } from './health';
import {
  countNodes,
  headerStatuses,
  nodeKey,
  statusesPresent,
  targetIndex,
  visibleGroups,
  type NodeGridGroup,
  type NodeGridMark,
  type NodeGridNode,
  type NodeGridShow,
} from './nodeGridModel';
import { STATUS_DOT, type HealthStatus } from './types';

export type NodeGridLabels = {
  /** The word after each count in the header, short: "40 CRIT". Defaults CRIT, WARN, OK, UNKNOWN, INFO. */
  counts?: Partial<Record<HealthStatus, string>>;
  /**
   * The status in full, for the name of a node ("node-07, Critical"), its tooltip and the legend.
   * Defaults Critical, Warning, OK, Unknown, Info.
   */
  statuses?: Partial<Record<HealthStatus, string>>;
};

export type NodeGridProps = {
  /** The nodes by group, a group being a room, a rack, a cluster. Drawn in the order given. */
  groups: NodeGridGroup[];
  /**
   * `all` draws every node. `alerting` draws the ones that are not OK, as an operations card does
   * when the healthy ones are only a number; the header still counts them, and a group with
   * nothing to show is left out. Default `all`.
   */
  show?: NodeGridShow;
  /**
   * The shape of the mark of each status: `square`, `diamond` or `circle`. Every status is a
   * square unless it is listed, so a grid is read by its colors and its names alone until the
   * host picks shapes that tell the statuses apart without them.
   */
  marks?: Partial<Record<HealthStatus, NodeGridMark>>;
  /** A title at the start of the header. */
  title?: ReactNode;
  /**
   * The counts at the end of the header: "40 CRIT 19 WARN 77 OK". They come from every node, also
   * the ones `show` leaves out. Critical, warning, unknown and info appear only above 0, OK
   * always. Default `true`.
   */
  showCounts?: boolean;
  /** One entry per status in the grid, each with its mark, under the groups. Default `false`. */
  legend?: boolean;
  /** The texts of the counts and of the statuses, for another language. Give only the ones to change. */
  labels?: NodeGridLabels;
  /**
   * Makes each node a button. Enter, Space or a click calls it with the node and its group.
   * Without it a node is not interactive: hovering or focusing it only shows its tooltip.
   */
  onNodeSelect?: (node: NodeGridNode, group: NodeGridGroup) => void;
  /**
   * What is said when there is nothing to draw. Default "All nodes healthy" with `show="alerting"`
   * and "No nodes" otherwise, or when there is no node at all.
   */
  emptyMessage?: ReactNode;
  /** Height past which the groups scroll inside the card, the header and the legend staying in view. */
  maxHeight?: number | string;
  /** Accessible name of the grid. Default "Node health". */
  ariaLabel?: string;
  className?: string;
};

const COUNT_WORD: Record<HealthStatus, string> = {
  OK: 'OK',
  WARN: 'WARN',
  CRIT: 'CRIT',
  UNKNOWN: 'UNKNOWN',
  INFO: 'INFO',
};

// The color of a count written as text: a step darker than the mark, for 4.5:1 on the card.
const COUNT_TEXT: Record<HealthStatus, string> = {
  OK: 'text-[var(--color-text-secondary)]',
  WARN: 'text-amber-700 dark:text-amber-400',
  CRIT: 'text-red-700 dark:text-red-400',
  UNKNOWN: 'text-[var(--color-text-secondary)]',
  INFO: 'text-blue-700 dark:text-blue-400',
};

// Every node sits in a 16px box, whatever its shape, so the grid keeps its rhythm: the shapes
// are drawn inside it. A diamond is a 10px square turned, 14px across its corners.
const MARK_SHAPE: Record<NodeGridMark, string> = {
  square: 'size-4 rounded-xs',
  circle: 'size-3.5 rounded-full',
  diamond: 'size-2.5 rotate-45 rounded-xs',
};

// A mark is decorative: the node's name, the tooltip or the text of the legend says the status.
const Mark = ({ status, shape }: { status: HealthStatus; shape: NodeGridMark }) => (
  <span
    aria-hidden="true"
    className={clsx('block shrink-0', MARK_SHAPE[shape], STATUS_DOT[status])}
  />
);

const NODE_ATTR = 'data-node';

const nodeOf = (target: EventTarget | null): HTMLElement | null =>
  target instanceof Element ? target.closest<HTMLElement>(`[${NODE_ATTR}]`) : null;

const NODE_BOX =
  'focus-visible:focus-indicator relative inline-grid size-4 place-items-center rounded-sm focus-visible:z-10';

/**
 * NodeGrid — one mark per node, in a grid for each group, with the counts above.
 *
 * Built for a fleet: the "Node Health" card of a monitoring dashboard, a room of racks, hundreds
 * of nodes in a glance. A node is a 16px mark, a square unless `marks` gives its status another
 * shape, 4px from the next; the grid wraps with the width it has and follows the reading
 * direction. `show="alerting"` draws only the nodes that need a look.
 *
 * The grid is one tab stop. The arrow keys move across it: left and right in reading order (the
 * other way round in right to left), up and down by the visual column, which is read from where
 * the marks are drawn, since the wrapping depends on the width; Home and End go to the first and
 * last node. Hovering or focusing a node shows a tooltip with its name, its status and its
 * `detail`; Escape hides it. Each node is named in words ("node-07, Critical"), so no status
 * rests on its color.
 */
export const NodeGrid = ({
  groups,
  show = 'all',
  marks,
  title,
  showCounts = true,
  legend = false,
  labels,
  onNodeSelect,
  emptyMessage,
  maxHeight,
  ariaLabel = 'Node health',
  className,
}: NodeGridProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const tipId = `${baseId}-tip`;
  // The node that is the tab stop, by key; the first one until a node is focused.
  const [active, setActive] = useState<string | null>(null);
  // The node the tooltip is on, by key: where the pointer is, else where the focus is.
  const [shown, setShown] = useState<string | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const hoverRef = useRef<HTMLElement | null>(null);
  const focusRef = useRef<HTMLElement | null>(null);

  const counts = useMemo(() => countNodes(groups), [groups]);
  const drawn = useMemo(() => visibleGroups(groups, show), [groups, show]);
  const entries = useMemo(
    () =>
      new Map(
        drawn.flatMap((group) =>
          group.nodes.map((node) => [nodeKey(group.id, node.id), { group, node }] as const)
        )
      ),
    [drawn]
  );

  const word = (status: HealthStatus) => labels?.statuses?.[status] ?? STATUS_NAME[status];
  const shapeOf = (status: HealthStatus): NodeGridMark => marks?.[status] ?? 'square';
  const nameOf = (node: NodeGridNode) => `${node.label ?? node.id}, ${word(node.status)}`;

  const tabStop =
    active !== null && entries.has(active) ? active : (entries.keys().next().value ?? null);
  const shownEntry = shown === null ? undefined : entries.get(shown);

  const sync = () => {
    const next = hoverRef.current ?? focusRef.current;
    anchorRef.current = next;
    setShown(next?.dataset.key ?? null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const node = nodeOf(event.target);
    if (!node || event.altKey || event.ctrlKey || event.metaKey) return;
    const nodes = Array.from(
      bodyRef.current?.querySelectorAll<HTMLElement>(`[${NODE_ATTR}]`) ?? []
    );
    const from = nodes.indexOf(node);
    const to = targetIndex(event.key, from, nodes.length, directionOf(bodyRef.current), () =>
      nodes.map((element) => element.getBoundingClientRect())
    );
    if (to === undefined) return;
    event.preventDefault();
    nodes[to]?.focus();
  };

  const empty = drawn.length === 0;
  const healthy = show === 'alerting' && Object.values(counts).some((count) => count > 0);
  const present = legend ? statusesPresent(drawn) : [];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={clsx(
        'min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]',
        className
      )}
    >
      {(title || showCounts) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--color-border)] px-4 py-3">
          {title && (
            <p className="m-0 text-sm font-semibold text-[var(--color-text-primary)]">
              <bdi>{title}</bdi>
            </p>
          )}
          {showCounts && (
            <p className="m-0 ms-auto flex flex-wrap gap-x-3 text-xs font-semibold tabular-nums [word-spacing:0.15em]">
              {headerStatuses(counts).map((status) => (
                <span key={status} className={COUNT_TEXT[status]}>
                  {/* Isolated, and read in the direction of its own words: "40 CRIT" stays in this order in a right-to-left line, and a word in Arabic puts the number after it. */}
                  <bdi>
                    {counts[status]} {labels?.counts?.[status] ?? COUNT_WORD[status]}
                  </bdi>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      <div
        ref={bodyRef}
        // The page reads the nodes in a list: each group is a `ul` named by its label, each node
        // an `li`. A `role="grid"` would promise rows and columns, and they are not there: the
        // marks wrap with the width, so no row is the same twice. The arrow keys move the focus
        // across the marks as they are drawn (a roving tab stop, as in a toolbar), and a list
        // reads in browse mode with no keys of ours.
        onKeyDown={onKeyDown}
        onMouseOver={(event) => {
          const node = nodeOf(event.target);
          if (node === hoverRef.current) return;
          hoverRef.current = node;
          sync();
        }}
        onMouseLeave={() => {
          hoverRef.current = null;
          sync();
        }}
        onFocus={(event) => {
          const node = nodeOf(event.target);
          if (!node) return;
          focusRef.current = node;
          setActive(node.dataset.key ?? null);
          sync();
        }}
        onBlur={() => {
          focusRef.current = null;
          sync();
        }}
        className="grid gap-3 overflow-y-auto px-4 py-3"
        style={{ maxHeight }}
      >
        {empty ? (
          <p className="m-0 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            {healthy && (
              <CheckCircle
                aria-hidden="true"
                className="size-4 shrink-0 text-green-600 dark:text-green-400"
              />
            )}
            {emptyMessage ?? (healthy ? 'All nodes healthy' : 'No nodes')}
          </p>
        ) : (
          drawn.map((group) => {
            const labelId = `${baseId}-${group.id}`;
            return (
              <div key={group.id} className="grid gap-1.5">
                <SectionLabel>
                  <span id={labelId}>
                    <bdi>{group.label}</bdi>
                  </span>
                </SectionLabel>
                <ul
                  role="list"
                  aria-labelledby={labelId}
                  className="m-0 flex list-none flex-wrap gap-1 p-0"
                >
                  {group.nodes.map((node) => {
                    const key = nodeKey(group.id, node.id);
                    const props = {
                      [NODE_ATTR]: '',
                      'data-key': key,
                      'aria-label': nameOf(node),
                      'aria-describedby': shown === key ? tipId : undefined,
                      tabIndex: key === tabStop ? 0 : -1,
                    };
                    const mark = <Mark status={node.status} shape={shapeOf(node.status)} />;
                    return (
                      <li key={node.id} className="flex">
                        {onNodeSelect ? (
                          <button
                            type="button"
                            {...props}
                            onClick={() => onNodeSelect(node, group)}
                            className={clsx(NODE_BOX, 'cursor-pointer')}
                          >
                            {mark}
                          </button>
                        ) : (
                          // A picture with a name, as the marks of a heartbeat strip are: it only
                          // answers to focus and hover, with the tooltip.
                          <span role="img" {...props} className={NODE_BOX}>
                            {mark}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
      {present.length > 0 && (
        <ul
          role="list"
          aria-label="Legend"
          className={clsx(
            'm-0 flex list-none flex-wrap gap-x-4 gap-y-1 px-4 pb-3 text-xs text-[var(--color-text-secondary)]',
            // Under a scrolling box the legend needs a line of its own.
            maxHeight !== undefined && 'border-t border-[var(--color-border)] pt-3'
          )}
        >
          {present.map((status) => (
            <li key={status} className="inline-flex items-center gap-1.5">
              <Mark status={status} shape={shapeOf(status)} />
              {word(status)}
            </li>
          ))}
        </ul>
      )}
      <FloatingPanel
        // One panel per node: it is placed against its anchor once, and the node it follows is
        // another element.
        key={shown ?? ''}
        id={tipId}
        open={shownEntry !== undefined}
        onClose={() => {
          hoverRef.current = null;
          focusRef.current = null;
          sync();
        }}
        triggerRef={anchorRef}
        moveFocus={false}
        placement={{ side: 'top', align: 'center', offset: 8 }}
        role="tooltip"
        className="pointer-events-none w-max max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-[0_0_20px_rgba(0,0,0,0.35)] dark:bg-gray-700"
      >
        {shownEntry && (
          <>
            <span className="block font-semibold">
              <bdi>{shownEntry.node.label ?? shownEntry.node.id}</bdi>
            </span>
            <span className="block text-gray-300">{word(shownEntry.node.status)}</span>
            {shownEntry.node.detail && (
              <span className="block text-gray-300">{shownEntry.node.detail}</span>
            )}
          </>
        )}
      </FloatingPanel>
    </div>
  );
};
