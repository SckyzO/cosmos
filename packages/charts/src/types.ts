export type ChartSeriesPoint = [number, number] | { x: number | string; y: number };

export type ChartSize = {
  height?: number | string;
  width?: number | string;
};

export type ChartAccessibility = {
  /**
   * Name screen readers read for the chart, such as "CPU usage per hour".
   * Without it, ApexCharts builds one from the chart type and series names
   * ("bar chart with 2 data series: CRIT, WARN").
   */
  ariaLabel?: string;
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
export type ChartBaseProps = ChartSize & ChartAccessibility;
