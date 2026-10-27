import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THRESHOLDS,
  averageUptime,
  beatName,
  beatsSummary,
  countBeats,
  dayName,
  daysLeftText,
  downtimeText,
  fitCount,
  formatDay,
  formatUptime,
  resolveThresholds,
  tail,
  thresholdLegend,
  uptimeLevel,
} from './uptime';
import type { Beat, UptimeDay } from './types';

describe('uptimeLevel', () => {
  it('colours by the default limits: 99.9 % and up, 99 % and up, below', () => {
    expect(uptimeLevel(1)).toBe('good');
    expect(uptimeLevel(0.999)).toBe('good');
    expect(uptimeLevel(0.9989)).toBe('warning');
    expect(uptimeLevel(0.99)).toBe('warning');
    expect(uptimeLevel(0.9899)).toBe('bad');
    expect(uptimeLevel(0)).toBe('bad');
  });

  it('has no level for a day with no data', () => {
    expect(uptimeLevel(null)).toBe('none');
    expect(uptimeLevel(undefined)).toBe('none');
    expect(uptimeLevel(Number.NaN)).toBe('none');
  });

  it('moves with an override, one limit at a time', () => {
    expect(uptimeLevel(0.995, { good: 0.99 })).toBe('good');
    expect(uptimeLevel(0.995, { warning: 0.999 })).toBe('bad');
    expect(uptimeLevel(0.96, { warning: 0.95 })).toBe('warning');
    expect(uptimeLevel(0.9995, { good: 0.9999, warning: 0.999 })).toBe('warning');
  });
});

describe('resolveThresholds', () => {
  it('gives the defaults when nothing is given', () => {
    expect(resolveThresholds()).toEqual(DEFAULT_THRESHOLDS);
    expect(resolveThresholds({})).toEqual(DEFAULT_THRESHOLDS);
  });

  it('keeps the limit the host did not give', () => {
    expect(resolveThresholds({ good: 0.995 })).toEqual({ good: 0.995, warning: 0.99 });
  });

  it('lowers a warning limit that sits above the good one', () => {
    expect(resolveThresholds({ good: 0.98 })).toEqual({ good: 0.98, warning: 0.98 });
  });
});

describe('thresholdLegend', () => {
  it('writes the default limits', () => {
    expect(thresholdLegend()).toEqual([
      { level: 'good', label: '99.9% and up' },
      { level: 'warning', label: '99% to 99.9%' },
      { level: 'bad', label: 'Below 99%' },
      { level: 'none', label: 'No data' },
    ]);
  });

  it('follows an override', () => {
    expect(thresholdLegend({ good: 0.9995, warning: 0.995 }).map((e) => e.label)).toEqual([
      '99.95% and up',
      '99.5% to 99.95%',
      'Below 99.5%',
      'No data',
    ]);
  });
});

describe('formatUptime', () => {
  it('trims the decimals that are zero', () => {
    expect(formatUptime(1)).toBe('100%');
    expect(formatUptime(0.99)).toBe('99%');
    expect(formatUptime(0.974)).toBe('97.4%');
    expect(formatUptime(0.9995)).toBe('99.95%');
    expect(formatUptime(0.9991)).toBe('99.91%');
    expect(formatUptime(0)).toBe('0%');
  });

  it('never rounds up to 100%', () => {
    expect(formatUptime(0.99999)).toBe('99.99%');
    expect(formatUptime(0.999999)).toBe('99.99%');
  });
});

describe('fitCount', () => {
  it('counts the marks that fit, a gap between each', () => {
    // 5 px bars, 3 px apart: 8 px a mark, the last one without its gap.
    expect(fitCount(100, 5, 3)).toBe(12);
    expect(fitCount(93, 5, 3)).toBe(12);
    expect(fitCount(92, 5, 3)).toBe(11);
  });

  it('holds exactly one mark in its own width', () => {
    expect(fitCount(5, 5, 3)).toBe(1);
    expect(fitCount(4, 5, 3)).toBe(0);
  });

  it('holds none in no width', () => {
    expect(fitCount(0, 5, 3)).toBe(0);
    expect(fitCount(-20, 5, 3)).toBe(0);
  });
});

