import type { Direction } from '../hooks/direction';

// The logic of `PermissionGrid`: which cells exist, which of them the user can change, the
// tri-state of a row, a column, a group and the whole grid, what a click on one of those boxes
// does, and where the arrow keys move the focus. The component only draws and wires events.

/** A column: an action (view, edit…) or a role. */
export type PermissionGridColumn = {
  id: string;
  /** Names the column, and is read as part of the name of each of its cells. */
  label: string;
  /**
   * A column nobody can edit, such as a built-in role. Its cells show what is granted as an icon
   * and a text for the screen reader, and its box in the header is left out.
   */
  readOnly?: boolean;
};

/** A permission: one row of the grid. */
export type PermissionGridRow = {
  id: string;
  /** Names the row, and is read as part of the name of each of its cells. */
  label: string;
  /**
   * The ids of the columns this permission applies to. A column that is not listed has an empty
   * cell that no one can grant, and that no count includes. Omitted: every column.
   */
  columns?: string[];
};

/** An area of permissions: a header row over its permissions. */
export type PermissionGridGroup = {
  id: string;
  label: string;
  rows: PermissionGridRow[];
};

/**
 * The key of a cell in the grid's `value`: the id of the row, a colon and the id of the column.
 * To build a `defaultValue`, or to read a granted cell back.
 */
export const cellKey = (rowId: string, columnId: string) => `${rowId}:${columnId}`;

/** One cell of the grid, as far as the logic reads it. */
export type GridCell = {
  key: string;
  rowId: string;
  columnId: string;
  groupId: string;
  /** The row applies to this column. */
  applicable: boolean;
  /** Nobody can change it: its column is read-only, or the whole grid is. */
  locked: boolean;
};

/** Every cell of the grid, group by group, row by row, in the order they are read. */
export const gridCells = (
  groups: readonly PermissionGridGroup[],
  columns: readonly PermissionGridColumn[],
  readOnly = false
): GridCell[] =>
  groups.flatMap((group) =>
    group.rows.flatMap((row) =>
      columns.map((column) => ({
        key: cellKey(row.id, column.id),
        rowId: row.id,
        columnId: column.id,
        groupId: group.id,
        applicable: row.columns === undefined || row.columns.includes(column.id),
        locked: readOnly || column.readOnly === true,
      }))
    )
  );

/** A cell the user can grant or take back: it applies, and it is not read-only. */
export const isEditable = (cell: GridCell) => cell.applicable && !cell.locked;

/** What one of the boxes of the grid selects: a row, a column, a group, or (none) every cell. */
export type Scope = { rowId?: string; columnId?: string; groupId?: string };

/** The cells inside `scope`. */
export const inScope = (cells: readonly GridCell[], scope: Scope): GridCell[] =>
  cells.filter(
    (cell) =>
      (scope.rowId === undefined || cell.rowId === scope.rowId) &&
      (scope.columnId === undefined || cell.columnId === scope.columnId) &&
      (scope.groupId === undefined || cell.groupId === scope.groupId)
  );

/** How many editable cells a scope holds, and how many of them are granted. */
export type Tally = { granted: number; total: number };

export type TriState = 'unchecked' | 'mixed' | 'checked';

/** Nothing granted (or nothing to grant) is unchecked, everything granted is checked. */
export const triStateOf = ({ granted, total }: Tally): TriState => {
  if (granted === 0) return 'unchecked';
  return granted === total ? 'checked' : 'mixed';
};

export type Tallies = {
  all: Tally;
  rows: Map<string, Tally>;
  columns: Map<string, Tally>;
  groups: Map<string, Tally>;
};

const entry = (map: Map<string, Tally>, id: string) => {
  let tally = map.get(id);
  if (!tally) {
    tally = { granted: 0, total: 0 };
    map.set(id, tally);
  }
  return tally;
};

/**
 * The tally of every row, column, group and of the whole grid, in one pass. Cells that are not
 * applicable or are read-only are left out: they are not the user's to change. A row, column or
 * group made only of those has a tally of zero out of zero, never missing.
 */
