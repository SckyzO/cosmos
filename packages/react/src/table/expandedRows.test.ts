import { describe, expect, it } from 'vitest';
import { detailRowId, toggleKey } from './expandedRows';

describe('detailRowId', () => {
  it('joins the table id and the key', () => {
    expect(detailRowId(':r1:', 'node-a01')).toBe(':r1:-detail-node-a01');
  });

  it('writes the characters an id list cannot hold as their hex code', () => {
    expect(detailRowId('t', 'a b')).toBe('t-detail-a_20_b');
    expect(detailRowId('t', 'x/y')).toBe('t-detail-x_2f_y');
  });

  it('keeps two different keys apart, an underscore included', () => {
    expect(detailRowId('t', 'a b')).not.toBe(detailRowId('t', 'a_20_b'));
  });

  it('takes a number key', () => {
    expect(detailRowId('t', 7)).toBe('t-detail-7');
  });
});

describe('toggleKey', () => {
  it('adds a key that was not there, without touching the original set', () => {
    const before = new Set<string | number>(['a']);
    const after = toggleKey(before, 'b');
    expect([...after]).toEqual(['a', 'b']);
    expect([...before]).toEqual(['a']);
  });

  it('removes a key that was there', () => {
    expect([...toggleKey(new Set<string | number>(['a', 'b']), 'a')]).toEqual(['b']);
  });
});