describe('tail', () => {
  it('keeps the newest, the end of the list', () => {
    expect(tail([1, 2, 3, 4, 5], 2)).toEqual([4, 5]);
  });

  it('gives all of a list shorter than the count', () => {
    expect(tail([1, 2], 5)).toEqual([1, 2]);
    expect(tail([1, 2], Infinity)).toEqual([1, 2]);
  });

  it('gives none for a count of zero', () => {
    expect(tail([1, 2, 3], 0)).toEqual([]);
  });
});

const day = (uptime: number | null, extra: Partial<UptimeDay> = {}): UptimeDay => ({
  date: '2026-01-15',
  uptime,
  ...extra,
});

describe('averageUptime', () => {
  it('is the mean of the days with data', () => {
    expect(averageUptime([day(1), day(0.99), day(null)])).toBeCloseTo(0.995, 10);
  });

  it('is null when no day has data', () => {
    expect(averageUptime([day(null), day(null)])).toBeNull();
    expect(averageUptime([])).toBeNull();
  });
});

const beat = (status: Beat['status'], extra: Partial<Beat> = {}): Beat => ({
  time: Date.UTC(2026, 0, 15, 6, 42, 10),
  status,
  ...extra,
});

describe('beats', () => {
  it('counts each status', () => {
    expect(countBeats([beat('up'), beat('up'), beat('down'), beat('pending')])).toEqual({
      up: 2,
      down: 1,
      degraded: 0,
      maintenance: 0,
      pending: 1,
    });
  });

  it('sums them up in words, in the legend order', () => {
    expect(
      beatsSummary([beat('down'), beat('up'), beat('up'), beat('maintenance'), beat('degraded')])
    ).toBe('2 up, 1 degraded, 1 down, 1 maintenance');
    expect(beatsSummary([])).toBe('');
  });

  it('names a beat by its status first, then its latency and message', () => {
    const name = beatName(beat('down', { latency: 5003, message: 'Timeout after 5 s' }));
    expect(name.startsWith('Down, ')).toBe(true);
    expect(name.endsWith(', 5,003 ms, Timeout after 5 s')).toBe(true);
    expect(beatName(beat('up')).startsWith('Up, ')).toBe(true);
    expect(beatName(beat('up'))).not.toContain('ms');
  });

  it('survives a time that does not parse', () => {
    expect(beatName(beat('up', { time: 'soon' }))).toBe('Up, Unknown time');
  });
});

describe('days', () => {
  it('writes a bare date as that calendar day, in any time zone', () => {
    expect(formatDay('2026-01-15')).toBe('Jan 15, 2026');
    expect(formatDay('2026-12-31')).toBe('Dec 31, 2026');
  });

  it('names a day by its date, its uptime and its incidents', () => {
    expect(dayName(day(0.9995, { incidents: 1 }))).toBe('Jan 15, 2026: 99.95% uptime, 1 incident');
    expect(dayName(day(1))).toBe('Jan 15, 2026: 100% uptime, no incident');
    expect(dayName(day(0.97, { incidents: 3 }))).toBe('Jan 15, 2026: 97% uptime, 3 incidents');
    expect(dayName(day(null))).toBe('Jan 15, 2026: No data');
  });
});

describe('downtimeText', () => {
  const MONTH = 30 * 24 * 3_600_000;

  it('says the minutes a 30-day period lost', () => {
    expect(downtimeText(0.9991, MONTH)).toBe('39 min');
  });

  it('says hours, days and seconds', () => {
    expect(downtimeText(0.99, MONTH)).toBe('7 h 12 min');
    expect(downtimeText(0.9, MONTH)).toBe('3 d');
    expect(downtimeText(0.9, 29.99 * 24 * 3_600_000)).toBe('3 d');
    expect(downtimeText(0.9999, 24 * 3_600_000)).toBe('9 s');
  });

  it('says there was none for a perfect uptime', () => {
    expect(downtimeText(1, MONTH)).toBe('No downtime');
  });
});

describe('daysLeftText', () => {
  it('counts the days left of a certificate', () => {
    expect(daysLeftText(12)).toBe('12 days left');
    expect(daysLeftText(1)).toBe('1 day left');
    expect(daysLeftText(12.9)).toBe('12 days left');
    expect(daysLeftText(0.4)).toBe('Expires today');
    expect(daysLeftText(-2)).toBe('Expired');
  });
});
