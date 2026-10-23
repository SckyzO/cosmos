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

/** Props every chart wrapper takes. */
export type ChartBaseProps = ChartSize & ChartAccessibility;
