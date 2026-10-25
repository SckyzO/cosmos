import { describe, expect, it } from 'vitest';
import { AXIS_LABEL_PX, CHART_TEXT_PX, parseTextScale, scaledPx } from './textSize';

describe('parseTextScale', () => {
  it.each([
    ['0.9375', 0.9375],
    ['1.125', 1.125],
    [' 1.25 ', 1.25],
    ['1', 1],
  ])('reads %j as %d', (raw, scale) => {
    expect(parseTextScale(raw)).toBe(scale);
  });

  it.each(['', 'normal', 'calc(1 + 1)', '0', '-1', 'NaN', 'Infinity'])(
    'falls back to the normal size for %j',
    (raw) => {
      expect(parseTextScale(raw)).toBe(1);
    }
  );
});

describe('scaledPx', () => {
  it('is the size itself at the normal scale', () => {
    expect(scaledPx(AXIS_LABEL_PX, 1)).toBe('11px');
    expect(scaledPx(CHART_TEXT_PX, 1)).toBe('12px');
  });

  it('follows the text size setting', () => {
    expect(scaledPx(CHART_TEXT_PX, 1.125)).toBe('13.5px');
    expect(scaledPx(CHART_TEXT_PX, 1.25)).toBe('15px');
    expect(scaledPx(AXIS_LABEL_PX, 0.9375)).toBe('10.31px');
  });

  it('drops the float noise', () => {
    expect(scaledPx(11, 1.125)).toBe('12.38px');
    expect(scaledPx(0.1 * 3, 1)).toBe('0.3px');
  });
});
