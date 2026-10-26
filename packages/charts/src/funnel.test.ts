import { describe, expect, it } from 'vitest';
import { fadeShare, flowPoints, formatRate, funnelRows, isEmptyFunnel } from './funnel';

const STAGES = [
  { label: 'Visits', value: 1000 },
  { label: 'Signups', value: 500 },
  { label: 'Paid', value: 100 },
];

describe('funnelRows', () => {
  it('sizes each bar against the first stage and rates it from the previous and the first', () => {
    const rows = funnelRows(STAGES);
    expect(rows.map((row) => row.share)).toEqual([1, 0.5, 0.1]);
    expect(rows.map((row) => row.fromPrevious)).toEqual([1, 0.5, 0.2]);
    expect(rows.map((row) => row.fromFirst)).toEqual([1, 0.5, 0.1]);
  });

  it('keeps the order given and does not sort', () => {
    expect(funnelRows([...STAGES].reverse()).map((row) => row.label)).toEqual([
      'Paid',
      'Signups',
      'Visits',
    ]);
  });

  it('lets a stage grow: a rate over 1, and the widest bar takes the full width', () => {
    const rows = funnelRows([
      { label: 'Web', value: 100 },
      { label: 'Web and app', value: 150 },
      { label: 'Buyers', value: 30 },
    ]);
    expect(rows[1].fromPrevious).toBe(1.5);
    expect(rows[1].fromFirst).toBe(1.5);
    expect(rows.map((row) => row.share)).toEqual([100 / 150, 1, 0.2]);
    expect(Math.max(...rows.map((row) => row.share))).toBe(1);
  });

  it('has no rate over a stage at 0', () => {
    const rows = funnelRows([
      { label: 'a', value: 10 },
      { label: 'b', value: 0 },
      { label: 'c', value: 4 },
    ]);
    expect(rows.map((row) => row.fromPrevious)).toEqual([1, 0, null]);
    const noFirst = funnelRows([
      { label: 'a', value: 0 },
      { label: 'b', value: 4 },
    ]);
    expect(noFirst.map((row) => row.fromFirst)).toEqual([null, null]);
    expect(noFirst.map((row) => row.share)).toEqual([0, 1]);
  });

  it('counts a negative or non-finite value as 0', () => {
    const rows = funnelRows([
      { label: 'a', value: 10 },
      { label: 'b', value: -5 },
      { label: 'c', value: Number.NaN },
    ]);
    expect(rows.map((row) => row.value)).toEqual([10, 0, 0]);
  });
});

describe('isEmptyFunnel', () => {
  it('is true with no stage or only stages at 0', () => {
    expect(isEmptyFunnel([])).toBe(true);
    expect(isEmptyFunnel([{ label: 'a', value: 0 }])).toBe(true);
    expect(isEmptyFunnel([{ label: 'a', value: Number.NaN }])).toBe(true);
    expect(isEmptyFunnel(STAGES)).toBe(false);
  });
});

describe('formatRate', () => {
  it('writes one decimal, and a dash when there is no rate', () => {
    expect(formatRate(0.654)).toBe('65.4%');
    expect(formatRate(1.5)).toBe('150.0%');
    expect(formatRate(0.2051)).toBe('20.5%');
    expect(formatRate(0)).toBe('0.0%');
    expect(formatRate(null)).toBe('–');
  });
});

describe('fadeShare', () => {
  it('goes from the full accent to the floor in even steps', () => {
    expect([0, 1, 2, 3, 4].map((i) => fadeShare(i, 5))).toEqual([100, 85.5, 71, 56.5, 42]);
  });

  it('is the full accent for a single stage', () => {
    expect(fadeShare(0, 1)).toBe(100);
  });
});

describe('flowPoints', () => {
  it('joins the edges of two centred bars', () => {
    expect(flowPoints(1, 0.5)).toBe('0,0 100,0 75,1 25,1');
    expect(flowPoints(0.5, 0.5)).toBe('25,0 75,0 75,1 25,1');
  });

  it('flares out when the next bar is wider', () => {
    expect(flowPoints(0.5, 1)).toBe('25,0 75,0 100,1 0,1');
  });
});
