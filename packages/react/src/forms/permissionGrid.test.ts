import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LABELS,
  cellKey,
  focusMoveOf,
  gridCells,
  gridRowLengths,
  inScope,
  moveFocus,
  resolveLabels,
  tallyGrid,
  toggleCell,
  toggleScope,
  triStateOf,
  type PermissionGridColumn,
  type PermissionGridGroup,
} from './permissionGrid';

// Two areas of two permissions, three roles. "Admin" is built in: read-only. The archive can be
// read and deleted, never edited: `columns` lists the roles a row applies to.
const columns: PermissionGridColumn[] = [
  { id: 'admin', label: 'Admin', readOnly: true },
  { id: 'editor', label: 'Editor' },
  { id: 'viewer', label: 'Viewer' },
];
const groups: PermissionGridGroup[] = [
  {
    id: 'invoices',
    label: 'Invoices',
    rows: [
      { id: 'invoices.view', label: 'View invoices' },
      { id: 'invoices.edit', label: 'Edit invoices' },
    ],
  },
  {
    id: 'archive',
    label: 'Archive',
    rows: [
      { id: 'archive.view', label: 'View archive' },
      { id: 'archive.delete', label: 'Delete archive', columns: ['admin', 'editor'] },
    ],
  },
];

describe('cellKey', () => {
  it('joins the row and the column ids', () => {
    expect(cellKey('invoices.edit', 'admin')).toBe('invoices.edit:admin');
  });
});

describe('gridCells', () => {
  it('lists every row of every group against every column, in reading order', () => {
    const cells = gridCells(groups, columns);
    expect(cells).toHaveLength(12);
    expect(cells.slice(0, 4).map((c) => c.key)).toEqual([
      'invoices.view:admin',
      'invoices.view:editor',
      'invoices.view:viewer',
      'invoices.edit:admin',
    ]);
    expect(cells[0]).toMatchObject({
      rowId: 'invoices.view',
      columnId: 'admin',
      groupId: 'invoices',
    });
  });

  it('marks the columns a row does not list as not applicable', () => {
    const cells = gridCells(groups, columns);
    const archiveDelete = cells.filter((c) => c.rowId === 'archive.delete');
    expect(archiveDelete.map((c) => [c.columnId, c.applicable])).toEqual([
      ['admin', true],
      ['editor', true],
      ['viewer', false],
    ]);
    expect(cells.filter((c) => c.rowId === 'archive.view').every((c) => c.applicable)).toBe(true);
  });

  it('locks the cells of a read-only column, and all of them when the grid is read-only', () => {
    const locked = (readOnly?: boolean) =>
      gridCells(groups, columns, readOnly)
        .filter((c) => c.locked)
        .map((c) => c.columnId);
    expect(new Set(locked())).toEqual(new Set(['admin']));
    expect(locked()).toHaveLength(4);
    expect(locked(true)).toHaveLength(12);
  });
});

