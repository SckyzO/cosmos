import type { ColumnDef } from './types';

// CSV text of a table's rows (RFC 4180), kept apart from the component so it can be unit-tested.

// A spreadsheet runs a cell that starts with one of these as a formula.
const FORMULA_START = /^[=+\-@\t\r]/;

const quote = (text: string): string =>
  /["\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;

/** The header of a column: its `label` when plain text, else `mobileLabel`, else its `key`. */
const headerText = <T>(col: ColumnDef<T>): string => {
  if (typeof col.label === 'string' || typeof col.label === 'number') return String(col.label);
  if (typeof col.mobileLabel === 'string') return col.mobileLabel;
  return col.key;
};

/** The value of a cell: `exportValue`, else `sortValue`, `searchValue`, `filterValue`, else empty. */
const cellValue = <T>(col: ColumnDef<T>, row: T): string | number | null | undefined => {
  const read = col.exportValue ?? col.sortValue ?? col.searchValue ?? col.filterValue;
  return read ? read(row) : null;
};

const cellText = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  // A number cannot carry a formula, and `-5` has to stay a number.
  if (typeof value === 'number') return String(value);
  return quote(FORMULA_START.test(value) ? `'${value}` : value);
};

/**
 * The CSV text of `rows` in `columns`: a header row, then one record per row, every record ended
 * by CRLF. A field that holds `"`, `,`, CR or LF is quoted, with `"` doubled.
 *
 * The header of a column is its `label` when that is a string or a number, else its
 * `mobileLabel` when that is a string, else its `key`. A cell takes the column's `exportValue`,
 * else its `sortValue`, `searchValue` or `filterValue` (the first one it has); `null`,
 * `undefined` and a column with none of them give an empty cell. A string that starts with `=`,
 * `+`, `-`, `@`, a tab or a carriage return gets a `'` prefix, so a spreadsheet never runs it as
 * a formula; a `number` is left as it is.
 *
 * The text has no byte order mark: a file meant for spreadsheets should start with `"\uFEFF"`
 * (as `DataTable`'s export does) so that they read it as UTF-8.
 */
export const toCsv = <T>(rows: T[], columns: ColumnDef<T>[]): string => {
  const records = [
    columns.map((col) => quote(headerText(col))),
    ...rows.map((row) => columns.map((col) => cellText(cellValue(col, row)))),
  ];
  return records.map((record) => `${record.join(',')}\r\n`).join('');
};
