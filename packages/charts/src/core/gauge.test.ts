import { describe, expect, it } from 'vitest';
import { STATUS_CRIT, STATUS_WARN, SUCCESS } from './colors';
import { clampTo, gaugeName, percent, statusColor } from './gauge';

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
