import type { DataTableDensity } from './types';

// Vertical cell padding, and the look of a header cell. Every header cell (ColumnHeader, the
// selection and action headers, TableHeaderCell) and every body cell reads them from here, so no
// column, and neither table, can drift from the others. The padding is a theme token that the
// page's `data-density` moves; a table with its own `density` carries the attribute itself, so
// the same tokens answer to it (default 12px and 14px, `compact` 8px and 10px, `comfortable`
// 16px and 20px).

export const HEADER_CELL_PADDING = 'py-cell-head';

// A button inside it (a sortable label) takes the text transform itself: the reset
// of buttons clears it.
export const HEADER_CELL =
  'bg-gray-50 px-4 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase dark:bg-gray-800';

export const BODY_CELL_PADDING = 'py-cell-body';

// Placeholder widths of a loading row, cycled over its cells so the rows do not look stamped.
export const SKELETON_WIDTHS = ['w-24', 'w-16', 'w-20', 'w-12'] as const;

// With `virtualize` every row has one fixed height, so the window is arithmetic. Cell padding is
// gone and the content sits in a box of `VIRTUAL_CELL_HEIGHT` that clips it. The box is in `em` of
// the cell's font (`text-sm`, which `data-text-size` rescales), so rows grow with the text size
// and still clip at one height. The theme sets the token per density: the values are those of a
// standard row (one line of `text-sm`), 40px, 48px and 60px at the default text size, and a row
// is the box plus the 1px divider. A story compares them with an ordinary row. `calc(n em / 14)`
// keeps the default exact; without a density anywhere the fallback is the default.
export const VIRTUAL_CELL_HEIGHT = 'var(--cosmos-density-virtual-cell, calc(48em / 14))';

// The row height in px at the default text size: what the window uses until the first drawn row
// has been measured (the real height follows the text size, and a density the page sets).
export const VIRTUAL_ROW_HEIGHT: Record<DataTableDensity, number> = {
  compact: 41,
  default: 49,
  comfortable: 61,
};

export const VIRTUAL_CELL_PADDING = 'py-0';