describe('triStateOf and tallyGrid', () => {
  const cells = gridCells(groups, columns);

  it('is unchecked with nothing granted, checked with everything, mixed between', () => {
    expect(triStateOf({ granted: 0, total: 4 })).toBe('unchecked');
    expect(triStateOf({ granted: 4, total: 4 })).toBe('checked');
    expect(triStateOf({ granted: 1, total: 4 })).toBe('mixed');
    expect(triStateOf({ granted: 3, total: 4 })).toBe('mixed');
  });

  it('is unchecked for a scope with nothing to change', () => {
    expect(triStateOf({ granted: 0, total: 0 })).toBe('unchecked');
  });

  it('counts a row, a column, a group and the whole grid', () => {
    const value = [
      'invoices.view:editor',
      'invoices.view:viewer',
      'invoices.edit:editor',
      'archive.delete:editor',
    ];
    const tallies = tallyGrid(cells, value);
    // Row: two editable cells (the admin one is read-only).
    expect(tallies.rows.get('invoices.view')).toEqual({ granted: 2, total: 2 });
    expect(tallies.rows.get('invoices.edit')).toEqual({ granted: 1, total: 2 });
    expect(tallies.rows.get('archive.view')).toEqual({ granted: 0, total: 2 });
    // Column: one cell per row, but the archive's delete does not apply to viewers.
    expect(tallies.columns.get('editor')).toEqual({ granted: 3, total: 4 });
    expect(tallies.columns.get('viewer')).toEqual({ granted: 1, total: 3 });
    // Group.
    expect(tallies.groups.get('invoices')).toEqual({ granted: 3, total: 4 });
    expect(tallies.groups.get('archive')).toEqual({ granted: 1, total: 3 });
    // The grid: 4 + 3 editable, not applicable and read-only cells left out.
    expect(tallies.all).toEqual({ granted: 4, total: 7 });
  });

  it('leaves a read-only column out: nothing to change, nothing counted', () => {
    const tallies = tallyGrid(cells, ['invoices.view:admin', 'invoices.view:editor']);
    expect(tallies.columns.get('admin')).toEqual({ granted: 0, total: 0 });
    expect(tallies.all.granted).toBe(1);
  });

  it('leaves a not applicable cell out even when its key is in the value', () => {
    const tallies = tallyGrid(cells, ['archive.delete:viewer']);
    expect(tallies.rows.get('archive.delete')).toEqual({ granted: 0, total: 1 });
    expect(tallies.all.granted).toBe(0);
  });

  it('counts nothing at all in a read-only grid', () => {
    const tallies = tallyGrid(gridCells(groups, columns, true), ['invoices.view:editor']);
    expect(tallies.all).toEqual({ granted: 0, total: 0 });
    expect(tallies.rows.get('invoices.view')).toEqual({ granted: 0, total: 0 });
  });
});

describe('toggleScope', () => {
  const cells = gridCells(groups, columns);

  it('grants every editable cell of an unchecked scope', () => {
    expect(toggleScope(cells, { rowId: 'invoices.edit' }, [])).toEqual([
      'invoices.edit:editor',
      'invoices.edit:viewer',
    ]);
  });

  it('selects all in a mixed scope, then clears on the next click', () => {
    const mixed = ['invoices.edit:viewer'];
    const all = toggleScope(cells, { rowId: 'invoices.edit' }, mixed);
    expect(new Set(all)).toEqual(new Set(['invoices.edit:editor', 'invoices.edit:viewer']));
    const cleared = toggleScope(cells, { rowId: 'invoices.edit' }, all);
    expect(cleared).toEqual([]);
  });

  it('does not duplicate a key already granted', () => {
    const next = toggleScope(cells, { columnId: 'editor' }, ['invoices.view:editor']);
    expect(next.filter((k) => k === 'invoices.view:editor')).toHaveLength(1);
    expect(next).toHaveLength(4);
  });

  it('skips the cells that are not applicable and the read-only ones', () => {
    const next = toggleScope(cells, {}, []);
    expect(next).toHaveLength(7);
    expect(next.some((k) => k.endsWith(':admin'))).toBe(false);
    expect(next).not.toContain('archive.delete:viewer');
  });

  it('keeps what it does not own: a built-in role grant, a key of another grid', () => {
    const value = ['invoices.view:admin', 'unknown:editor', 'archive.delete:viewer'];
    const granted = toggleScope(cells, { groupId: 'invoices' }, value);
    expect(granted).toEqual(expect.arrayContaining(value));
    const cleared = toggleScope(cells, { groupId: 'invoices' }, granted);
    expect(cleared).toEqual(value);
  });

  it('works for a group and for the corner (every cell)', () => {
    expect(toggleScope(cells, { groupId: 'archive' }, [])).toEqual([
      'archive.view:editor',
      'archive.view:viewer',
      'archive.delete:editor',
    ]);
    const everything = toggleScope(cells, {}, []);
    expect(toggleScope(cells, {}, everything)).toEqual([]);
  });

  it('returns the value itself for a scope with nothing to change', () => {
    const value = ['invoices.view:admin'];
    expect(toggleScope(cells, { columnId: 'admin' }, value)).toBe(value);
    expect(toggleScope(gridCells(groups, columns, true), {}, value)).toBe(value);
  });
});

describe('toggleCell', () => {
  const cells = gridCells(groups, columns);
  const find = (key: string) => cells.find((c) => c.key === key)!;

  it('grants a cell that is not, and takes back one that is', () => {
    expect(toggleCell(find('invoices.view:editor'), ['a'])).toEqual(['a', 'invoices.view:editor']);
    expect(toggleCell(find('invoices.view:editor'), ['invoices.view:editor', 'a'])).toEqual(['a']);
  });

  it('leaves a read-only or not applicable cell alone', () => {
    const value = ['a'];
    expect(toggleCell(find('invoices.view:admin'), value)).toBe(value);
    expect(toggleCell(find('archive.delete:viewer'), value)).toBe(value);
  });
});

