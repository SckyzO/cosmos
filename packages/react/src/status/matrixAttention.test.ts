import { describe, expect, it } from 'vitest';
import { rowsNeedingAttention } from './matrixAttention';

const row = (
  id: string,
  ...statuses: Array<'OK' | 'WARN' | 'CRIT' | 'UNKNOWN' | 'INFO' | null>
) => ({
  id,
  cells: Object.fromEntries(
    statuses.map((status, i) => [`c${i}`, status ? { status } : undefined])
  ),
});

describe('rowsNeedingAttention', () => {
  it('keeps only the rows holding a warning or a critical cell', () => {
    const found = rowsNeedingAttention([
      row('a', 'OK', 'OK'),
      row('b', 'OK', 'WARN'),
      row('c', 'UNKNOWN', 'INFO', null),
      row('d', 'CRIT'),
    ]);
    expect(found.map((entry) => entry.index)).toEqual([3, 1]);
  });

  it('counts the critical and the warning cells of each row', () => {
    const [found] = rowsNeedingAttention([row('a', 'CRIT', 'WARN', 'CRIT', 'OK', null)]);
    expect(found).toMatchObject({ crit: 2, warn: 1 });
  });

  it('puts the worst row first: more critical cells, then more warnings', () => {
    const found = rowsNeedingAttention([
      row('warn-3', 'WARN', 'WARN', 'WARN'),
      row('crit-1', 'CRIT'),
      row('warn-1', 'WARN'),
      row('crit-2', 'CRIT', 'CRIT'),
      row('crit-1-warn-1', 'CRIT', 'WARN'),
    ]);
    expect(found.map((entry) => entry.index)).toEqual([3, 4, 1, 0, 2]);
  });

  it('keeps the given order between equal rows', () => {
    const found = rowsNeedingAttention([row('x', 'WARN'), row('y', 'WARN'), row('z', 'WARN')]);
    expect(found.map((entry) => entry.index)).toEqual([0, 1, 2]);
  });

  it('finds nothing in a matrix with no problem', () => {
    expect(rowsNeedingAttention([row('a', 'OK'), row('b', null)])).toEqual([]);
    expect(rowsNeedingAttention([])).toEqual([]);
  });
});
