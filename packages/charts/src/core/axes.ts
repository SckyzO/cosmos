import { GRID, MUTED } from './colors';

// Axis text is 12px at the normal text size and follows the text size setting:
// `--text-xs` is rescaled on <html> by `data-text-size`. The fallback is the
// normal size, for an app that doesn't load the theme.
export const TEXT_SIZE = 'var(--text-xs, 0.75rem)';

/** The look of every axis: no line, no tick mark, muted text. */
export const AXIS = {
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
  tick: { fill: MUTED, style: { fontSize: TEXT_SIZE } },
} as const;

/** The grid: horizontal dashed lines only. */
export const GRID_PROPS = {
  vertical: false,
  stroke: GRID,
  strokeDasharray: '4 4',
} as const;

// `fill` as an attribute too: the label's own default is gray.
const titleStyle = { fill: MUTED, fontSize: TEXT_SIZE } as const;

/** Props for an `XAxis` with an optional title under it. The title is SVG text: markup shows as written. */
export const xAxisTitle = (title?: string) =>
  title
    ? ({
        height: 52,
        label: {
          value: title,
          position: 'insideBottom',
          offset: 0,
          fill: MUTED,
          style: titleStyle,
        },
      } as const)
    : {};

/** Props for a `YAxis` with an optional title beside it. */
export const yAxisTitle = (title?: string) =>
  title
    ? ({
        label: {
          value: title,
          angle: -90,
          position: 'insideLeft',
          offset: 4,
          fill: MUTED,
          style: { ...titleStyle, textAnchor: 'middle' },
        },
      } as const)
    : {};