export const tallyGrid = (cells: readonly GridCell[], value: readonly string[]): Tallies => {
  const granted = new Set(value);
  const tallies: Tallies = {
    all: { granted: 0, total: 0 },
    rows: new Map(),
    columns: new Map(),
    groups: new Map(),
  };
  for (const cell of cells) {
    // An entry for every id, counted or not.
    const covering = [
      entry(tallies.rows, cell.rowId),
      entry(tallies.columns, cell.columnId),
      entry(tallies.groups, cell.groupId),
    ];
    if (!isEditable(cell)) continue;
    for (const tally of [tallies.all, ...covering]) {
      tally.total += 1;
      if (granted.has(cell.key)) tally.granted += 1;
    }
  }
  return tallies;
};

/**
 * What a click on the box of `scope` gives: every editable cell granted, or, when they all are
 * already, none of them. A mixed box therefore selects all first, and clears on the next click.
 * The keys the scope does not own (a read-only column's grants, another grid's) stay as they are,
 * and a scope with nothing editable returns `value` itself.
 */
export const toggleScope = (
  cells: readonly GridCell[],
  scope: Scope,
  value: readonly string[]
): string[] => {
  const editable = inScope(cells, scope).filter(isEditable);
  if (editable.length === 0) return value as string[];
  const granted = new Set(value);
  if (editable.every((cell) => granted.has(cell.key))) {
    const cleared = new Set(editable.map((cell) => cell.key));
    return value.filter((key) => !cleared.has(key));
  }
  return [...value, ...editable.filter((cell) => !granted.has(cell.key)).map((cell) => cell.key)];
};

/** A click on one cell: granted if it was not, taken back if it was. A locked cell does not change. */
export const toggleCell = (cell: GridCell, value: readonly string[]): string[] => {
  if (!isEditable(cell)) return value as string[];
  return value.includes(cell.key) ? value.filter((key) => key !== cell.key) : [...value, cell.key];
};

// ── Texts ───────────────────────────────────────────────────────────────────

/** Every text the grid writes itself, to translate or reword. */
export type PermissionGridLabels = {
  /** The header over the first column. Default `Permission`. */
  rowHeader: string;
  /** Name of the box in the corner, which selects every cell. Default `Select all`. */
  selectAll: string;
  /** Name of the box of a row, a column or a group. Default `Select all for <label>`. */
  selectAllFor: (label: string) => string;
  /** Name of the box of one cell. Default `<row>, <column>`, e.g. `Edit invoices, Admin`. */
  cell: (row: string, column: string) => string;
  /** What a read-only cell says, in place of a box. Default `<cell>: granted, read-only`. */
  readOnlyCell: (cell: string, granted: boolean) => string;
  /** What an empty cell, a column the row does not apply to, says. Default `<cell>: not applicable`. */
  notApplicable: (cell: string) => string;
  /** Read after the name of a read-only column. Default `Read-only`. */
  readOnlyColumn: string;
  /** Announced after a box that selects several cells. Default `8 of 26 permissions granted`. */
  summary: (granted: number, total: number) => string;
};

export const DEFAULT_LABELS: PermissionGridLabels = {
  rowHeader: 'Permission',
  selectAll: 'Select all',
  selectAllFor: (label) => `Select all for ${label}`,
  cell: (row, column) => `${row}, ${column}`,
  readOnlyCell: (cell, granted) => `${cell}: ${granted ? 'granted' : 'not granted'}, read-only`,
  notApplicable: (cell) => `${cell}: not applicable`,
  readOnlyColumn: 'Read-only',
  summary: (granted, total) =>
    `${granted} of ${total} ${total === 1 ? 'permission' : 'permissions'} granted`,
};

/** The English labels with `labels` laid over them; a label given as `undefined` keeps its default. */
export const resolveLabels = (
  labels: Partial<PermissionGridLabels> = {}
): PermissionGridLabels => ({
  ...DEFAULT_LABELS,
  ...Object.fromEntries(Object.entries(labels).filter(([, label]) => label !== undefined)),
});