describe('inScope', () => {
  const cells = gridCells(groups, columns);

  it('picks the cells of a row, a column, a group, or all of them', () => {
    expect(inScope(cells, { rowId: 'archive.view' })).toHaveLength(3);
    expect(inScope(cells, { columnId: 'viewer' })).toHaveLength(4);
    expect(inScope(cells, { groupId: 'invoices' })).toHaveLength(6);
    expect(inScope(cells, {})).toHaveLength(12);
  });
});

describe('labels', () => {
  it('names a cell by its row and its column', () => {
    expect(DEFAULT_LABELS.cell('Edit invoices', 'Admin')).toBe('Edit invoices, Admin');
  });

  it('says how many permissions are granted, in the singular for one', () => {
    expect(DEFAULT_LABELS.summary(8, 26)).toBe('8 of 26 permissions granted');
    expect(DEFAULT_LABELS.summary(0, 26)).toBe('0 of 26 permissions granted');
    expect(DEFAULT_LABELS.summary(1, 1)).toBe('1 of 1 permission granted');
  });

  it('writes a read-only or not applicable cell in words', () => {
    expect(DEFAULT_LABELS.readOnlyCell('Edit invoices, Admin', true)).toBe(
      'Edit invoices, Admin: granted, read-only'
    );
    expect(DEFAULT_LABELS.readOnlyCell('Edit invoices, Admin', false)).toBe(
      'Edit invoices, Admin: not granted, read-only'
    );
    expect(DEFAULT_LABELS.notApplicable('Delete archive, Viewer')).toBe(
      'Delete archive, Viewer: not applicable'
    );
  });

  it('merges the given labels over the English ones', () => {
    const labels = resolveLabels({ selectAll: 'Tout sélectionner' });
    expect(labels.selectAll).toBe('Tout sélectionner');
    expect(labels.rowHeader).toBe(DEFAULT_LABELS.rowHeader);
    expect(resolveLabels()).toEqual(DEFAULT_LABELS);
  });

  it('ignores a label given as undefined', () => {
    expect(resolveLabels({ selectAll: undefined }).selectAll).toBe(DEFAULT_LABELS.selectAll);
  });
});

describe('gridRowLengths', () => {
  it('has the header row, a one-cell row per group and a full row per permission', () => {
    // Header (the corner and 3 columns), then Invoices: group + 2 rows, then Archive: group + 2.
    expect(gridRowLengths(groups, 3)).toEqual([4, 1, 4, 4, 1, 4, 4]);
  });

  it('is only the header row without a group', () => {
    expect(gridRowLengths([], 3)).toEqual([4]);
  });
});

describe('focusMoveOf', () => {
  const none = {};

  it('maps the arrows, Home and End', () => {
    expect(focusMoveOf('ArrowUp', none, 'ltr')).toBe('up');
    expect(focusMoveOf('ArrowDown', none, 'ltr')).toBe('down');
    expect(focusMoveOf('Home', none, 'ltr')).toBe('rowStart');
    expect(focusMoveOf('End', none, 'ltr')).toBe('rowEnd');
  });

  it('maps Ctrl+Home and Ctrl+End to the ends of the grid', () => {
    expect(focusMoveOf('Home', { ctrlKey: true }, 'ltr')).toBe('gridStart');
    expect(focusMoveOf('End', { ctrlKey: true }, 'ltr')).toBe('gridEnd');
  });

  it('follows the reading direction along the row', () => {
    expect(focusMoveOf('ArrowRight', none, 'ltr')).toBe('end');
    expect(focusMoveOf('ArrowLeft', none, 'ltr')).toBe('start');
    expect(focusMoveOf('ArrowRight', none, 'rtl')).toBe('start');
    expect(focusMoveOf('ArrowLeft', none, 'rtl')).toBe('end');
    expect(focusMoveOf('ArrowDown', none, 'rtl')).toBe('down');
    expect(focusMoveOf('Home', none, 'rtl')).toBe('rowStart');
  });

  it('leaves Space, Tab and the letters to the browser', () => {
    for (const key of [' ', 'Tab', 'Enter', 'a', 'PageDown', 'Escape']) {
      expect(focusMoveOf(key, none, 'ltr'), key).toBeNull();
    }
  });

  it('leaves a key held with Alt, Meta or Shift alone, and Ctrl with the arrows', () => {
    expect(focusMoveOf('ArrowLeft', { altKey: true }, 'ltr')).toBeNull();
    expect(focusMoveOf('ArrowDown', { metaKey: true }, 'ltr')).toBeNull();
    expect(focusMoveOf('ArrowDown', { shiftKey: true }, 'ltr')).toBeNull();
    expect(focusMoveOf('Home', { shiftKey: true }, 'ltr')).toBeNull();
    expect(focusMoveOf('ArrowDown', { ctrlKey: true }, 'ltr')).toBeNull();
  });
});

