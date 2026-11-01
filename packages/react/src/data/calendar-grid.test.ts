import { describe, expect, it } from 'vitest';
import { compareEvents, isAllDay, lastDay } from './calendar-grid';

// Every date here is built from local components (`new Date(2026, 4, 7, 9, 30)`), and the helpers
// read them back as local components: a moment is a wall-clock time, so these tests give the same
// result in any time zone. Run them under another one to check it: `env TZ=America/New_York`.

const day = (d: number, h = 0, m = 0) => new Date(2026, 4, d, h, m);

describe('isAllDay', () => {
  it('is true for a date-only event: midnight, with no end', () => {
    expect(isAllDay({ start: day(7) })).toBe(true);
  });

  it('is true when the end is at midnight too (a run of days, last day included)', () => {
    expect(isAllDay({ start: day(7), end: day(9) })).toBe(true);
  });

  it('is false as soon as the start has a time', () => {
    expect(isAllDay({ start: day(7, 9) })).toBe(false);
    expect(isAllDay({ start: day(7, 0, 15) })).toBe(false);
    expect(isAllDay({ start: new Date(2026, 4, 7, 0, 0, 30) })).toBe(false);
    expect(isAllDay({ start: new Date(2026, 4, 7, 0, 0, 0, 1) })).toBe(false);
  });

  it('is false when a midnight start has an end with a time', () => {
    expect(isAllDay({ start: day(7), end: day(7, 10) })).toBe(false);
  });

  it('is false for a timed event that ends at midnight', () => {
    expect(isAllDay({ start: day(7, 22), end: day(8) })).toBe(false);
  });

  it('lets `allDay` force the answer either way', () => {
    expect(isAllDay({ start: day(7, 14), allDay: true })).toBe(true);
    expect(isAllDay({ start: day(7), allDay: false })).toBe(false);
    expect(isAllDay({ start: day(7), end: day(8), allDay: false })).toBe(false);
  });

  it('reads the day on which the clocks change like any other', () => {
    // 8 March 2026 is a spring-forward day in the United States, 29 March in Europe.
    expect(isAllDay({ start: new Date(2026, 2, 8) })).toBe(true);
    expect(isAllDay({ start: new Date(2026, 2, 8, 22), end: new Date(2026, 2, 9) })).toBe(false);
  });
});

describe('lastDay', () => {
  it('is the day of the start for a one-day event', () => {
    expect(lastDay({ start: day(7) })).toEqual(day(7));
    expect(lastDay({ start: day(7, 9) })).toEqual(day(7));
    expect(lastDay({ start: day(7, 9), end: day(7, 11) })).toEqual(day(7));
  });

  it('is the day of the end, included, for an all-day run', () => {
    expect(lastDay({ start: day(7), end: day(9) })).toEqual(day(9));
  });

  it('ignores an end that is not after the start', () => {
    expect(lastDay({ start: day(7), end: day(7) })).toEqual(day(7));
    expect(lastDay({ start: day(7), end: day(5) })).toEqual(day(7));
    expect(lastDay({ start: day(7, 9), end: day(7, 9) })).toEqual(day(7));
  });

  it('is the day after the start when a timed event runs past midnight', () => {
    expect(lastDay({ start: day(7, 22), end: day(8, 1, 30) })).toEqual(day(8));
  });

  it('stops at the day before for a timed event that ends exactly at midnight', () => {
    expect(lastDay({ start: day(7, 22), end: day(8) })).toEqual(day(7));
    // Forced to timed, a full day is one day, not two.
    expect(lastDay({ start: day(7), end: day(8), allDay: false })).toEqual(day(7));
  });

  it('keeps an all-day event forced on a timed one to the dates', () => {
    expect(lastDay({ start: day(7, 14), end: day(9, 3), allDay: true })).toEqual(day(9));
  });

  it('crosses a month and a year end', () => {
    expect(lastDay({ start: new Date(2025, 11, 30), end: new Date(2026, 0, 2) })).toEqual(
      new Date(2026, 0, 2)
    );
  });
});

describe('compareEvents', () => {
  const order = (events: { id: string; start: Date; end?: Date; allDay?: boolean }[]) =>
    [...events].sort(compareEvents).map((e) => e.id);

  it('puts all-day events before timed ones, whatever the start', () => {
    expect(
      order([
        { id: 'timed', start: day(7, 0, 30) },
        { id: 'all-day', start: day(7) },
      ])
    ).toEqual(['all-day', 'timed']);
    expect(
      order([
        { id: 'timed', start: day(7, 8) },
        { id: 'forced', start: day(7, 14), allDay: true },
      ])
    ).toEqual(['forced', 'timed']);
  });

  it('sorts timed events by start', () => {
    expect(
      order([
        { id: 'late', start: day(7, 16) },
        { id: 'early', start: day(7, 9) },
        { id: 'noon', start: day(7, 12) },
      ])
    ).toEqual(['early', 'noon', 'late']);
  });

  it('puts the longer of two events that start together first', () => {
    expect(
      order([
        { id: 'short', start: day(7, 9), end: day(7, 9, 30) },
        { id: 'long', start: day(7, 9), end: day(7, 12) },
        { id: 'none', start: day(7, 9) },
      ])
    ).toEqual(['long', 'short', 'none']);
  });

  it('sorts all-day events by first day, the longer run first, and ignores their time', () => {
    expect(
      order([
        { id: 'later', start: day(8) },
        { id: 'short', start: day(7) },
        { id: 'run', start: day(7), end: day(10) },
        { id: 'earlier', start: day(6) },
      ])
    ).toEqual(['earlier', 'run', 'short', 'later']);
    expect(
      order([
        { id: 'b', start: day(7, 15), allDay: true },
        { id: 'a', start: day(7, 9), allDay: true },
      ])
    ).toEqual(['b', 'a']);
  });

  it('keeps the order it was given for equal events', () => {
    expect(
      order([
        { id: 'one', start: day(7, 9) },
        { id: 'two', start: day(7, 9) },
      ])
    ).toEqual(['one', 'two']);
  });
});
