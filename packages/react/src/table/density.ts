import type { DataTableDensity } from './types';

// Vertical cell padding per density, and the look of a header cell. Every header
// cell (ColumnHeader, the selection and action headers, TableHeaderCell) and
// every body cell reads them from here, so no column, and neither table, can
// drift from the others.

export const HEADER_CELL_PADDING: Record<DataTableDensity, string> = {
  default: 'py-3',
  comfortable: 'py-4',
};

// A button inside it (a sortable label) takes the text transform itself: the reset
// of buttons clears it.
export const HEADER_CELL =
  'bg-gray-50 px-4 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase dark:bg-gray-800';

export const BODY_CELL_PADDING: Record<DataTableDensity, string> = {
  default: 'py-3.5',
  comfortable: 'py-5',
};

// Placeholder widths of a loading row, cycled over its cells so the rows do not look stamped.
export const SKELETON_WIDTHS = ['w-24', 'w-16', 'w-20', 'w-12'] as const;

// With `virtualize` the rows have one fixed height, so the window is arithmetic. Cell padding is
// gone, the content sits in a box of `VIRTUAL_CELL_HEIGHT` and is clipped to it, and a row is
// `VIRTUAL_ROW_HEIGHT` from its top to the next one's: the box plus the 1px divider. The heights
// are those of a standard row (one line of `text-sm`) at the default text size, measured on the
// rendered table; a story compares them with an ordinary row, so a change here must keep it
// passing.
export const VIRTUAL_ROW_HEIGHT: Record<DataTableDensity, number> = {
  default: 49,
  comfortable: 61,
};

export const VIRTUAL_CELL_HEIGHT: Record<DataTableDensity, number> = {
  default: 48,
  comfortable: 60,
};

export const VIRTUAL_CELL_PADDING = 'py-0';
