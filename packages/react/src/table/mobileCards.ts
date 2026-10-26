import type { ReactNode } from 'react';
import type { ColumnDef, SortDirection } from './types';

// The pure part of DataTable's `mobileLayout="cards"`: which column heads a card, which ones
// become label/value pairs, and the "Sort by" options. Internal: not re-exported.

/**
 * Splits the shown columns for a card. The title is the column marked `mobile: 'title'` (the
 * first of them), else the first column; `mobile: 'hidden'` columns are left out; the rest are
 * the pairs, in column order.
 */
export const splitMobileColumns = <T>(
  columns: ColumnDef<T>[]
): { title: ColumnDef<T> | undefined; pairs: ColumnDef<T>[] } => {
  const title =
    columns.find((c) => c.mobile === 'title') ?? columns.find((c) => c.mobile !== 'hidden');
  const pairs = columns.filter((c) => c !== title && c.mobile !== 'hidden');
  return { title, pairs };
};

/** The label of a pair: `mobileLabel`, else the column's own header. */
export const mobileLabelOf = <T>(col: ColumnDef<T>): ReactNode => col.mobileLabel ?? col.label;

/** The plain text of a column for the "Sort by" options, which cannot hold elements. */
export const columnText = <T>(col: ColumnDef<T>): string => {
  const label = col.mobileLabel ?? col.label;
  return typeof label === 'string' || typeof label === 'number' ? String(label) : col.key;
};

export type MobileSortOption = { value: string; label: string };

/** The value of the "Sort by" select for the table's sort: `''` when it is not sorted. */
export const mobileSortValue = (key: string | null, dir: SortDirection): string =>
  key === null ? '' : `${key}:${dir}`;

/** The inverse of `mobileSortValue`. Keys may contain `:`, the direction is what follows the last. */
export const parseMobileSort = (value: string): { key: string | null; dir: SortDirection } => {
  if (value === '') return { key: null, dir: 'asc' };
  const at = value.lastIndexOf(':');
  return { key: value.slice(0, at), dir: value.slice(at + 1) === 'desc' ? 'desc' : 'asc' };
};

/** "Default order", then both directions of every sortable shown column. */
export const mobileSortOptions = <T>(columns: ColumnDef<T>[]): MobileSortOption[] => [
  { value: '', label: 'Default order' },
  ...columns
    .filter((c) => c.sortable)
    .flatMap((c) => [
      { value: mobileSortValue(c.key, 'asc'), label: `${columnText(c)}, ascending` },
      { value: mobileSortValue(c.key, 'desc'), label: `${columnText(c)}, descending` },
    ]),
];
