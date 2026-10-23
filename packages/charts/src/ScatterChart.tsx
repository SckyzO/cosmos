import type { ApexOptions } from 'apexcharts';
// `apexcharts/scatter` and `apexcharts/bubble` are byte-identical copies of
// `apexcharts/line`, which registers both types. Importing `line`, like the
// other line-family wrappers, keeps a single copy of the engine in a bundle.
import 'apexcharts/line';
import 'apexcharts/features/legend';
import { useMemo } from 'react';
import { ApexChart } from './ApexChart';
import { useStableCallback } from './formatters';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import { tooltipHtml, type TooltipRow } from './tooltip';
import type { ChartBaseProps, ChartLegendProps } from './types';

export type ScatterPoint = {
  x: number;
  y: number;
  /** Names the point in the tooltip title: a node, a host, a rack. */
  label?: string;
};

export type BubblePoint = ScatterPoint & {
  /** Third measure, drawn as the bubble size. */
  z: number;
};

type XYChartProps = ChartBaseProps &
  ChartLegendProps & {
    /** Title under the x-axis. Also labels the x value in the tooltip (default `x`). */
    xTitle?: string;
    /** Title beside the y-axis. Also labels the y value in the tooltip (default `y`). */
    yTitle?: string;
    /** Override the default Cosmos palette, one color per series. */
    colors?: string[];
    /**
     * Format the x-axis labels and the tooltip's x value (default: at most two decimals).
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatX?: (value: number) => string;
    /**
     * Format the y-axis labels and the tooltip's y value (default: at most two decimals).
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatY?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

export type ScatterChartProps = XYChartProps & {
  series: { name: string; data: ScatterPoint[] }[];
};

export type BubbleChartProps = XYChartProps & {
  series: { name: string; data: BubblePoint[] }[];
  /** Labels the size in the tooltip. Default `Size`. */
  sizeTitle?: string;
  /** Format the size in the tooltip (default: at most two decimals). */
  formatSize?: (value: number) => string;
};

/** Drops the float noise of computed values: 33.333333 reads 33.33. */
const formatNumber = (value: number) => String(Number(value.toFixed(2)));

/**
 * Axis bounds and tick count that put every tick on a round value.
 * ApexCharts splits a numeric x-axis evenly between the data extremes (12,
 * 16.59, 21.18…). `pad` first widens the range by that fraction on each side,
 * so the bubbles at the edges are not clipped; it never crosses zero.
 */
const niceAxis = (values: number[], pad = 0, ticks = 5) => {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const margin = (high - low) * pad;
  const min = low >= 0 ? Math.max(low - margin, 0) : low - margin;
  const max = high <= 0 ? Math.min(high + margin, 0) : high + margin;
  // No data, or a single value: let ApexCharts scale it.
  if (!(max > min)) return {};
  const rough = (max - min) / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= rough) ?? rough;
  const round = (value: number) => Number(value.toPrecision(12));
  const niceMin = round(Math.floor(min / step) * step);
  const niceMax = round(Math.ceil(max / step) * step);
  return { min: niceMin, max: niceMax, tickAmount: Math.round((niceMax - niceMin) / step) };
};

const useXYOptions = <P extends ScatterPoint>(
  {
    series,
    xTitle,
    yTitle,
    colors,
    formatX = formatNumber,
    formatY = formatNumber,
    showLegend,
    legendPosition = 'top',
  }: XYChartProps & { series: { name: string; data: P[] }[] },
  { pad = 0, extraRows = () => [] }: { pad?: number; extraRows?: (point: P) => TooltipRow[] } = {}
): ApexOptions => {
  const { grid, axisLabels, palette, tooltipTheme } = useChartTheme();
  const seriesColors = colors ?? palette;
  const axisFormat = useMemo(
    () => ({
      x: (value: string | number) => formatX(Number(value)),
      y: (value: number) => formatY(value),
    }),
    [formatX, formatY]
  );
  // The tooltip is HTML: tooltipHtml escapes the label, the series name and
  // the values. Read on hover: a stable function, so a parent render does not
  // redraw the chart.
  const tooltip = useStableCallback(
    ({ seriesIndex, dataPointIndex }: { seriesIndex: number; dataPointIndex: number }) => {
      const { name, data } = series[seriesIndex];
      const point = data[dataPointIndex];
      return tooltipHtml({
        title: point.label,
        series: { name, color: seriesColors[seriesIndex % seriesColors.length] },
        rows: [
          [xTitle ?? 'x', formatX(point.x)],
          [yTitle ?? 'y', formatY(point.y)],
          ...extraRows(point),
        ],
      });
    }
  );
  const points = series.flatMap(({ data }) => data);
  const axisTitle = (text: string | undefined) =>
    text === undefined
      ? undefined
      : {
          text,
          style: {
            color: axisLabels.style.colors,
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: 500,
          },
        };

  return {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
    colors: seriesColors,
    dataLabels: { enabled: false },
    grid,
    // One labels object per axis: ApexCharts writes formatters onto them.
    // Axis labels and titles are SVG text and stay unescaped.
    xaxis: {
      type: 'numeric',
      ...niceAxis(
        points.map(({ x }) => x),
        pad
      ),
      title: axisTitle(xTitle),
      labels: { ...axisLabels, formatter: axisFormat.x },
      axisBorder: { show: false },
      axisTicks: { show: false },
      // The x-axis tooltip is HTML and repeats the x value of the tooltip.
      tooltip: { enabled: false },
    },
    yaxis: {
      ...niceAxis(
        points.map(({ y }) => y),
        pad
      ),
      title: axisTitle(yTitle),
      labels: { ...axisLabels, formatter: axisFormat.y },
    },
    legend: {
      show: showLegend ?? series.length > 1,
      position: legendPosition,
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      markers: { size: 5 },
      formatter: escapeHtml,
    },
    tooltip: { theme: tooltipTheme, custom: tooltip },
  };
};

/** Points on two numeric axes, e.g. latency against load, one point per node. */
export const ScatterChart = ({
  ariaLabel,
  height = 320,
  width = '100%',
  ...props
}: ScatterChartProps) => {
  const base = useXYOptions(props);
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'scatter' },
    markers: { size: 6, strokeWidth: 0, hover: { sizeOffset: 2 } },
  };
  return (
    <ApexChart
      type="scatter"
      options={options}
      series={props.series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
    />
  );
};

/** A scatter chart whose bubble size carries a third measure (`z`), e.g. request volume. */
export const BubbleChart = ({
  sizeTitle = 'Size',
  formatSize = formatNumber,
  ariaLabel,
  height = 320,
  width = '100%',
  ...props
}: BubbleChartProps) => {
  const { palette } = useChartTheme();
  const base = useXYOptions(props, {
    // Room for the bubbles at the edges of the plot.
    pad: 0.08,
    extraRows: (point) => [[sizeTitle, formatSize(point.z)]],
  });
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bubble' },
    plotOptions: { bubble: { minBubbleRadius: 4 } },
    // Translucent bubbles, outlined in their own color (ApexCharts' white
    // outline glares on the dark themes), keep the overlapping ones readable.
    fill: { opacity: 0.55 },
    markers: { strokeWidth: 1, strokeColors: props.colors ?? palette },
  };
  return (
    <ApexChart
      type="bubble"
      options={options}
      series={props.series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
    />
  );
};
