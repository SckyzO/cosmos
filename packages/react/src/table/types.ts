import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

export type ColumnDef<T> = {
  /** Stable key — used for sort/filter identity. */
  key: string;
  label: ReactNode;
  /** Optional fixed width (CSS value, e.g. `'20%'` or `'180px'`). */
  width?: string;
  /** Tailwind text alignment override. */
  align?: 'left' | 'right' | 'center';
  /** Renders the cell for a row. */
  render: (row: T) => ReactNode;
  /** Returns the raw sortable value for the row. */
  sortValue?: (row: T) => string | number | null;
  /** Returns the raw filterable string for the row. */
  filterValue?: (row: T) => string;
  sortable?: boolean;
  filterable?: boolean;
};
