import { describe, expect, it } from 'vitest';
import {
  columnsFitting,
  compareEvents,
  firstStart,
  isAllDay,
  lastDay,
  layoutAllDay,
  layoutDay,
  minutesOfDay,
  minutesToPx,
  moveCursor,
  openHour,
  periodStart,
  segmentOn,
  slotAt,
  stepPeriod,
} from './calendar-grid';

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

describe('segmentOn', () => {
  it('is the minutes of a timed event on its day', () => {
    expect(segmentOn({ start: day(7, 9, 30), end: day(7, 11) }, day(7))).toEqual({
      startMin: 570,
      endMin: 660,
      before: false,
      after: false,
    });
  });

  it('is null for an all-day event and for a day the event does not reach', () => {
    expect(segmentOn({ start: day(7) }, day(7))).toBeNull();
    expect(segmentOn({ start: day(7, 9), end: day(7, 10) }, day(6))).toBeNull();
    expect(segmentOn({ start: day(7, 9), end: day(7, 10) }, day(8))).toBeNull();
  });

  it('reads the day it is asked for at any time of that day', () => {
    expect(segmentOn({ start: day(7, 9), end: day(7, 10) }, day(7, 15))).not.toBeNull();
  });

  it('has no length when there is no end, or an end that does not follow', () => {
    expect(segmentOn({ start: day(7, 9) }, day(7))).toEqual({
      startMin: 540,
      endMin: 540,
      before: false,
      after: false,
    });
    expect(segmentOn({ start: day(7, 9), end: day(7, 8) }, day(7))?.endMin).toBe(540);
  });

  it('cuts an event that runs past midnight at 24:00 and picks it up at 00:00', () => {
    const event = { start: day(7, 22), end: day(8, 1, 30) };
    expect(segmentOn(event, day(7))).toEqual({
      startMin: 1320,
      endMin: 1440,
      before: false,
      after: true,
    });
    expect(segmentOn(event, day(8))).toEqual({
      startMin: 0,
      endMin: 90,
      before: true,
      after: false,
    });
  });

  it('gives a whole day to each day an event covers between its first and its last', () => {
    const event = { start: day(7, 20), end: day(9, 6) };
    expect(segmentOn(event, day(8))).toEqual({
      startMin: 0,
      endMin: 1440,
      before: true,
      after: true,
    });
  });

  it('ends at 24:00, not on the next day, for an event that ends at midnight', () => {
    const event = { start: day(7, 22), end: day(8) };
    expect(segmentOn(event, day(7))).toEqual({
      startMin: 1320,
      endMin: 1440,
      before: false,
      after: false,
    });
    expect(segmentOn(event, day(8))).toBeNull();
  });

  it('counts wall-clock minutes on the day the clocks change', () => {
    // 22:00 to 03:30 across the night of 29 March: 5.5 hours on the wall clock, whatever the zone.
    const event = { start: new Date(2026, 2, 28, 22), end: new Date(2026, 2, 29, 3, 30) };
    expect(segmentOn(event, new Date(2026, 2, 29))?.endMin).toBe(210);
  });
});

describe('firstStart', () => {
  const days = [day(6), day(7), day(8)];

  it('is the earliest start of a timed event on the days', () => {
    expect(
      firstStart(
        [
          { start: day(7, 10) },
          { start: day(8, 6, 30), end: day(8, 8) },
          { start: day(6, 14) },
          { start: day(9, 5) },
        ],
        days
      )
    ).toBe(390);
  });

  it('does not count the part of an event that began the day before: it starts at 00:00 only because it was cut there', () => {
    expect(firstStart([{ start: day(5, 22), end: day(6, 1) }, { start: day(7, 9) }], days)).toBe(
      540
    );
    expect(firstStart([{ start: day(5, 22), end: day(6, 1) }], days)).toBeUndefined();
  });

  it('is undefined with no timed event, all-day ones aside', () => {
    expect(firstStart([], days)).toBeUndefined();
    expect(firstStart([{ start: day(7) }, { start: day(9, 8) }], days)).toBeUndefined();
  });
});

