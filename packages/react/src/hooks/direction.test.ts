import { describe, expect, it } from 'vitest';
import { directionOf } from './direction';

// A stand-in element: `directionOf` only hands it to the reader.
const element = {} as Element;

describe('directionOf', () => {
  it('is rtl when the computed direction is rtl', () => {
    expect(directionOf(element, () => ({ direction: 'rtl' }))).toBe('rtl');
  });

  it('is ltr for ltr, and for anything else', () => {
    expect(directionOf(element, () => ({ direction: 'ltr' }))).toBe('ltr');
    expect(directionOf(element, () => ({ direction: '' }))).toBe('ltr');
  });

  it('is ltr without an element, and never reads', () => {
    const read = () => {
      throw new Error('no element to read');
    };
    expect(directionOf(null, read)).toBe('ltr');
    expect(directionOf(undefined, read)).toBe('ltr');
  });
});
