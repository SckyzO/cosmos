import { describe, expect, it } from 'vitest';
import { firstLetterDirection } from './blockDirection';

describe('firstLetterDirection', () => {
  it('reads the first letter, past digits, spaces and punctuation', () => {
    expect(firstLetterDirection('Rolling restarts')).toBe('ltr');
    expect(firstLetterDirection('12 — مرحبا')).toBe('rtl');
    expect(firstLetterDirection('«שלום» and more')).toBe('rtl');
    expect(firstLetterDirection('2 دقائق, then Latin')).toBe('rtl');
    expect(firstLetterDirection('99% Ελληνικά')).toBe('ltr');
  });

  it('has no direction for a text without a letter', () => {
    expect(firstLetterDirection('')).toBeUndefined();
    expect(firstLetterDirection('12:30 — 4%')).toBeUndefined();
  });
});
