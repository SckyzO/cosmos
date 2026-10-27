import { describe, expect, it } from 'vitest';
import { markInk, normalizeHex, SWATCH_INK } from './colorHex';

describe('normalizeHex', () => {
  it.each([
    ['#14b8a6', '#14b8a6'],
    ['14b8a6', '#14b8a6'],
    ['#14B8A6', '#14b8a6'],
    ['  #14b8a6  ', '#14b8a6'],
    ['#abc', '#aabbcc'],
    ['ABC', '#aabbcc'],
    ['#000', '#000000'],
  ])('accepts %j as %s', (input, expected) => {
    expect(normalizeHex(input)).toBe(expected);
  });

  it.each([
    '',
    '#',
    '#12g4',
    '#ab',
    '#abcd',
    '#abcde',
    '#abcdef0',
    '#aabbccdd',
    '##abc',
    '# abc',
    'teal',
    'rgb(0,0,0)',
  ])('rejects %j', (input) => {
    expect(normalizeHex(input)).toBeNull();
  });
});

describe('markInk', () => {
  it('is white on a dark or saturated swatch', () => {
    expect(markInk('#000000')).toBe(SWATCH_INK.light);
    expect(markInk('#1d4ed8')).toBe(SWATCH_INK.light);
    expect(markInk('#8b5cf6')).toBe(SWATCH_INK.light);
  });

  it('is dark on a pale swatch', () => {
    expect(markInk('#ffffff')).toBe(SWATCH_INK.dark);
    expect(markInk('#fde68a')).toBe(SWATCH_INK.dark);
    expect(markInk('#f59e0b')).toBe(SWATCH_INK.dark);
  });
});
