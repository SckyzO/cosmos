import { describe, expect, it } from 'vitest';
import {
  clockTick,
  countdownParts,
  formatClockDate,
  formatClockTime,
  formatCountdownCompact,
  formatCountdownInline,
  formatDateTime,
  formatRelative,
  nextClockDelay,
  nextCountdownDelay,
  nextRelativeDelay,
  relativeUnit,
  remainingSeconds,
  toTimestamp,
} from './time';

// Newer ICU writes a narrow no-break space before AM/PM, older a plain one.
const plain = (s: string) => s.replace(/\s/g, ' ');

// Thursday 15 January 2026, 14:05:09 UTC.
const AT = Date.UTC(2026, 0, 15, 14, 5, 9);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('toTimestamp', () => {
  it('reads a Date, a number and an ISO string alike', () => {
    expect(toTimestamp(new Date(AT))).toBe(AT);
    expect(toTimestamp(AT)).toBe(AT);
    expect(toTimestamp('2026-01-15T14:05:09Z')).toBe(AT);
  });

  it('is NaN for a string that is no date', () => {
    expect(toTimestamp('soon')).toBeNaN();
  });
});

describe('formatDateTime', () => {
  it('writes the presets in English', () => {
    expect(formatDateTime(AT, 'date', 'en-US', 'UTC')).toBe('Jan 15, 2026');
    expect(plain(formatDateTime(AT, 'time', 'en-US', 'UTC'))).toBe('2:05 PM');
    expect(plain(formatDateTime(AT, 'datetime', 'en-US', 'UTC'))).toBe('Jan 15, 2026, 2:05 PM');
    expect(plain(formatDateTime(AT, 'long', 'en-US', 'UTC'))).toBe(
      'January 15, 2026 at 2:05:09 PM'
    );
    expect(plain(formatDateTime(AT, 'full', 'en-US', 'UTC'))).toBe(
      'Thursday, January 15, 2026 at 2:05:09 PM UTC'
    );
  });

  it('writes the presets in French', () => {
    expect(formatDateTime(AT, 'date', 'fr-FR', 'UTC')).toBe('15 janv. 2026');
    expect(formatDateTime(AT, 'time', 'fr-FR', 'UTC')).toBe('14:05');
    expect(plain(formatDateTime(AT, 'long', 'fr-FR', 'UTC'))).toBe('15 janvier 2026 à 14:05:09');
  });

  it('moves the wall clock with the zone', () => {
    expect(formatDateTime(AT, 'time', 'fr-FR', 'Asia/Tokyo')).toBe('23:05');
    expect(formatDateTime(AT, 'time', 'fr-FR', 'America/New_York')).toBe('09:05');
  });

  it('takes Intl options in place of a preset', () => {
    expect(formatDateTime(AT, { weekday: 'long' }, 'fr-FR', 'UTC')).toBe('jeudi');
  });

  it('lets the zone prop win over a zone in the options', () => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'UTC',
    } as const;
    expect(formatDateTime(AT, options, 'en-GB', 'Asia/Tokyo')).toBe('23:05');
    expect(formatDateTime(AT, options, 'en-GB')).toBe('14:05');
  });
});

describe('relativeUnit', () => {
  it('counts whole units, truncated', () => {
    expect(relativeUnit(-(59 * MIN + 59_999))).toEqual({ value: -59, unit: 'minute' });
    expect(relativeUnit(-HOUR)).toEqual({ value: -1, unit: 'hour' });
    expect(relativeUnit(2 * DAY + HOUR)).toEqual({ value: 2, unit: 'day' });
  });

  it('moves up a unit at each limit', () => {
    expect(relativeUnit(-59_999).unit).toBe('second');
    expect(relativeUnit(-MIN).unit).toBe('minute');
    expect(relativeUnit(-(DAY - 1)).unit).toBe('hour');
    expect(relativeUnit(-DAY).unit).toBe('day');
    expect(relativeUnit(-7 * DAY).unit).toBe('week');
    expect(relativeUnit(-30 * DAY).unit).toBe('month');
    expect(relativeUnit(-365 * DAY)).toEqual({ value: -1, unit: 'year' });
  });

  it('is never negative zero', () => {
    expect(Object.is(relativeUnit(-500).value, 0)).toBe(true);
  });
});

describe('formatRelative', () => {
  it('moves from "now" to "1 minute ago" as time passes', () => {
    const target = AT;
    expect(formatRelative(target - AT, 'en')).toBe('now');
    expect(formatRelative(target - (AT + 30_000), 'en')).toBe('30 seconds ago');
    expect(formatRelative(target - (AT + MIN), 'en')).toBe('1 minute ago');
    expect(formatRelative(target - (AT + 5 * MIN), 'en')).toBe('5 minutes ago');
  });

  it('says yesterday, tomorrow and "in" for the future', () => {
    expect(formatRelative(-DAY, 'en')).toBe('yesterday');
    expect(formatRelative(DAY, 'en')).toBe('tomorrow');
    expect(formatRelative(2 * DAY + HOUR, 'en')).toBe('in 2 days');
    expect(formatRelative(3 * HOUR, 'en')).toBe('in 3 hours');
  });

  it('writes French', () => {
    expect(formatRelative(0, 'fr')).toBe('maintenant');
    expect(formatRelative(-MIN, 'fr')).toBe('il y a 1 minute');
    expect(formatRelative(-DAY, 'fr')).toBe('hier');
    expect(formatRelative(3 * DAY, 'fr')).toBe('dans 3 jours');
  });
});

