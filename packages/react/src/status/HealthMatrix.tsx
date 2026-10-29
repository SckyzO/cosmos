import { clsx } from 'clsx';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { RelativeTime } from '../data/RelativeTime';
import { directionOf } from '../hooks/direction';
import { FloatingPanel } from '../ui/FloatingPanel';
import { STATUS_NAME, formatLatency } from './health';
import { StatusBadge } from './StatusBadge';
import { STATUS_DOT, type HealthStatus } from './types';

/** What one cell of the matrix says: the status of a service in an environment, a node, a region. */
export type HealthMatrixCell = {
  status: HealthStatus;
  /** Why the status is what it is, shown in the cell's popover. */
  message?: string;
  /** Milliseconds. */
  latency?: number;
  /** When the cell was last checked. */
  checkedAt?: Date | number | string;
  /** More for the popover: a link to the checks, an owner, a runbook. */
  detail?: ReactNode;
};

/** A column: an environment, a node, a region. */
export type HealthMatrixColumn = { id: string; label: string };

/**
 * A row: a service. `cells` is keyed by column id; a column with no entry is a service that does
 * not run there, drawn as an empty cell.
 */
export type HealthMatrixRow = {
  id: string;
  label: string;
  cells: Record<string, HealthMatrixCell | undefined>;
};

export type HealthMatrixProps = {
  columns: HealthMatrixColumn[];
  rows: HealthMatrixRow[];
  /**
   * `dots` is the dense variant: one mark per cell, which carries a shape as well as a colour
   * (OK a filled circle, warning a diamond, critical a square, unknown a hollow ring, info a
   * triangle). `pills` writes the status in each cell. Default `dots`.
   */
  variant?: 'dots' | 'pills';
  /** Accessible name of the grid. */
  ariaLabel: string;
  /** A visible title, above the grid. */
  title?: ReactNode;
  /** Shows the legend of the shapes. Default: with `dots`, not with `pills`. */
  legend?: boolean;
  /**
   * Height past which the grid scrolls vertically, its column headers staying in view. The grid
   * always scrolls sideways in its own box when the columns do not fit.
   */
  maxHeight?: number | string;
  /** Freezes the "checked" texts of the popovers at this moment. For stories and tests. */
  now?: Date | number;
  className?: string;
};

// A fifth mark for INFO: the four others are a circle, a diamond, a square and a ring.
const SHAPE: Record<HealthStatus, string> = {
  OK: 'size-3 rounded-full',
  WARN: 'size-[11px] rotate-45',
  CRIT: 'size-3 rounded-[2px]',
  UNKNOWN: 'size-3 rounded-full border-2 border-gray-500 dark:border-gray-400',
  INFO: 'size-3 [clip-path:polygon(50%_0,100%_100%,0_100%)]',
};

// The mark of a status. Decorative: the text next to it, or the cell's name, says the status.
const Shape = ({ status }: { status: HealthStatus }) => (
  <span
    aria-hidden="true"
    className={clsx(
      'inline-block shrink-0',
      SHAPE[status],
      status !== 'UNKNOWN' && STATUS_DOT[status]
    )}
  />
);

// The legend reads from the good to the bad, as the mockups do.
const LEGEND_ORDER: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'UNKNOWN', 'INFO'];

type Position = { row: number; col: number };

/**
 * HealthMatrix — one status cell per service and per environment, node or region.
 *
 * A `role="grid"` with sticky row and column headers and one tab stop: the arrow keys move
 * between cells, Home and End to the ends of the row. A cell opens its detail in a popover with
 * Enter, Space or a click; Escape closes it and the focus returns to the cell. At a narrow width
 * the grid scrolls in its own box.
 */
