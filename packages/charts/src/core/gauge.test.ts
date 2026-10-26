import { describe, expect, it } from 'vitest';
import { STATUS_CRIT, STATUS_WARN, SUCCESS } from './colors';
import { arcMark, clampTo, gaugeName, percent, rangeShare, statusColor } from './gauge';

describe('percent', () => {
  it('appends a percent sign to the value', () => {
    expect(percent(0)).toBe('0%');
    expect(percent(99.5)).toBe('99.5%');
    expect(percent(-3)).toBe('-3%');
  });
});

describe('clampTo', () => {
  it('keeps a value in the range and stops one outside at its end', () => {
    expect(clampTo(50, 0, 100)).toBe(50);
    expect(clampTo(2600, 0, 2000)).toBe(2000);
    expect(clampTo(120, 500, 2000)).toBe(500);
  });
});

describe('gaugeName', () => {
  it('ends the name with the formatted value', () => {
    expect(gaugeName('Cluster load', '67%')).toBe('Cluster load: 67%');
  });
});

describe('statusColor', () => {
  it('is success below the warning threshold', () => {
    expect(statusColor(69.9, 70, 90)).toBe(SUCCESS);
  });

  it('turns to warning at warnAt and to critical at critAt', () => {
    expect(statusColor(70, 70, 90)).toBe(STATUS_WARN);
    expect(statusColor(89.9, 70, 90)).toBe(STATUS_WARN);
    expect(statusColor(90, 70, 90)).toBe(STATUS_CRIT);
  });

  it('reaches only the thresholds that are set', () => {
    expect(statusColor(99, undefined, 90)).toBe(STATUS_CRIT);
    expect(statusColor(80, undefined, 90)).toBe(SUCCESS);
    expect(statusColor(99, 70, undefined)).toBe(STATUS_WARN);
  });
});

describe('rangeShare', () => {
  it('is the place of the value in the range', () => {
    expect(rangeShare(50, 0, 100)).toBe(0.5);
    expect(rangeShare(1450, 0, 2000)).toBe(0.725);
    expect(rangeShare(27, 10, 45)).toBeCloseTo(17 / 35);
  });

  it('stops a value outside the range at an end', () => {
    expect(rangeShare(2600, 0, 2000)).toBe(1);
    expect(rangeShare(120, 500, 2000)).toBe(0);
  });
});

describe('arcMark', () => {
  const center = { cx: 100, cy: 100 };
  const across = { inner: 60, outer: 80 };

  it('lies along the left of the center at the start of the arc', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 0);
    expect([x1, y1, x2, y2].map(Math.round)).toEqual([40, 100, 20, 100]);
  });

  it('stands straight above the center halfway', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 0.5);
    expect([x1, y1, x2, y2].map(Math.round)).toEqual([100, 40, 100, 20]);
  });

  it('lies along the right of the center at the end of the arc', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 1);
    expect([x1, y1, x2, y2].map(Math.round)).toEqual([160, 100, 180, 100]);
  });

  it('turns clockwise from the left end: 80% is 36 degrees above the right end', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 0.8);
    const degrees = (Math.atan2(y1 - y2, x2 - x1) * 180) / Math.PI;
    expect(degrees).toBeCloseTo(36);
  });
});
