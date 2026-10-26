// The maths of WaterfallChart: the running total, the span each bar covers and
// the text that names it. No DOM and no colors, so it runs in plain Node.

export type WaterfallDatum = {
  label: string;
  /** A step: the signed change. A total: sets the running total to it (an opening balance). */
  value?: number;
  /** Default `step`. `subtotal` and `total` are drawn from 0 to the running total. */
  kind?: 'step' | 'subtotal' | 'total';
};

/** What a bar means: a step reads as an increase or a decrease from its sign. */
export type WaterfallBarKind = 'increase' | 'decrease' | 'subtotal' | 'total';

export type WaterfallBar = {
  label: string;
  kind: WaterfallBarKind;
  /** A step: its signed change. A subtotal or a total: the running total it shows. */
  value: number;
  /** The bottom and the top of the bar, in the units of the data. */
  low: number;
  high: number;
  /** The running total after this bar. */
  running: number;
};

/** The kind in words, for the tooltip and the name a screen reader hears. */
export const KIND_WORDS: Record<WaterfallBarKind, string> = {
  increase: 'Increase',
  decrease: 'Decrease',
  subtotal: 'Subtotal',
  total: 'Total',
};

// A missing or non-finite value counts as 0.
const clean = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) ? value : 0;

/**
 * One bar per datum, in the order given. A step moves the running total by its
 * signed `value` and floats between the total before and after it. A subtotal
 * is the running total at that point, from 0, never the sum since the last
 * cut. A total with a `value` sets the running total to it (the opening
 * balance, or a known balance mid-walk); without one it shows the running
 * total. Both are drawn from 0.
 */
export const waterfallBars = (data: readonly WaterfallDatum[]): WaterfallBar[] => {
  let running = 0;
  return data.map((datum) => {
    if (datum.kind === 'subtotal' || datum.kind === 'total') {
      if (datum.kind === 'total' && datum.value !== undefined) running = clean(datum.value);
      return {
        label: datum.label,
        kind: datum.kind,
        value: running,
        low: Math.min(0, running),
        high: Math.max(0, running),
        running,
      };
    }
    const change = clean(datum.value);
    const before = running;
    running += change;
    return {
      label: datum.label,
      kind: change < 0 ? 'decrease' : 'increase',
      value: change,
      low: Math.min(before, running),
      high: Math.max(before, running),
      running,
    };
  });
};

/** A change with its sign, in text: `+310k`, `−265k` (U+2212). `format` gets the magnitude. */
export const signed = (value: number, format: (value: number) => string = String) =>
  `${value < 0 ? '−' : '+'}${format(Math.abs(value))}`;

/** What is written above a bar: the signed change of a step, the running total of a subtotal or a total. */
export const barText = (bar: WaterfallBar, format: (value: number) => string = String) =>
  bar.kind === 'increase' || bar.kind === 'decrease'
    ? signed(bar.value, format)
    : format(bar.running);
