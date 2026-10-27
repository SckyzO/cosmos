import { clsx } from 'clsx';

// The columns `stickyFirstColumn` pins to the start of a DataTable: the selection column when
// there is one, and the first data column. A pinned body cell is opaque, so the cells that scroll
// under it do not show through, and it takes the row's hover and selected colors itself.

// A shadow in place of a border: a collapsed border stays behind when the cell is pinned.
const EDGE = '[box-shadow:inset_-1px_0_0_var(--color-border)]';

const SELECTED =
  'bg-[color-mix(in_srgb,var(--color-brand-50)_40%,var(--color-white))] dark:bg-[color-mix(in_srgb,var(--color-brand-500)_5%,var(--color-gray-900))]';

export const stickyBodyCell = (selected: boolean, edge: boolean) =>
  clsx(
    'sticky z-[1]',
    selected
      ? SELECTED
      : 'bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-800',
    edge && EDGE
  );

export const stickyHeadCell = (edge: boolean) => clsx('sticky z-[1]', edge && EDGE);
