// The maths of FunnelChart: bar widths, conversion rates and the flow between
// two bars. No DOM and no colors, so it runs in plain Node.

export type FunnelStage = { label: string; value: number };

export type FunnelRow = {
  label: string;
  /** The value drawn: a negative or non-finite one counts as 0. */
  value: number;
  /** Width of the bar, 0 to 1, against the largest stage. */
  share: number;
  /** Rate from the previous stage; 1 for the first. `null` when the previous stage is 0. */
  fromPrevious: number | null;
  /** Rate from the first stage; `null` when the first stage is 0. */
  fromFirst: number | null;
};

const clean = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

/** Whether there is nothing to draw: no stage, or only stages at 0. */
export const isEmptyFunnel = (stages: readonly FunnelStage[]): boolean =>
  stages.every((stage) => clean(stage.value) === 0);

/**
 * One row per stage, in the order given. A bar is as wide as its value against
 * the largest stage, which is the first one unless a stage grows (a merge of
 * sources, say): that stage then has a rate over 1 and the widest bar, so no
 * bar ever leaves the box. A rate over a stage at 0 is `null`.
 */
export const funnelRows = (stages: readonly FunnelStage[]): FunnelRow[] => {
  const values = stages.map((stage) => clean(stage.value));
  const widest = Math.max(0, ...values);
  const rate = (value: number, over: number) => (over > 0 ? value / over : null);
  return stages.map((stage, i) => ({
    label: stage.label,
    value: values[i],
    share: widest > 0 ? values[i] / widest : 0,
    fromPrevious: i === 0 ? 1 : rate(values[i], values[i - 1]),
    fromFirst: rate(values[i], values[0]),
  }));
};

/** A rate as a percentage with one decimal (`0.654` is `65.4%`); `–` when there is none. */
export const formatRate = (rate: number | null): string =>
  rate === null ? '–' : `${(rate * 100).toFixed(1)}%`;

// What the last bar keeps of the accent: still 1.5:1 against the card in the dark themes (see SEQUENTIAL).
const FADE_FLOOR = 42;

/** How much of the accent stage `index` of `count` keeps, in percent: 100 for the first, 42 for the last. */
export const fadeShare = (index: number, count: number): number =>
  count <= 1 ? 100 : Math.round((100 - ((100 - FADE_FLOOR) * index) / (count - 1)) * 10) / 10;

/**
 * The `points` of the flow from a bar to the next, in a box 100 wide and 1
 * tall, stretched to the gap between the two bars: the top edge is the upper
 * bar's width, the bottom edge the lower bar's, both centred.
 */
export const flowPoints = (upper: number, lower: number): string => {
  const edge = (share: number) => [(100 - 100 * share) / 2, (100 + 100 * share) / 2];
  const [topLeft, topRight] = edge(upper);
  const [bottomLeft, bottomRight] = edge(lower);
  return `${topLeft},0 ${topRight},0 ${bottomRight},1 ${bottomLeft},1`;
};
