// The pure part of DataTable's expandable rows. Internal: not re-exported.

/**
 * The id of a row's detail row, which the toggle's `aria-controls` names. Built from the table's
 * own id and the row key, with every character an id list cannot hold (a space splits it) written
 * as `_` and its hex code, `_` itself included, so two keys never share an id.
 */
export const detailRowId = (base: string, key: string | number): string =>
  `${base}-detail-${String(key).replace(/[^A-Za-z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(16)}_`)}`;

/** A copy of `expanded` with `key` added when it was not there, removed when it was. */
export const toggleKey = (
  expanded: Set<string | number>,
  key: string | number
): Set<string | number> => {
  const next = new Set(expanded);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
};
