import { describe, expect, it } from 'vitest';
import { conversionRate, formatRate } from './pipeline-stages';

describe('conversionRate', () => {
  it('is the current count over the previous one, in percent', () => {
    expect(conversionRate(200, 50)).toBe(25);
    expect(conversionRate(248, 136)).toBeCloseTo(54.8387, 3);
  });

  it('is 0 when nothing made it to the next stage', () => {
    expect(conversionRate(100, 0)).toBe(0);
  });

  it('goes over 100 when a stage is larger than the one before it', () => {
    expect(conversionRate(16, 18)).toBe(112.5);
  });

  it('has no rate when the previous stage is at 0, instead of dividing by it', () => {
    expect(conversionRate(0, 0)).toBeNull();
    expect(conversionRate(0, 12)).toBeNull();
  });

  it('has no rate when the previous stage is negative', () => {
    expect(conversionRate(-4, 2)).toBeNull();
  });

  it('has no rate for a count that is negative', () => {
    expect(conversionRate(10, -1)).toBeNull();
  });

  it('has no rate for a count that is not a finite number', () => {
    expect(conversionRate(Number.NaN, 5)).toBeNull();
    expect(conversionRate(5, Number.NaN)).toBeNull();
    expect(conversionRate(Number.POSITIVE_INFINITY, 5)).toBeNull();
    expect(conversionRate(5, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('formatRate', () => {
  it('writes one decimal and a percent sign', () => {
    expect(formatRate(54.838)).toBe('54.8%');
    expect(formatRate(25)).toBe('25.0%');
    expect(formatRate(0)).toBe('0.0%');
  });

  it('rounds the decimal', () => {
    expect(formatRate(54.86)).toBe('54.9%');
  });

  it('writes a rate over 100', () => {
    expect(formatRate(112.5)).toBe('112.5%');
  });
});
