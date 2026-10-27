import type { ColumnDef } from './types';

// The pure part of DataTable's inline editing. Internal: not re-exported.

/** The edited cells of a row whose draft differs from where it started: column key → draft. */
export const rowChanges = (
  initials: Record<string, string>,
  drafts: Record<string, string>
): Record<string, string> => {
  const changes: Record<string, string> = {};
  for (const [key, draft] of Object.entries(drafts)) {
    if (draft !== initials[key]) changes[key] = draft;
  }
  return changes;
};

/** The draft each editable column starts from, for a row about to be edited. */
export const rowInitials = <T>(columns: ColumnDef<T>[], row: T): Record<string, string> => {
  const initials: Record<string, string> = {};
  for (const col of columns) {
    if (col.edit) initials[col.key] = col.edit.initialValue(row);
  }
  return initials;
};

/** The text of a rejected save: the `Error`'s message, a string as it is, else a plain line. */
export const saveErrorMessage = (reason: unknown): string => {
  if (reason instanceof Error && reason.message) return reason.message;
  if (typeof reason === 'string' && reason) return reason;
  return 'Not saved';
};

/** Whether what `onCellEdit` / `onRowEdit` returned is a promise to wait for. */
export const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { then?: unknown }).then === 'function';

/** The key a trigger is registered under, to give it the focus back. */
export const triggerId = (rowKey: string | number, column: string): string =>
  `${String(rowKey)}\u0000${column}`;
