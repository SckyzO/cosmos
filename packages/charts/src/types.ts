import type { ReactNode } from 'react';

export type ChartSeriesPoint = [number, number] | { x: number | string; y: number };

export type ChartSize = {
  height?: number | string;
  width?: number | string;
};

/** Props of the charts that can have no data to draw. */
export type ChartEmptyProps = {
  /**
   * Text drawn in place of the plot when the chart has no series, or only
   * empty ones. Default `No data`; an empty string draws nothing. It is drawn
   * as plain text: markup in it shows as written.
   */
  emptyMessage?: string;
};

/** Props of the charts with a horizontal and a vertical axis. */
export type ChartAxisTitleProps = {
  /** Title under the horizontal axis, such as "Time (UTC)". Drawn as plain text. */
  xTitle?: string;
  /** Title beside the vertical axis, such as "Requests / s". Drawn as plain text. */
  yTitle?: string;
};

/** The meaning of a reference line or band: its color comes from the theme. */
export type ChartIntent = 'neutral' | 'warning' | 'danger' | 'success';

/** A line across the plot at a value of the value axis: a threshold, a target, a limit. */
export type ChartReferenceLine = {
  /** Where the line sits, in the units of the value axis. */
  value: number;
  /** Written next to the line, as plain text: markup in it shows as written. */
  label?: string;
  /** `neutral` (default) is the muted text color; the others are the theme's status colors. */
  intent?: ChartIntent;
  /** Draw the line dashed. Default solid. */
  dashed?: boolean;
};

/** A band across the plot between two values of the value axis: a target range, a safe zone. */
export type ChartReferenceBand = {
  /** One end of the band, in the units of the value axis. */
  from: number;
  /** The other end of the band. */
  to: number;
  /** Written in the band, as plain text: markup in it shows as written. */
  label?: string;
  /** `neutral` (default) is the muted text color; the others are the theme's status colors. */
  intent?: ChartIntent;
};

/** Props of the charts that can draw lines and bands at values of their value axis. */
export type ChartReferenceProps = {
  /**
   * Lines across the plot at a value of the value axis: the vertical axis,
   * or the horizontal one on a chart of horizontal bars. A line outside the
   * data makes the axis reach it. On `MixedChart` they read the left axis (the
   * right one when no series is on the left). Drawn above the series.
   */
  referenceLines?: ChartReferenceLine[];
  /** Bands across the plot between two values of the value axis, behind the series. Same axis rules as `referenceLines`. */
  referenceBands?: ChartReferenceBand[];
};

export type ChartLegendPosition = 'top' | 'right' | 'bottom' | 'left';

/** Props of the charts that draw a legend. */
export type ChartLegendProps = {
  /**
   * The side of the plot the legend sits on. Default `top` (`bottom` on
   * `DonutChart`). The legend is a row on `top` and `bottom` and a column on
   * `left` and `right`, and takes its room from the plot.
   */
  legendPosition?: ChartLegendPosition;
};

/** Props every chart wrapper takes. */
export type ChartProps = ChartSize & {
  /**
   * Name screen readers read for the chart, such as "CPU usage per hour".
   * Without it, the chart is named from its type and its series.
   */
  ariaLabel?: string;
  /**
   * [Recharts](https://recharts.github.io/) elements drawn inside the chart,
   * after the ones the wrapper builds: a `ReferenceLine` for a threshold, a
   * `ReferenceArea`, a `Brush`, an extra axis. They read the chart's data and
   * axes, so a reference line takes a `y` in the units of the series.
   *
   * Add `recharts` at the version this package depends on (`3.10.1`): two
   * copies of it do not share a chart's context. Colors take CSS variables
   * (`stroke="var(--color-status-warn)"`), which follow the theme.
   */
  children?: ReactNode;
};
