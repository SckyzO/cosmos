import { clsx } from 'clsx';
import { Check, Lock, X } from 'lucide-react';
import { useId, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { directionOf } from '../hooks/direction';
import { useControllableState } from '../hooks/useControllableState';
import { Checkbox } from './Checkbox';
import {
  cellKey,
  clampPosition,
  focusMoveOf,
  gridCells,
  gridRowLengths,
  moveFocus,
  resolveLabels,
  tallyGrid,
  toggleCell,
  toggleScope,
  triStateOf,
  type GridCell,
  type PermissionGridColumn,
  type PermissionGridGroup,
  type PermissionGridLabels,
  type Position,
  type Scope,
  type Tally,
} from './permissionGrid';

export { cellKey };
export type { PermissionGridColumn, PermissionGridGroup, PermissionGridLabels };
export type { PermissionGridRow } from './permissionGrid';

export type PermissionGridProps = {
  /** The permissions, grouped by area: a header row per group, then one row per permission. */
  groups: PermissionGridGroup[];
  /** What the permissions are granted for: actions (view, edit, delete) or roles. */
  columns: PermissionGridColumn[];
  /**
   * The granted cells, as `cellKey(rowId, columnId)` keys: the row id, a colon and the column id.
   * With `defaultValue` and `onChange(value)`, as for every control. Keys the grid does not own (a
   * read-only column's grants, a cell that does not apply) are kept as they are.
   */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /**
   * Nobody can change anything: every cell shows what is granted as an icon, with a text for the
   * screen reader, and no box is drawn. A single column is read-only with `column.readOnly`.
   */
  readOnly?: boolean;
  /** What is wrong ("Grant at least one permission"), written under the grid and read with it. */
  error?: string;
  /** Replaces the texts the grid writes itself, e.g. for another language. */
  labels?: Partial<PermissionGridLabels>;
  /** Accessible name of the grid. */
  ariaLabel: string;
  /**
   * Height past which the grid scrolls vertically, its header row staying in view. The grid
   * always scrolls sideways in its own box when the columns do not fit, its first column staying
   * in view.
   */
  maxHeight?: number | string;
  className?: string;
};

// The pinned cells have a solid background, or the cells that scroll under them show through.
const HEADER_BG = 'bg-gray-50 dark:bg-gray-800';
const PINNED_START = 'sticky inset-s-0 border-e';
const CELL_BORDER = 'border-b border-[var(--color-border)]';
const FOCUS_CELL = 'focus-visible:focus-indicator focus-visible:ring-inset';
// What a box that covers its whole cell is built from: the cell is the click target, since a bare
// checkbox is 18px, under the 24px minimum.
const COVER_CELL = 'after:absolute after:inset-0';
// A text that is a word the host wrote: it breaks anywhere rather than widen its column.
const LABEL_TEXT = '[overflow-wrap:anywhere]';

/**
 * PermissionGrid — permissions grouped by area down the side, actions or roles across the top, a
 * checkbox in each cell: the editor of a role, or the matrix of roles against permissions.
 *
 * There is a box per row (first column), per column (header), per group (its header row) and one
 * for the whole grid (the corner). Each shows `indeterminate` when it covers some granted cells
 * and not all, and a click on a mixed box grants everything, then clears. Cells that do not apply
 * to a row, and cells that are read-only, are left out of every box and of the counts.
 *
 * It is a `role="grid"`, not a table of checkboxes: one Tab stop, then arrows, Home and End,
 * Ctrl+Home and Ctrl+End move between cells (and Space toggles the box in focus). After a box
 * that selects several cells, a polite status says how many permissions are granted; a single
 * cell says nothing. The header row and the first column stay in view while the grid scrolls,
 * also at 375px, where it scrolls inside its own frame.
 */
export const PermissionGrid = ({
  groups,
  columns,
  value,
  defaultValue,
  onChange,
  readOnly = false,
  error,
  labels: labelOverrides,
  ariaLabel,
  maxHeight,
  className,
}: PermissionGridProps) => {
  const [granted, setGranted] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange,
    name: 'PermissionGrid.value',
  });
  const labels = useMemo(() => resolveLabels(labelOverrides), [labelOverrides]);
  const gridRef = useRef<HTMLTableElement>(null);
  const errorId = useId();
  const [active, setActive] = useState<Position>({ row: 0, col: 0 });
  const [announcement, setAnnouncement] = useState('');

  const cells = useMemo(() => gridCells(groups, columns, readOnly), [groups, columns, readOnly]);
  const cellByKey = useMemo(() => new Map(cells.map((cell) => [cell.key, cell])), [cells]);
  const tallies = useMemo(() => tallyGrid(cells, granted), [cells, granted]);
  const grantedSet = useMemo(() => new Set(granted), [granted]);
  const rowLengths = useMemo(() => gridRowLengths(groups, columns.length), [groups, columns]);
  // The index of each row in the grid: the header is row 0, then each group's header and its rows.
  const layout = useMemo(() => {
    let next = 1;
    return groups.map((group) => ({
      group,
      groupRow: next++,
      rows: group.rows.map((row) => ({ row, index: next++ })),
    }));
  }, [groups]);

  // The one cell with a tab stop: the last one the focus was on, kept inside a grid that shrank.
  const tab = clampPosition(rowLengths, active);
  const focusProps = (row: number, col: number) => ({
    'data-grid-row': row,
    'data-grid-col': col,
    tabIndex: tab.row === row && tab.col === col ? 0 : -1,
  });
  const anyBox = tallies.all.total > 0;

  const focusAt = (position: Position) => {
    setActive(position);
    const target = gridRef.current?.querySelector<HTMLElement>(
      `[data-grid-row="${position.row}"][data-grid-col="${position.col}"]`
    );
    if (!target) return;
    // The focus alone brings the box into view, which can leave the rest of its cell under the
    // pinned header or column. The whole cell is scrolled in instead, clear of both
    // (`scroll-padding` on the frame is their size).
    target.focus({ preventScroll: true });
    target.closest('td, th')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const positionOf = (target: EventTarget): Position | null => {
    const element = (target as HTMLElement).closest<HTMLElement>('[data-grid-row]');
    return element
      ? { row: Number(element.dataset.gridRow), col: Number(element.dataset.gridCol) }
      : null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const from = positionOf(event.target);
    const move = from && focusMoveOf(event.key, event, directionOf(gridRef.current));
    if (!from || !move) return;
    event.preventDefault();
    focusAt(moveFocus(rowLengths, from, move));
  };

  // Clicking a box focuses it in most browsers; the position follows the focus either way.
  const onFocus = (event: FocusEvent<HTMLTableElement>) => {
    const position = positionOf(event.target);
    if (position) {
      setActive((current) =>
        current.row === position.row && current.col === position.col ? current : position
      );
    }
  };

  const toggleOne = (cell: GridCell, position: Position) => {
    setActive(position);
    setAnnouncement('');
    setGranted((current) => toggleCell(cell, current));
  };

  // A box over several cells says what it did, once: the screen reader user hears the box change,
  // not the cells it moved.
  const toggleMany = (scope: Scope, position: Position) => {
    const next = toggleScope(cells, scope, granted);
    setActive(position);
    setGranted(next);
    const { granted: count, total } = tallyGrid(cells, next).all;
    setAnnouncement(labels.summary(count, total));
  };

  // The tri-state box of a row, a column, a group or the whole grid: not drawn when there is
  // nothing in its scope the user can change.
  const bulkBox = (tally: Tally | undefined, name: string, position: Position, scope: Scope) => {
    if (!tally || tally.total === 0) return null;
    const state = triStateOf(tally);
    return (
      <Checkbox
        aria-label={name}
        checked={state === 'checked'}
        indeterminate={state === 'mixed'}
        onChange={() => toggleMany(scope, position)}
        className={COVER_CELL}
        {...focusProps(position.row, position.col)}
      />
    );
  };

  // The room a box takes in the first column, so labels line up in the rows that have none.
  const boxSpace = <span aria-hidden="true" className="size-[18px] shrink-0" />;

  const corner = bulkBox(tallies.all, labels.selectAll, { row: 0, col: 0 }, {});

  return (
    <div className={clsx('min-w-0', className)}>
      <div
        className={clsx(
          'overflow-hidden rounded-2xl border bg-[var(--color-bg-panel)]',
          error ? 'border-red-400 dark:border-red-500/60' : 'border-[var(--color-border)]'
        )}
      >
        {/* `relative`: the screen reader texts of the cells are absolutely positioned, and
            without a containing block here they escape the frame and widen the page. */}
        <div
          className="relative scroll-ps-36 scroll-pt-20 overflow-auto sm:scroll-ps-60"
          style={{ maxHeight }}
        >
          <table
            ref={gridRef}
            role="grid"
            aria-label={ariaLabel}
            aria-describedby={error ? errorId : undefined}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            className="w-full border-separate border-spacing-0 text-sm [&>tbody:last-of-type>tr:last-child>*]:border-b-0"
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  {...(!corner && focusProps(0, 0))}
                  className={clsx(
                    PINNED_START,
                    CELL_BORDER,
                    HEADER_BG,
                    'py-cell-head top-0 z-20 min-w-36 px-4 text-start text-xs font-semibold text-[var(--color-text-secondary)] sm:min-w-60',
                    !corner && FOCUS_CELL
                  )}
                >
                  <div className="flex items-center gap-3">
                    {corner ?? (anyBox && boxSpace)}
                    <span className={LABEL_TEXT}>
                      <bdi>{labels.rowHeader}</bdi>
                    </span>
                  </div>
                </th>
                {columns.map((column, c) => {
                  const box = bulkBox(
                    tallies.columns.get(column.id),
                    labels.selectAllFor(column.label),
                    { row: 0, col: c + 1 },
                    { columnId: column.id }
                  );
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      {...(!box && focusProps(0, c + 1))}
                      className={clsx(
                        CELL_BORDER,
                        HEADER_BG,
                        'py-cell-head sticky top-0 z-10 min-w-24 px-2 text-center text-xs font-semibold text-[var(--color-text-secondary)]',
                        !box && FOCUS_CELL
                      )}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={LABEL_TEXT}>
                          <bdi>{column.label}</bdi>
                        </span>
                        {box}
                        {column.readOnly && (
                          <>
                            <Lock aria-hidden="true" className="size-3.5" />
                            <span className="sr-only">, {labels.readOnlyColumn}</span>
                          </>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {layout.map(({ group, groupRow, rows }) => {
              const groupBox = bulkBox(
                tallies.groups.get(group.id),
                labels.selectAllFor(group.label),
                { row: groupRow, col: 0 },
                { groupId: group.id }
              );
              return (
                <tbody key={group.id}>
                  <tr>
                    <th
                      scope="rowgroup"
                      {...(!groupBox && focusProps(groupRow, 0))}
                      className={clsx(
                        PINNED_START,
                        CELL_BORDER,
                        HEADER_BG,
                        'z-10 text-start',
                        !groupBox && FOCUS_CELL
                      )}
                    >
                      <div className="py-row-8 flex items-center gap-3 px-4">
                        {groupBox ?? (anyBox && boxSpace)}
                        <span
                          className={clsx(
                            'text-sm font-semibold text-[var(--color-text-primary)]',
                            LABEL_TEXT
                          )}
                        >
                          <bdi>{group.label}</bdi>
                        </span>
                      </div>
                    </th>
                    {columns.length > 0 && (
                      <td
                        aria-hidden="true"
                        colSpan={columns.length}
                        className={clsx(CELL_BORDER, HEADER_BG)}
                      />
                    )}
                  </tr>
                  {rows.map(({ row, index }) => {
                    const rowBox = bulkBox(
                      tallies.rows.get(row.id),
                      labels.selectAllFor(row.label),
                      { row: index, col: 0 },
                      { rowId: row.id }
                    );
                    return (
                      <tr key={row.id}>
                        <th
                          scope="row"
                          {...(!rowBox && focusProps(index, 0))}
                          className={clsx(
                            PINNED_START,
                            CELL_BORDER,
                            'z-10 bg-[var(--color-bg-panel)] text-start font-medium',
                            !rowBox && FOCUS_CELL
                          )}
                        >
                          <div className="py-row-10 flex items-center gap-3 px-4">
                            {rowBox ?? (anyBox && boxSpace)}
                            <span className={clsx('text-[var(--color-text-primary)]', LABEL_TEXT)}>
                              <bdi>{row.label}</bdi>
                            </span>
                          </div>
                        </th>
                        {columns.map((column, c) => {
                          const cell = cellByKey.get(cellKey(row.id, column.id))!;
                          const name = labels.cell(row.label, column.label);
                          const position = { row: index, col: c + 1 };
                          if (!cell.applicable) {
                            return (
                              <td
                                key={column.id}
                                {...focusProps(position.row, position.col)}
                                className={clsx(
                                  CELL_BORDER,
                                  'bg-gray-50 dark:bg-white/[0.04]',
                                  FOCUS_CELL
                                )}
                              >
                                <span className="sr-only">{labels.notApplicable(name)}</span>
                              </td>
                            );
                          }
                          if (cell.locked) {
                            const on = grantedSet.has(cell.key);
                            const Icon = on ? Check : X;
                            return (
                              <td
                                key={column.id}
                                {...focusProps(position.row, position.col)}
                                className={clsx(CELL_BORDER, FOCUS_CELL)}
                              >
                                <div className="py-row-10 flex justify-center">
                                  <Icon
                                    aria-hidden="true"
                                    className={clsx(
                                      'size-[18px]',
                                      on
                                        ? 'text-green-700 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                    )}
                                  />
                                </div>
                                <span className="sr-only">{labels.readOnlyCell(name, on)}</span>
                              </td>
                            );
                          }
                          return (
                            <td
                              key={column.id}
                              className={clsx(
                                'relative hover:bg-gray-50 dark:hover:bg-white/5',
                                CELL_BORDER
                              )}
                            >
                              <div className="py-row-10 flex justify-center">
                                <Checkbox
                                  aria-label={name}
                                  checked={grantedSet.has(cell.key)}
                                  onChange={() => toggleOne(cell, position)}
                                  className={COVER_CELL}
                                  {...focusProps(position.row, position.col)}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
};