describe('openHour', () => {
  it('is 7 with no event, and with one that starts later', () => {
    expect(openHour(undefined)).toBe(7);
    expect(openHour(9 * 60)).toBe(7);
    expect(openHour(8 * 60 + 59)).toBe(7);
  });

  it('is the hour before the first event when that starts earlier than 8', () => {
    expect(openHour(7 * 60 + 30)).toBe(6);
    expect(openHour(6 * 60)).toBe(5);
  });

  it('never goes before midnight', () => {
    expect(openHour(0)).toBe(0);
    expect(openHour(45)).toBe(0);
    expect(openHour(90)).toBe(0);
  });
});

describe('layoutDay', () => {
  const seg = (from: number, to: number) => ({ startMin: from * 60, endMin: to * 60 });
  const columnsOf = (layout: ReturnType<typeof layoutDay>) =>
    layout.placed.map(({ column, columns }) => [column, columns]);

  it('gives an event on its own the whole width', () => {
    expect(columnsOf(layoutDay([seg(9, 10), seg(11, 12)], 3))).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it('puts events that overlap side by side, sharing the width', () => {
    expect(columnsOf(layoutDay([seg(9, 11), seg(10, 12)], 3))).toEqual([
      [0, 2],
      [1, 2],
    ]);
  });

  it('does not make a group of events that only touch', () => {
    expect(columnsOf(layoutDay([seg(9, 10), seg(10, 11)], 3))).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it('reuses the first column that is free, and keeps a chain in one group', () => {
    // 9-11 and 10-12 overlap, 11-13 overlaps only the second: one group of two columns.
    expect(columnsOf(layoutDay([seg(9, 11), seg(10, 12), seg(11, 13)], 3))).toEqual([
      [0, 2],
      [1, 2],
      [0, 2],
    ]);
  });

  it('gives each group the width it needs, not the widest of the day', () => {
    const layout = layoutDay([seg(9, 12), seg(9, 11), seg(10, 11), seg(14, 15)], 4);
    expect(columnsOf(layout)).toEqual([
      [0, 3],
      [1, 3],
      [2, 3],
      [0, 1],
    ]);
  });

  it('holds a short event to the height it is drawn at', () => {
    // 9:00 to 9:05 and 9:10 to 9:20 are drawn 25 minutes tall: they would overlap.
    const layout = layoutDay(
      [
        { startMin: 540, endMin: 545 },
        { startMin: 550, endMin: 560 },
      ],
      3
    );
    expect(columnsOf(layout)).toEqual([
      [0, 2],
      [1, 2],
    ]);
    // A start 25 minutes later fits the first column again.
    expect(
      columnsOf(
        layoutDay(
          [
            { startMin: 540, endMin: 540 },
            { startMin: 565, endMin: 570 },
          ],
          3
        )
      )
    ).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it('keeps an event at the end of the day inside it', () => {
    expect(columnsOf(layoutDay([{ startMin: 1435, endMin: 1435 }], 2))).toEqual([[0, 1]]);
  });

  it('keeps the first columns and reports the rest when a group needs more than fit', () => {
    const layout = layoutDay([seg(9, 12), seg(9, 12), seg(9, 12), seg(10, 12), seg(11, 12)], 2);
    expect(layout.placed).toEqual([
      { index: 0, column: 0, columns: 2, reserved: true },
      { index: 1, column: 1, columns: 2, reserved: true },
    ]);
    expect(layout.overflow).toEqual([{ startMin: 9 * 60, indices: [2, 3, 4] }]);
  });

  it('puts the "+N" of a group where its first hidden event starts', () => {
    const layout = layoutDay([seg(9, 12), seg(9, 12), seg(10, 12), seg(11, 12)], 2);
    expect(layout.overflow).toEqual([{ startMin: 10 * 60, indices: [2, 3] }]);
  });

  it('leaves a group that fits alone, whatever its neighbour does', () => {
    const layout = layoutDay([seg(9, 12), seg(9, 12), seg(9, 12), seg(14, 15), seg(14, 16)], 2);
    expect(layout.placed.map(({ index, reserved }) => [index, reserved])).toEqual([
      [0, true],
      [1, true],
      [3, false],
      [4, false],
    ]);
    expect(layout.overflow).toHaveLength(1);
  });

  it('has nothing to place for an empty day', () => {
    expect(layoutDay([], 2)).toEqual({ placed: [], overflow: [] });
  });
});

describe('columnsFitting', () => {
  it('fits a column of 72px at least, and two columns at least', () => {
    expect(columnsFitting(0)).toBe(2);
    expect(columnsFitting(100)).toBe(2);
    expect(columnsFitting(143)).toBe(2);
    expect(columnsFitting(144)).toBe(2);
    expect(columnsFitting(216)).toBe(3);
    expect(columnsFitting(300)).toBe(4);
    expect(columnsFitting(1000)).toBe(13);
  });
});

describe('layoutAllDay', () => {
  const week = Array.from({ length: 7 }, (_, i) => day(4 + i));

  it('lays an event over the days it covers', () => {
    expect(layoutAllDay([{ start: day(5), end: day(7) }], week)).toEqual([
      { index: 0, column: 1, span: 3, lane: 0, before: false, after: false },
    ]);
  });

  it('is one column for an event of one day', () => {
    expect(layoutAllDay([{ start: day(8) }], week)).toEqual([
      { index: 0, column: 4, span: 1, lane: 0, before: false, after: false },
    ]);
  });

  it('cuts an event to the days shown, and says which side it goes on past', () => {
    expect(layoutAllDay([{ start: day(2), end: day(5) }], week)).toEqual([
      { index: 0, column: 0, span: 2, lane: 0, before: true, after: false },
    ]);
    expect(layoutAllDay([{ start: day(9), end: day(14) }], week)).toEqual([
      { index: 0, column: 5, span: 2, lane: 0, before: false, after: true },
    ]);
    expect(layoutAllDay([{ start: day(1), end: day(20) }], week)).toEqual([
      { index: 0, column: 0, span: 7, lane: 0, before: true, after: true },
    ]);
  });

  it('leaves out an event that does not reach the days, and a timed one', () => {
    expect(
      layoutAllDay(
        [
          { start: day(1), end: day(3) },
          { start: day(11) },
          { start: day(6, 10), end: day(6, 11) },
        ],
        week
      )
    ).toEqual([]);
  });

  it('stacks events that share a day, and reuses a row once it is free', () => {
    const bars = layoutAllDay(
      [
        { start: day(5), end: day(7) },
        { start: day(6), end: day(6) },
        { start: day(8) },
        { start: day(7), end: day(9) },
      ],
      week
    );
    expect(bars.map(({ index, lane }) => [index, lane])).toEqual([
      [0, 0],
      [1, 1],
      [3, 1],
      [2, 0],
    ]);
  });

  it('puts the longer event first when two start together, and refers to the list given', () => {
    const bars = layoutAllDay(
      [{ start: day(5) }, { start: day(5), end: day(8) }, { start: day(4) }],
      week
    );
    expect(bars.map(({ index, lane }) => [index, lane])).toEqual([
      [2, 0],
      [1, 0],
      [0, 1],
    ]);
  });

  it('works on a single day', () => {
    // One column: each event is a bar over it, one under the other.
    expect(layoutAllDay([{ start: day(6), end: day(8) }, { start: day(7) }], [day(7)])).toEqual([
      { index: 0, column: 0, span: 1, lane: 0, before: true, after: true },
      { index: 1, column: 0, span: 1, lane: 1, before: false, after: false },
    ]);
    expect(layoutAllDay([{ start: day(6) }], [day(7)])).toEqual([]);
  });
});

describe('slotAt', () => {
  it('is the start of the 30-minute slot under the point, 48px an hour', () => {
    expect(slotAt(0)).toBe(0);
    expect(slotAt(23)).toBe(0);
    expect(slotAt(24)).toBe(30);
    expect(slotAt(47)).toBe(30);
    expect(slotAt(48)).toBe(60);
    expect(slotAt(7 * 48 + 30)).toBe(7 * 60 + 30);
    expect(slotAt(14 * 48 + 36)).toBe(14 * 60 + 30);
  });

  it('holds a point beyond the column to its first or its last slot', () => {
    expect(slotAt(-40)).toBe(0);
    expect(slotAt(24 * 48)).toBe(23 * 60 + 30);
    expect(slotAt(5000)).toBe(23 * 60 + 30);
  });

  it('takes the height of an hour and the size of a slot', () => {
    expect(slotAt(30, 60, 15)).toBe(30);
    expect(slotAt(44, 60, 15)).toBe(30);
    expect(slotAt(45, 60, 15)).toBe(45);
  });
});

describe('moveCursor', () => {
  const at = (d: number, h: number, m = 0) => ({ date: day(d), minutes: h * 60 + m });
  const week = { periodDays: 7, rtl: false };
  const key = (from: ReturnType<typeof at>, k: Parameters<typeof moveCursor>[1], opts = week) =>
    moveCursor(from, k, opts);

  it('moves a day with the left and right arrows, and a slot with up and down', () => {
    expect(key(at(7, 14), 'ArrowRight')).toEqual(at(8, 14));
    expect(key(at(7, 14), 'ArrowLeft')).toEqual(at(6, 14));
    expect(key(at(7, 14), 'ArrowDown')).toEqual(at(7, 14, 30));
    expect(key(at(7, 14, 30), 'ArrowUp')).toEqual(at(7, 14));
  });

  it('swaps the day arrows in right to left, where the next day is on the left', () => {
    const rtl = { periodDays: 7, rtl: true };
    expect(key(at(7, 14), 'ArrowLeft', rtl)).toEqual(at(8, 14));
    expect(key(at(7, 14), 'ArrowRight', rtl)).toEqual(at(6, 14));
    expect(key(at(7, 14), 'ArrowDown', rtl)).toEqual(at(7, 14, 30));
  });

  it('holds up and down to the day', () => {
    expect(key(at(7, 0), 'ArrowUp')).toEqual(at(7, 0));
    expect(key(at(7, 23, 30), 'ArrowDown')).toEqual(at(7, 23, 30));
  });

  it('goes to the first and the last slot of the day with Home and End', () => {
    expect(key(at(7, 14), 'Home')).toEqual(at(7, 0));
    expect(key(at(7, 14), 'End')).toEqual(at(7, 23, 30));
  });

  it('moves a whole period with Page Up and Page Down, at the same time', () => {
    expect(key(at(7, 14), 'PageDown')).toEqual(at(14, 14));
    expect(key(at(7, 14), 'PageUp')).toEqual({ date: new Date(2026, 3, 30), minutes: 840 });
    expect(key(at(7, 14), 'PageDown', { periodDays: 1, rtl: false })).toEqual(at(8, 14));
  });

  it('crosses a month end by dates, not by hours', () => {
    expect(key({ date: new Date(2026, 4, 31), minutes: 600 }, 'ArrowRight')).toEqual({
      date: new Date(2026, 5, 1),
      minutes: 600,
    });
    expect(key({ date: new Date(2026, 2, 28), minutes: 600 }, 'PageDown')).toEqual({
      date: new Date(2026, 3, 4),
      minutes: 600,
    });
  });
});

describe('periodStart and stepPeriod', () => {
  it('starts a month on the 1st, a week on its Monday and a day on itself', () => {
    expect(periodStart(day(20, 15), 'month')).toEqual(new Date(2026, 4, 1));
    expect(periodStart(day(7, 15), 'week')).toEqual(day(4));
    expect(periodStart(day(7, 15), 'day')).toEqual(day(7));
  });

  it('puts a Sunday in the week that began on the Monday before', () => {
    expect(periodStart(day(10), 'week')).toEqual(day(4));
    expect(periodStart(day(11), 'week')).toEqual(day(11));
  });

  it('steps by months, weeks and days, back or forward', () => {
    expect(stepPeriod(new Date(2026, 4, 1), 'month', 1)).toEqual(new Date(2026, 5, 1));
    expect(stepPeriod(new Date(2026, 0, 1), 'month', -1)).toEqual(new Date(2025, 11, 1));
    expect(stepPeriod(day(4), 'week', 1)).toEqual(day(11));
    expect(stepPeriod(day(4), 'week', -1)).toEqual(new Date(2026, 3, 27));
    expect(stepPeriod(day(4), 'day', 3)).toEqual(day(7));
    expect(stepPeriod(day(31), 'day', 1)).toEqual(new Date(2026, 5, 1));
  });
});

describe('minutesOfDay and minutesToPx', () => {
  it('counts the wall clock from midnight, and draws 48px an hour', () => {
    expect(minutesOfDay(day(7, 9, 30))).toBe(570);
    expect(minutesOfDay(day(7))).toBe(0);
    expect(minutesOfDay(day(7, 23, 59))).toBe(1439);
    expect(minutesToPx(60)).toBe(48);
    expect(minutesToPx(90)).toBe(72);
  });
});
