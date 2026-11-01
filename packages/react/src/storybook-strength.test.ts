import { describe, expect, it } from 'vitest';
import { estimateStrength } from './storybook-strength';

describe('estimateStrength', () => {
  it('scores a password under 8 useful characters 0, whatever it holds', () => {
    expect(estimateStrength('')).toBe(0);
    expect(estimateStrength('Ab1!')).toBe(0);
    expect(estimateStrength('Ab1!xyz')).toBe(0);
  });

  it('counts at most two characters per distinct one', () => {
    // 12 characters, one distinct: 2 useful.
    expect(estimateStrength('aaaaaaaaaaaa')).toBe(0);
    // 22 characters, two distinct: 4 useful.
    expect(estimateStrength('ab'.repeat(11))).toBe(0);
    // 8 characters, 4 distinct: 8 useful, so it is not held back.
    expect(estimateStrength('abcdabcd')).toBe(0);
    expect(estimateStrength('Abcdabc1')).toBe(2);
  });

  it('steps up at 8, 12, 16 and 20 useful characters', () => {
    // Two character classes: no adjustment.
    const two = (length: number) => 'abcdefghijklmnopqrstuvwxyz'.slice(0, length - 1) + '1';
    expect(estimateStrength(two(8))).toBe(1);
    expect(estimateStrength(two(11))).toBe(1);
    expect(estimateStrength(two(12))).toBe(2);
    expect(estimateStrength(two(15))).toBe(2);
    expect(estimateStrength(two(16))).toBe(3);
    expect(estimateStrength(two(19))).toBe(3);
    expect(estimateStrength(two(20))).toBe(4);
    expect(estimateStrength(two(26))).toBe(4);
  });

  it('adds one for three or four classes and takes one off for a single class', () => {
    expect(estimateStrength('abcdefg1')).toBe(1);
    expect(estimateStrength('Abcdefg1')).toBe(2);
    expect(estimateStrength('Abcdefg1!xyz')).toBe(3);
    expect(estimateStrength('abcdefgh')).toBe(0);
    expect(estimateStrength('correcthorsebatterystaple')).toBe(3);
  });

  it('stays between 0 and 4', () => {
    expect(estimateStrength('Tr0ub4dor&3-xylophone-Quartz')).toBe(4);
    expect(estimateStrength('Correct-Horse-9')).toBe(3);
  });
});
