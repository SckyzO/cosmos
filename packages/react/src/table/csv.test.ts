import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';
import type { ColumnDef } from './types';

type Row = Record<string, string | number | null>;

const col = (key: string, extra: Partial<ColumnDef<Row>> = {}): ColumnDef<Row> => ({
  key,
  label: key,
  render: () => null,
  exportValue: (r) => r[key] ?? null,
  ...extra,
});

describe('toCsv', () => {
  it('ends every record, the last included, with CRLF', () => {
    expect(toCsv([{ a: 'x' }, { a: 'y' }], [col('a')])).toBe('a\r\nx\r\ny\r\n');
  });

  it('gives only the header for no rows', () => {
    expect(toCsv([], [col('a'), col('b')])).toBe('a,b\r\n');
  });

  it.each([
    ['a"b', '"a""b"'],
    ['a,b', '"a,b"'],
    ['a\rb', '"a\rb"'],
    ['a\nb', '"a\nb"'],
    ['plain', 'plain'],
  ])('quotes %j as %j', (value, field) => {
    expect(toCsv([{ a: value }], [col('a')])).toBe(`a\r\n${field}\r\n`);
  });

  it.each([
    ['=1+1', "'=1+1"],
    ['+1', "'+1"],
    ['-1', "'-1"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['\tx', "'\tx"],
  ])('guards %j as %j', (value, field) => {
    expect(toCsv([{ a: value }], [col('a')])).toBe(`a\r\n${field}\r\n`);
  });

  it('guards a leading carriage return, then quotes it', () => {
    expect(toCsv([{ a: '\rx' }], [col('a')])).toBe(`a\r\n"'\rx"\r\n`);
  });

  it('quotes a guarded value that holds a comma', () => {
    expect(toCsv([{ a: '=A1,B1' }], [col('a')])).toBe(`a\r\n"'=A1,B1"\r\n`);
  });

  it('leaves a number alone, a negative one included', () => {
    expect(toCsv([{ a: -5 }, { a: 3.5 }], [col('a')])).toBe('a\r\n-5\r\n3.5\r\n');
  });

  it('writes null and undefined as an empty cell', () => {
    const cols = [col('a'), col('b', { exportValue: () => undefined as unknown as null })];
    expect(toCsv([{ a: null, b: 'x' }], cols)).toBe('a,b\r\n,\r\n');
  });

  it('writes an empty cell for a column with no value function', () => {
    const bare: ColumnDef<Row> = { key: 'a', label: 'A', render: () => null };
    expect(toCsv([{ a: 'x' }], [bare])).toBe('A\r\n\r\n');
  });

  describe('header', () => {
    const base = { render: () => null };
    it('takes a string label', () => {
      expect(toCsv([], [{ ...base, key: 'k', label: 'Name' }])).toBe('Name\r\n');
    });
    it('takes a number label', () => {
      expect(toCsv([], [{ ...base, key: 'k', label: 2026 }])).toBe('2026\r\n');
    });
    it('falls back to a string mobileLabel when the label is not text', () => {
      const label = { type: 'span' } as unknown as ColumnDef<Row>['label'];
      expect(toCsv([], [{ ...base, key: 'k', label, mobileLabel: 'Short' }])).toBe('Short\r\n');
    });
    it('falls back to the key', () => {
      const label = { type: 'span' } as unknown as ColumnDef<Row>['label'];
      expect(toCsv([], [{ ...base, key: 'k', label }])).toBe('k\r\n');
      expect(toCsv([], [{ ...base, key: 'k', label, mobileLabel: label }])).toBe('k\r\n');
    });
    it('quotes a header that holds a comma', () => {
      expect(toCsv([], [{ ...base, key: 'k', label: 'Size, MB' }])).toBe('"Size, MB"\r\n');
    });
  });

  describe('value fallback', () => {
    const row = { a: 'row' };
    const base = { key: 'k', label: 'K', render: () => null };
    const fns = {
      exportValue: () => 'export',
      sortValue: () => 'sort',
      searchValue: () => 'search',
      filterValue: () => 'filter',
    };
    it('prefers exportValue, then sortValue, searchValue, filterValue', () => {
      const out = (extra: Partial<ColumnDef<typeof row>>) => toCsv([row], [{ ...base, ...extra }]);
      expect(out(fns)).toBe('K\r\nexport\r\n');
      expect(out({ ...fns, exportValue: undefined })).toBe('K\r\nsort\r\n');
      expect(out({ ...fns, exportValue: undefined, sortValue: undefined })).toBe('K\r\nsearch\r\n');
      expect(
        out({ ...fns, exportValue: undefined, sortValue: undefined, searchValue: undefined })
      ).toBe('K\r\nfilter\r\n');
    });
    it('takes the first function it has, even when it returns null', () => {
      expect(toCsv([row], [{ ...base, sortValue: () => null, filterValue: () => 'f' }])).toBe(
        'K\r\n\r\n'
      );
    });
  });
});
