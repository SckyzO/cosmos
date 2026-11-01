import { describe, expect, it } from 'vitest';
import { formatCountdown, secondsLeft } from './useCooldown';

describe('secondsLeft', () => {
  it('rounds up, so the last fraction of a second still reads 1', () => {
    expect(secondsLeft(30_000, 0)).toBe(30);
    expect(secondsLeft(30_000, 1)).toBe(30);
    expect(secondsLeft(30_000, 999)).toBe(30);
    expect(secondsLeft(30_000, 1000)).toBe(29);
    expect(secondsLeft(30_000, 29_001)).toBe(1);
  });

  it('is 0 at the deadline and after it, never negative', () => {
    expect(secondsLeft(30_000, 30_000)).toBe(0);
    expect(secondsLeft(30_000, 45_000)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('writes minutes and two-digit seconds', () => {
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(9)).toBe('0:09');
    expect(formatCountdown(30)).toBe('0:30');
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(125)).toBe('2:05');
  });
});
