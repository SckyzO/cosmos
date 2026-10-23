import type { ApexOptions } from 'apexcharts';

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

export type ChartRawOptions = {
  /**
   * ApexCharts options, merged over the ones the wrapper builds as the last
   * step: the way out for what a wrapper has no prop for, such as a toolbar, a
   * grid color or an annotation. Plain objects merge key by key; an array, a
   * function or any other value replaces the wrapper's, and `undefined` leaves
   * it. The object is copied, never changed.
   *
   * It ties your code to the ApexCharts option format, which the wrappers and
   * ApexCharts itself may change under it: prefer a prop when there is one.
   * ApexCharts ships its features (toolbar, annotations, …) as separate
   * modules and a wrapper loads only the ones it uses: the options of another
   * feature do nothing until you `import 'apexcharts/features/<name>'`.
   *
   * ApexCharts writes legends and tooltips with innerHTML
   * (GHSA-f4hm-pcxh-hcvv). The wrappers escape every series name, category,
   * label and value they hand it, but a `formatter` or `tooltip.custom` given
   * here replaces theirs and receives raw values: it must escape any HTML it
   * writes. Axis labels are SVG text and must stay unescaped.
   *
   * The chart is drawn again when these options change, compared deeply and
   * the functions in them by identity. An object literal without functions is
   * equal on every render and redraws nothing; a function made during render
   * redraws the chart on every render, like `formatValue`: define it outside
   * the component or wrap it in `useCallback`.
   */
  apexOptions?: ApexOptions;
};

/** Props every chart wrapper takes. */
export type ChartBaseProps = ChartSize & ChartAccessibility & ChartRawOptions;
