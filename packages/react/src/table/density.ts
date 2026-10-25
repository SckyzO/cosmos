import type { DataTableDensity } from './types';

// Vertical cell padding per density. Every header cell (ColumnHeader, the
// selection and action headers) and every body cell reads it from here, so the
// selection and action columns can't drift from the data columns.

export const HEADER_CELL_PADDING: Record<DataTableDensity, string> = {
  default: 'py-3',
  comfortable: 'py-4',
};

export const BODY_CELL_PADDING: Record<DataTableDensity, string> = {
  default: 'py-3.5',
  comfortable: 'py-5',
};

// Placeholder widths of a loading row, cycled over its cells so the rows do not look stamped.
export const SKELETON_WIDTHS = ['w-24', 'w-16', 'w-20', 'w-12'] as const;