describe('nextRelativeDelay', () => {
  const diffs = [
    0,
    1,
    400,
    999,
    1000,
    1500,
    30_000,
    59_999,
    MIN,
    MIN + 1,
    90_000,
    59 * MIN,
    HOUR,
    5 * HOUR,
    23 * HOUR + 59 * MIN,
    DAY,
    2 * DAY + 5,
    6 * DAY,
    7 * DAY,
    20 * DAY,
    28 * DAY,
    29 * DAY,
    30 * DAY,
    100 * DAY,
    359 * DAY,
    360 * DAY,
    364 * DAY,
    365 * DAY,
    800 * DAY,
  ];

  // The text holds up to the last millisecond before the delay, then changes at it, for the past
  // and the future alike.
  for (const sign of [-1, 1]) {
    for (const abs of diffs) {
      const diff = sign * abs;
      it(`changes the text exactly at the delay (${diff} ms)`, () => {
        const delay = nextRelativeDelay(diff);
        expect(delay).toBeGreaterThan(0);
        const text = formatRelative(diff, 'en');
        expect(formatRelative(diff - (delay - 1), 'en')).toBe(text);
        expect(formatRelative(diff - delay, 'en')).not.toBe(text);
      });
    }
  }

  it('waits a second in the first minute, a minute in the first hour, a day beyond', () => {
    expect(nextRelativeDelay(-10_500)).toBe(500);
    expect(nextRelativeDelay(-(5 * MIN + 10_000))).toBe(50_000);
    expect(nextRelativeDelay(-(3 * DAY + HOUR))).toBe(DAY - HOUR);
  });
});

describe('clock', () => {
  it('writes the time in a zone, 24-hour or 12-hour', () => {
    const base = { locale: 'en-US', timeZone: 'UTC' };
    expect(plain(formatClockTime(AT, base))).toBe('02:05:09 PM');
    expect(formatClockTime(AT, { ...base, hour12: false })).toBe('14:05:09');
    expect(formatClockTime(AT, { ...base, hour12: false, showSeconds: false })).toBe('14:05');
    expect(formatClockTime(AT, { locale: 'fr-FR', timeZone: 'Asia/Tokyo' })).toBe('23:05:09');
  });

  it('writes the date in two lengths', () => {
    expect(formatClockDate(AT, 'full', 'en-US', 'UTC')).toBe('Thursday, January 15, 2026');
    expect(formatClockDate(AT, 'medium', 'fr-FR', 'UTC')).toBe('15 janv. 2026');
    // Tokyo is already on the 16th.
    expect(formatClockDate(Date.UTC(2026, 0, 15, 20), 'medium', 'en-US', 'Asia/Tokyo')).toBe(
      'Jan 16, 2026'
    );
  });

  it('ticks on the second, or on the minute without seconds', () => {
    expect(clockTick(AT + 750, true)).toBe(AT);
    expect(clockTick(AT + 750, false)).toBe(AT - 9000);
  });

  it('waits for the next boundary, not a whole period', () => {
    expect(nextClockDelay(AT + 250, true)).toBe(750);
    expect(nextClockDelay(AT, true)).toBe(1000);
    expect(nextClockDelay(AT, false)).toBe(51_000);
    expect(nextClockDelay(AT - (AT % MIN), false)).toBe(MIN);
  });
});

describe('countdown', () => {
  it('rounds the remaining seconds up and stops at zero', () => {
    expect(remainingSeconds(10_000, 0)).toBe(10);
    expect(remainingSeconds(10_000, 500)).toBe(10);
    expect(remainingSeconds(10_000, 9_001)).toBe(1);
    expect(remainingSeconds(10_000, 10_000)).toBe(0);
    expect(remainingSeconds(10_000, 20_000)).toBe(0);
  });

  it('waits until the displayed second drops', () => {
    expect(nextCountdownDelay(10_000, 0)).toBe(1000);
    expect(nextCountdownDelay(10_000, 250)).toBe(750);
    // One second left lasts until the target; the last millisecond is left to rounding.
    expect(nextCountdownDelay(10_000, 9_001)).toBe(999);
    expect(nextCountdownDelay(10_000, 9_999)).toBe(1);
  });

  it('parks the timer once the target is reached', () => {
    expect(nextCountdownDelay(10_000, 10_000)).toBeNull();
    expect(nextCountdownDelay(10_000, 11_000)).toBeNull();
    expect(nextCountdownDelay(Number.NaN, 0)).toBeNull();
  });

  it('splits seconds into days, hours, minutes and seconds', () => {
    expect(countdownParts(2 * 86400 + 4 * 3600 + 15 * 60 + 30)).toEqual({
      days: 2,
      hours: 4,
      minutes: 15,
      seconds: 30,
    });
    expect(countdownParts(59)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 59 });
    expect(countdownParts(-5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('writes the compact form, days first when there are some', () => {
    expect(formatCountdownCompact(countdownParts(2 * 3600 + 4 * 60 + 15), 'd')).toBe('02:04:15');
    expect(formatCountdownCompact(countdownParts(86400 + 5), 'd')).toBe('1d 00:00:05');
    expect(formatCountdownCompact(countdownParts(86400 + 5), 'j')).toBe('1j 00:00:05');
  });

  it('writes the inline form with the two largest units left', () => {
    const labels = { days: 'd', hours: 'h', minutes: 'm', seconds: 's' };
    expect(formatCountdownInline(countdownParts(2 * 86400 + 4 * 3600 + 900), labels)).toBe('2d 4h');
    expect(formatCountdownInline(countdownParts(4 * 3600 + 15 * 60 + 30), labels)).toBe('4h 15m');
    expect(formatCountdownInline(countdownParts(90), labels)).toBe('1m 30s');
    expect(formatCountdownInline(countdownParts(30), labels)).toBe('30s');
    expect(formatCountdownInline(countdownParts(0), labels)).toBe('0s');
    expect(formatCountdownInline(countdownParts(86400), labels)).toBe('1d 0h');
  });
});