describe('moveFocus', () => {
  const lengths = gridRowLengths(groups, 3); // [4, 1, 4, 4, 1, 4, 4]

  it('moves one cell along the row and stops at its ends', () => {
    expect(moveFocus(lengths, { row: 2, col: 1 }, 'end')).toEqual({ row: 2, col: 2 });
    expect(moveFocus(lengths, { row: 2, col: 1 }, 'start')).toEqual({ row: 2, col: 0 });
    expect(moveFocus(lengths, { row: 2, col: 0 }, 'start')).toEqual({ row: 2, col: 0 });
    expect(moveFocus(lengths, { row: 2, col: 3 }, 'end')).toEqual({ row: 2, col: 3 });
  });

  it('moves one row up or down and stops at the first and last rows', () => {
    expect(moveFocus(lengths, { row: 2, col: 2 }, 'down')).toEqual({ row: 3, col: 2 });
    expect(moveFocus(lengths, { row: 3, col: 2 }, 'up')).toEqual({ row: 2, col: 2 });
    expect(moveFocus(lengths, { row: 0, col: 2 }, 'up')).toEqual({ row: 0, col: 2 });
    expect(moveFocus(lengths, { row: 6, col: 2 }, 'down')).toEqual({ row: 6, col: 2 });
  });

  it('lands on the only cell of a group row, from any column', () => {
    expect(moveFocus(lengths, { row: 0, col: 3 }, 'down')).toEqual({ row: 1, col: 0 });
    expect(moveFocus(lengths, { row: 3, col: 2 }, 'down')).toEqual({ row: 4, col: 0 });
    expect(moveFocus(lengths, { row: 5, col: 2 }, 'up')).toEqual({ row: 4, col: 0 });
  });

  it('does not move along a group row, which has one cell', () => {
    expect(moveFocus(lengths, { row: 1, col: 0 }, 'end')).toEqual({ row: 1, col: 0 });
    expect(moveFocus(lengths, { row: 1, col: 0 }, 'start')).toEqual({ row: 1, col: 0 });
    expect(moveFocus(lengths, { row: 1, col: 0 }, 'rowEnd')).toEqual({ row: 1, col: 0 });
  });

  it('goes to the ends of the row with Home and End', () => {
    expect(moveFocus(lengths, { row: 3, col: 1 }, 'rowStart')).toEqual({ row: 3, col: 0 });
    expect(moveFocus(lengths, { row: 3, col: 1 }, 'rowEnd')).toEqual({ row: 3, col: 3 });
  });

  it('goes to the first and last cells of the grid with Ctrl+Home and Ctrl+End', () => {
    expect(moveFocus(lengths, { row: 3, col: 1 }, 'gridStart')).toEqual({ row: 0, col: 0 });
    expect(moveFocus(lengths, { row: 3, col: 1 }, 'gridEnd')).toEqual({ row: 6, col: 3 });
  });

  it('ends on the last cell of the last row, whatever its length', () => {
    expect(moveFocus([4, 4, 1], { row: 0, col: 0 }, 'gridEnd')).toEqual({ row: 2, col: 0 });
  });

  it('keeps the position given for a grid with no row', () => {
    expect(moveFocus([], { row: 0, col: 0 }, 'down')).toEqual({ row: 0, col: 0 });
    expect(moveFocus([], { row: 0, col: 0 }, 'gridEnd')).toEqual({ row: 0, col: 0 });
  });
});
