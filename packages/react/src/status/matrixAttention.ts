import type { HealthStatus } from './types';

/** A row of a `HealthMatrix` as far as the attention strip reads it. */
type AttentionRow = { cells: Record<string, { status: HealthStatus } | undefined> };

export type RowAttention<Row extends AttentionRow> = {
  row: Row;
  /** Position of the row in the list that was given. */
  index: number;
  crit: number;
  warn: number;
};

/**
 * The rows holding a critical or a warning cell, worst first: more critical cells, then more
 * warnings, and the given order between equal rows. Unknown and info cells do not count.
 */
export const rowsNeedingAttention = <Row extends AttentionRow>(
  rows: readonly Row[]
): RowAttention<Row>[] => {
  const found: RowAttention<Row>[] = [];
  rows.forEach((row, index) => {
    let crit = 0;
    let warn = 0;
    for (const cell of Object.values(row.cells)) {
      if (cell?.status === 'CRIT') crit += 1;
      else if (cell?.status === 'WARN') warn += 1;
    }
    if (crit + warn > 0) found.push({ row, index, crit, warn });
  });
  return found.sort((a, b) => b.crit - a.crit || b.warn - a.warn || a.index - b.index);
};