// ── Keyboard ────────────────────────────────────────────────────────────────

/** A cell of the grid by its row and column index, the header row being row 0. */
export type Position = { row: number; col: number };

export type FocusMove =
  | 'up'
  | 'down'
  /** One cell toward the start of the line. */
  | 'start'
  /** One cell toward the end of the line. */
  | 'end'
  | 'rowStart'
  | 'rowEnd'
  | 'gridStart'
  | 'gridEnd';

/**
 * How many cells each row of the grid has: the header row (the corner and the columns), then for
 * each group its header row, which has one cell, and a row per permission.
 */
export const gridRowLengths = (
  groups: readonly PermissionGridGroup[],
  columnCount: number
): number[] => [
  columnCount + 1,
  ...groups.flatMap((group) => [1, ...group.rows.map(() => columnCount + 1)]),
];

type Modifiers = { ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean; shiftKey?: boolean };

/**
 * The move a key asks for, or `null` for a key the grid leaves alone: Space toggles the box in
 * focus, Tab leaves the grid, and a key held with Alt, Meta or Shift keeps its meaning for the
 * browser (Alt+ArrowLeft is Back). Ctrl only goes with Home and End. Left and Right follow the
 * reading direction; Up, Down, Home and End never change.
 */
export const focusMoveOf = (
  key: string,
  { ctrlKey, altKey, metaKey, shiftKey }: Modifiers,
  direction: Direction
): FocusMove | null => {
  if (altKey || metaKey || shiftKey) return null;
  if (ctrlKey) {
    if (key === 'Home') return 'gridStart';
    return key === 'End' ? 'gridEnd' : null;
  }
  switch (key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowRight':
      return direction === 'rtl' ? 'start' : 'end';
    case 'ArrowLeft':
      return direction === 'rtl' ? 'end' : 'start';
    case 'Home':
      return 'rowStart';
    case 'End':
      return 'rowEnd';
    default:
      return null;
  }
};

const lastCol = (rowLengths: readonly number[], row: number) =>
  Math.max((rowLengths[row] ?? 1) - 1, 0);

/**
 * A position kept inside the grid: the row and the column are clamped to the rows and cells that
 * exist, for a grid whose groups or columns changed since the focus was last placed.
 */
export const clampPosition = (rowLengths: readonly number[], { row, col }: Position): Position => {
  const clampedRow = Math.min(Math.max(row, 0), Math.max(rowLengths.length - 1, 0));
  return { row: clampedRow, col: Math.min(Math.max(col, 0), lastCol(rowLengths, clampedRow)) };
};

/**
 * Where the focus goes. Nothing wraps: at an edge the focus stays. A row with fewer cells (a
 * group's header, which has one) takes the focus at its last cell when it is reached from a
 * further column.
 */
export const moveFocus = (
  rowLengths: readonly number[],
  from: Position,
  move: FocusMove
): Position => {
  if (rowLengths.length === 0) return from;
  const { row, col } = clampPosition(rowLengths, from);
  const lastRow = rowLengths.length - 1;
  const onRow = (target: number): Position => ({
    row: target,
    col: Math.min(col, lastCol(rowLengths, target)),
  });
  switch (move) {
    case 'up':
      return onRow(Math.max(row - 1, 0));
    case 'down':
      return onRow(Math.min(row + 1, lastRow));
    case 'start':
      return { row, col: Math.max(col - 1, 0) };
    case 'end':
      return { row, col: Math.min(col + 1, lastCol(rowLengths, row)) };
    case 'rowStart':
      return { row, col: 0 };
    case 'rowEnd':
      return { row, col: lastCol(rowLengths, row) };
    case 'gridStart':
      return { row: 0, col: 0 };
    case 'gridEnd':
      return { row: lastRow, col: lastCol(rowLengths, lastRow) };
  }
};
