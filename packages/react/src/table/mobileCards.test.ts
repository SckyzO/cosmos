import { describe, expect, it } from 'vitest';
import {
  columnText,
  mobileSortOptions,
  mobileSortValue,
  parseMobileSort,
  splitMobileColumns,
} from './mobileCards';
import type { ColumnDef } from './types';

const col = (key: string, extra: Partial<ColumnDef<unknown>> = {}): ColumnDef<unknown> => ({
  key,
  label: key.toUpperCase(),
  render: () => null,
  ...extra,
});
const keys = (cols: (ColumnDef<unknown> | undefined)[]) => cols.map((c) => c?.key);

describe('splitMobileColumns', () => {
  it('heads the card with the mobile: title column and pairs the others in order', () => {
    const { title, pairs } = splitMobileColumns([
      col('id'),
      col('name', { mobile: 'title' }),
      col('role'),
    ]);
    expect(title?.key).toBe('name');
    expect(keys(pairs)).toEqual(['id', 'role']);
  });

  it('falls back to the first column when none is the title', () => {
    const { title, pairs } = splitMobileColumns([col('a'), col('b')]);
    expect(title?.key).toBe('a');
    expect(keys(pairs)).toEqual(['b']);
  });

  it('leaves mobile: hidden columns out, and never makes one the fallback title', () => {
    const { title, pairs } = splitMobileColumns([
      col('a', { mobile: 'hidden' }),
      col('b'),
      col('c', { mobile: 'hidden' }),
      col('d'),
    ]);
    expect(title?.key).toBe('b');
    expect(keys(pairs)).toEqual(['d']);
  });

  it('has no title for no column', () => {
    expect(splitMobileColumns([])).toEqual({ title: undefined, pairs: [] });
  });
});

describe('sort options', () => {
  it('lists both directions of the sortable columns, after the default order', () => {
    const options = mobileSortOptions([
      col('name', { sortable: true, label: 'Name' }),
      col('email'),
      col('age', { sortable: true, mobileLabel: 'Years' }),
    ]);
    expect(options).toEqual([
      { value: '', label: 'Default order' },
      { value: 'name:asc', label: 'Name, ascending' },
      { value: 'name:desc', label: 'Name, descending' },
      { value: 'age:asc', label: 'Years, ascending' },
      { value: 'age:desc', label: 'Years, descending' },
    ]);
  });

  it('falls back to the key when the label is not text', () => {
    expect(columnText(col('x', { label: { type: 'span' } as never }))).toBe('x');
  });

  it('round-trips a sort value, keys with a colon included', () => {
    expect(parseMobileSort(mobileSortValue(null, 'asc'))).toEqual({ key: null, dir: 'asc' });
    expect(parseMobileSort(mobileSortValue('name', 'desc'))).toEqual({ key: 'name', dir: 'desc' });
    expect(parseMobileSort(mobileSortValue('a:b', 'asc'))).toEqual({ key: 'a:b', dir: 'asc' });
  });
});