export const HealthMatrix = ({
  columns,
  rows,
  variant = 'dots',
  ariaLabel,
  title,
  legend,
  maxHeight,
  now,
  className,
}: HealthMatrixProps) => {
  const gridRef = useRef<HTMLTableElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<Position>({ row: 0, col: 0 });
  const [open, setOpen] = useState<Position | null>(null);
  const showLegend = legend ?? variant === 'dots';

  const lastRow = rows.length - 1;
  const lastCol = columns.length - 1;
  const tab: Position = {
    row: Math.min(active.row, Math.max(lastRow, 0)),
    col: Math.min(active.col, Math.max(lastCol, 0)),
  };

  const focusCell = ({ row, col }: Position) => {
    setActive({ row, col });
    gridRef.current
      ?.querySelector<HTMLElement>(`button[data-row="${row}"][data-col="${col}"]`)
      ?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>('button[data-row]');
    if (!cell || event.altKey || event.ctrlKey || event.metaKey) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    // The columns follow the reading direction, so the arrows along them swap in right to left.
    const toEnd = directionOf(gridRef.current) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const toStart = toEnd === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    const next: Record<string, Position> = {
      [toEnd]: { row, col: Math.min(col + 1, lastCol) },
      [toStart]: { row, col: Math.max(col - 1, 0) },
      ArrowDown: { row: Math.min(row + 1, lastRow), col },
      ArrowUp: { row: Math.max(row - 1, 0), col },
      Home: { row, col: 0 },
      End: { row, col: lastCol },
    };
    const target = next[event.key];
    if (!target) return;
    event.preventDefault();
    focusCell(target);
  };

  const openRow = open ? rows[open.row] : undefined;
  const openCol = open ? columns[open.col] : undefined;
  const openCell = openRow && openCol ? openRow.cells[openCol.id] : undefined;

  const legendStatuses = LEGEND_ORDER.filter(
    (status) =>
      status !== 'INFO' ||
      rows.some((row) => Object.values(row.cells).some((cell) => cell?.status === 'INFO'))
  );

  return (
    <div
      className={clsx(
        'min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]',
        className
      )}
    >
      {(title || showLegend) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--color-border)] px-4 py-3">
          {title && (
            <p className="m-0 text-[0.9375rem] font-semibold text-[var(--color-text-primary)]">
              <bdi>{title}</bdi>
            </p>
          )}
          {showLegend && (
            <ul
              aria-label="Legend"
              className="m-0 ms-auto flex list-none flex-wrap gap-x-4 gap-y-1 p-0"
            >
              {legendStatuses.map((status) => (
                <li
                  key={status}
                  className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]"
                >
                  <Shape status={status} />
                  {STATUS_NAME[status]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table
          ref={gridRef}
          role="grid"
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          className="border-separate border-spacing-0 text-sm"
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="py-row-10 inset-s-0 sticky top-0 z-20 min-w-28 border-e border-b border-[var(--color-border)] bg-gray-50 px-4 text-start text-sm font-semibold text-[var(--color-text-primary)] sm:min-w-40 dark:bg-gray-800"
              >
                Service
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="py-row-10 sticky top-0 z-10 border-b border-[var(--color-border)] bg-gray-50 px-2 font-mono text-xs font-medium whitespace-nowrap text-[var(--color-text-secondary)] dark:bg-gray-800"
                >
                  <bdi>{column.label}</bdi>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="inset-s-0 sticky z-10 border-e border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 text-start text-sm font-semibold whitespace-nowrap text-[var(--color-text-primary)]"
                >
                  <bdi>{row.label}</bdi>
                </th>
                {columns.map((column, c) => {
                  const cell = row.cells[column.id];
                  const isOpen = open?.row === r && open.col === c;
                  return (
                    <td
                      key={column.id}
                      role="gridcell"
                      className="border-b border-[var(--color-border)] p-0 text-center"
                    >
                      <button
                        type="button"
                        data-row={r}
                        data-col={c}
                        tabIndex={tab.row === r && tab.col === c ? 0 : -1}
                        aria-label={`${row.label} on ${column.label}: ${cell ? STATUS_NAME[cell.status] : 'no data'}`}
                        aria-haspopup={cell ? 'dialog' : undefined}
                        aria-expanded={cell ? isOpen : undefined}
                        onFocus={() => setActive({ row: r, col: c })}
                        onClick={(event) => {
                          if (!cell) return;
                          triggerRef.current = event.currentTarget;
                          setOpen(isOpen ? null : { row: r, col: c });
                        }}
                        className={clsx(
                          'focus-visible:focus-indicator h-ctrl-40 inline-flex items-center justify-center rounded-md focus-visible:ring-inset',
                          variant === 'dots' ? 'w-14' : 'min-w-16 px-1.5',
                          cell && 'cursor-pointer'
                        )}
                      >
                        {!cell ? (
                          <span aria-hidden="true" className="text-[var(--color-text-muted)]">
                            —
                          </span>
                        ) : variant === 'dots' ? (
                          <Shape status={cell.status} />
                        ) : (
                          <StatusBadge
                            status={cell.status}
                            size="sm"
                            label={STATUS_NAME[cell.status]}
                          />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FloatingPanel
        open={open !== null && openCell !== undefined}
        onClose={() => setOpen(null)}
        triggerRef={triggerRef}
        placement={{ side: 'bottom', align: 'center', offset: 6 }}
        role="dialog"
        aria-label={openRow && openCol ? `${openRow.label} on ${openCol.label}` : undefined}
        tabIndex={-1}
        className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3.5 text-sm shadow-xl outline-none"
      >
        {openRow && openCol && openCell && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <b className="font-semibold text-[var(--color-text-primary)]">
                <bdi>{openRow.label}</bdi>
              </b>
              <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                <bdi>{openCol.label}</bdi>
              </span>
              <StatusBadge
                status={openCell.status}
                size="sm"
                label={STATUS_NAME[openCell.status]}
                className="ms-auto"
              />
            </div>
            {openCell.message && (
              <p className="m-0 mt-2 break-words text-[var(--color-text-primary)]">
                <bdi>{openCell.message}</bdi>
              </p>
            )}
            {(openCell.checkedAt !== undefined || openCell.latency !== undefined) && (
              <p className="m-0 mt-1 text-xs text-[var(--color-text-secondary)]">
                <bdi>
                  {openCell.checkedAt !== undefined && (
                    <>
                      Checked <RelativeTime value={openCell.checkedAt} now={now} />
                    </>
                  )}
                  {openCell.checkedAt !== undefined && openCell.latency !== undefined && ' · '}
                  {openCell.latency !== undefined && formatLatency(openCell.latency)}
                </bdi>
              </p>
            )}
            {openCell.detail && <div className="mt-2.5">{openCell.detail}</div>}
          </>
        )}
      </FloatingPanel>
    </div>
  );
};
