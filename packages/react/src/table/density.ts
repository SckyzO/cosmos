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
