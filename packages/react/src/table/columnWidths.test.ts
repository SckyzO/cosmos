import { describe, expect, it } from 'vitest';
import { DEFAULT_COLUMN_MIN_WIDTH, tableMinWidth } from './columnWidths';

const min = DEFAULT_COLUMN_MIN_WIDTH;

describe('tableMinWidth', () => {
  it('adds up the lengths of columns that all state one', () => {
    expect(tableMinWidth([{ width: '160px' }, { width: '10rem' }], [])).toBe('calc(160px + 10rem)');
  });

  it('gives each column without a width the default minimum, shared out equally', () => {
    expect(tableMinWidth([{}, {}, { width: '120px' }], ['44px'])).toBe(
      `calc(44px + 120px + 2 * ${min})`
    );
  });

  it('makes room for the widest minimum of the columns that share what is left', () => {
    expect(tableMinWidth([{ minWidth: '14rem' }, {}], [])).toBe(`calc(2 * max(14rem, ${min}))`);
  });

  it('sizes the table so that each percentage reaches its minimum', () => {
    expect(tableMinWidth([{ width: '20%' }, { width: '12%', minWidth: '6rem' }], [])).toBe(
      `max(calc(${min} / 0.2), calc(6rem / 0.12))`
    );
  });

  it('leaves the columns beside percentages their minimum of what the percentages leave', () => {
    expect(tableMinWidth([{ width: '50%' }, {}], ['96px'])).toBe(
      `max(calc(${min} / 0.5), calc((96px + 1 * ${min}) / 0.5))`
    );
  });

  it('keeps the stated width of the column that takes the rest as its minimum', () => {
    expect(tableMinWidth([{ width: '240px' }, { width: '100px' }], ['44px'], 0)).toBe(
      'calc(44px + 100px + 1 * 240px)'
    );
  });

  it('gives up on the rest when percentages take the whole table', () => {
    expect(tableMinWidth([{ width: '50%' }, { width: '50%' }, {}], [])).toBe(`calc(${min} / 0.5)`);
  });

  it('has nothing to say without columns', () => {
    expect(tableMinWidth([], ['44px'])).toBeUndefined();
  });
});
