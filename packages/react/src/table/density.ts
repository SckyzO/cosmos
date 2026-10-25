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
