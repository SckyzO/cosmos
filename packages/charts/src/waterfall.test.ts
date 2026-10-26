import { describe, expect, it } from 'vitest';
import { barText, signed, waterfallBars, type WaterfallDatum } from './waterfall';

const WALK: WaterfallDatum[] = [
  { label: 'Opening', value: 420, kind: 'total' },
  { label: 'Sales', value: 310 },
  { label: 'Services', value: 95 },
  { label: 'Refunds', value: -42 },
  { label: 'Gross profit', kind: 'subtotal' },
  { label: 'Payroll', value: -265 },
  { label: 'Marketing', value: -88 },
  { label: 'Infrastructure', value: -54 },
  { label: 'Tax', value: -61 },
  { label: 'Closing', kind: 'total' },
];

describe('waterfallBars', () => {
  it('floats each step between the running total before and after it', () => {
    const bars = waterfallBars(WALK);
    expect(bars.map((bar) => [bar.low, bar.high])).toEqual([
      [0, 420],
      [420, 730],
      [730, 825],
      [783, 825],
      [0, 783],
      [518, 783],
      [430, 518],
      [376, 430],
      [315, 376],
      [0, 315],
    ]);
    expect(bars.map((bar) => bar.running)).toEqual([
      420, 730, 825, 783, 783, 518, 430, 376, 315, 315,
    ]);
  });

  it('names a step an increase or a decrease from its sign, and keeps the other kinds', () => {
    expect(waterfallBars(WALK).map((bar) => bar.kind)).toEqual([
      'total',
      'increase',
      'increase',
      'decrease',
      'subtotal',
      'decrease',
      'decrease',
      'decrease',
      'decrease',
      'total',
    ]);
  });

  it('draws a subtotal from 0 to the running total, not the sum since the last cut', () => {
    const bars = waterfallBars([
      { label: 'Opening', value: 100, kind: 'total' },
      { label: 'A', value: 50 },
      { label: 'First cut', kind: 'subtotal' },
      { label: 'B', value: 25 },
      { label: 'Second cut', kind: 'subtotal' },
    ]);
    expect(bars[2]).toMatchObject({ low: 0, high: 150, value: 150, running: 150 });
    // 175, not the 25 added since the first cut.
    expect(bars[4]).toMatchObject({ low: 0, high: 175, value: 175, running: 175 });
  });

  it('lets a total with a value set the running total, at the start or mid-walk', () => {
    const bars = waterfallBars([
      { label: 'Opening', value: 200, kind: 'total' },
      { label: 'Spend', value: -50 },
      { label: 'Known balance', value: 120, kind: 'total' },
      { label: 'Income', value: 30 },
      { label: 'Closing', kind: 'total' },
    ]);
    expect(bars.map((bar) => bar.running)).toEqual([200, 150, 120, 150, 150]);
    expect(bars[2]).toMatchObject({ low: 0, high: 120 });
    expect(bars[3]).toMatchObject({ low: 120, high: 150 });
  });

  it('starts from 0 when the walk has no opening total', () => {
    const bars = waterfallBars([
      { label: 'A', value: 30 },
      { label: 'B', value: -10 },
    ]);
    expect(bars.map((bar) => [bar.low, bar.high])).toEqual([
      [0, 30],
      [20, 30],
    ]);
  });

  it('counts a step without a value, or a non-finite one, as 0', () => {
    const bars = waterfallBars([
      { label: 'Opening', value: 10, kind: 'total' },
      { label: 'Nothing' },
      { label: 'NaN', value: Number.NaN },
      { label: 'Infinite', value: Infinity },
    ]);
    expect(bars.map((bar) => bar.running)).toEqual([10, 10, 10, 10]);
    expect(bars[1]).toMatchObject({ kind: 'increase', low: 10, high: 10, value: 0 });
  });

  it('draws a total below zero from 0 down, and lets a walk cross zero', () => {
    const bars = waterfallBars([
      { label: 'Opening', value: 40, kind: 'total' },
      { label: 'Loss', value: -100 },
      { label: 'Closing', kind: 'total' },
    ]);
    expect(bars.map((bar) => [bar.low, bar.high])).toEqual([
      [0, 40],
      [-60, 40],
      [-60, 0],
    ]);
    expect(bars[2].running).toBe(-60);
  });

  it('keeps the labels and the order', () => {
    expect(waterfallBars(WALK).map((bar) => bar.label)).toEqual(WALK.map((d) => d.label));
    expect(waterfallBars([])).toEqual([]);
  });
});

describe('signed', () => {
  it('writes the sign, with a real minus, and formats the magnitude', () => {
    expect(signed(310, (v) => `${v}k`)).toBe('+310k');
    expect(signed(-265, (v) => `${v}k`)).toBe('−265k');
    expect(signed(0)).toBe('+0');
  });
});

describe('barText', () => {
  const [opening, sales, , refunds, gross] = waterfallBars(WALK);
  const k = (v: number) => `${v}k`;

  it('signs a step and shows the running total of a subtotal or a total', () => {
    expect(barText(sales, k)).toBe('+310k');
    expect(barText(refunds, k)).toBe('−42k');
    expect(barText(opening, k)).toBe('420k');
    expect(barText(gross, k)).toBe('783k');
  });

  it('formats with String by default', () => {
    expect(barText(sales)).toBe('+310');
  });
});
