import type { ApexOptions } from 'apexcharts';
import 'apexcharts/boxPlot';
import 'apexcharts/features/legend';
import ReactApexChart from 'react-apexcharts/core';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import { tooltipHtml } from './tooltip';
import type { ChartSize } from './types';

export type BoxPlotChartOrientation = 'vertical' | 'horizontal';

/** One box, the five-number summary of a distribution. */
export type BoxPlotSummary = [min: number, q1: number, median: number, q3: number, max: number];

export type BoxPlotChartProps = ChartSize & {
  /** One summary per category, in the order of `categories`. */
  series: { name: string; data: BoxPlotSummary[] }[];
  categories: string[];
  /** `vertical` (default) draws boxes upward; `horizontal` draws them rightward. */
  orientation?: BoxPlotChartOrientation;
  /** Override the default Cosmos palette, one color per series. */
  colors?: string[];
  /** Format the value axis labels and the tooltip values. */
  formatValue?: (value: number) => string;
  /** Show the legend (auto-true when 2+ series). */
  showLegend?: boolean;
};

// Top to bottom, the way a vertical box reads.
const ROWS = [
  ['Max', 4],
  ['Q3', 3],
  ['Median', 2],
  ['Q1', 1],
  ['Min', 0],
] as const;

/** Distributions per category (min, quartiles, median, max), e.g. response times per service. */
export const BoxPlotChart = ({
  series,
  categories,
  orientation = 'vertical',
  colors,
  formatValue,
  showLegend,
  height = 320,
  width = '100%',
}: BoxPlotChartProps) => {
  const { grid, axisLabels, palette } = useChartTheme();
  const horizontal = orientation === 'horizontal';
  const seriesColors = colors ?? palette;
  const valueFormatter = formatValue ?? ((v: number) => String(v));

  // One labels object per axis: ApexCharts writes formatters onto them.
  // Axis labels are SVG text and stay unescaped.
  const categoryLabels = () => ({ ...axisLabels });
  const valueLabels = () => ({
    ...axisLabels,
    formatter: (value: string | number) => valueFormatter(Number(value)),
  });

  const options: ApexOptions = {
    chart: {
      type: 'boxPlot',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: seriesColors,
    plotOptions: {
      bar: { horizontal, columnWidth: '50%', barHeight: '50%' },
      // Both halves take the series color: a translucent fill, and an outline,
      // median and whiskers drawn in the full color (ApexCharts' defaults are
      // fixed colors, with a near-black stroke lost on the dark themes).
      boxPlot: { colors: { upper: seriesColors, lower: seriesColors } },
    },
    fill: { opacity: 0.35 },
    stroke: { width: 1.5, colors: seriesColors },
    grid,
    xaxis: {
      labels: horizontal ? valueLabels() : categoryLabels(),
      axisBorder: { show: false },
      axisTicks: { show: false },
      // The x-axis tooltip is HTML and repeats the tooltip title.
      tooltip: { enabled: false },
    },
    yaxis: { labels: horizontal ? categoryLabels() : valueLabels() },
    // Horizontal, the value labels sit side by side and run into each other
    // on a phone: keep three of them.
    responsive: horizontal ? [{ breakpoint: 640, options: { xaxis: { tickAmount: 2 } } }] : [],
    legend: {
      show: showLegend ?? series.length > 1,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      markers: { size: 5 },
      formatter: (name) => escapeHtml(name),
    },
    // ApexCharts' own box plot tooltip prints the values raw. This one is
    // HTML too: tooltipHtml escapes the category, the series name and values.
    tooltip: {
      theme: 'dark',
      custom: ({ seriesIndex, dataPointIndex }) => {
        const { name, data } = series[seriesIndex];
        const summary = data[dataPointIndex];
        return tooltipHtml({
          title: categories[dataPointIndex],
          series:
            series.length > 1
              ? { name, color: seriesColors[seriesIndex % seriesColors.length] }
              : undefined,
          rows: ROWS.map(([label, index]) => [label, valueFormatter(summary[index])]),
        });
      },
    },
  };

  const chartSeries = series.map(({ name, data }) => ({
    name,
    data: data.map((y, index) => ({ x: categories[index], y })),
  }));

  return (
    <ReactApexChart
      type="boxPlot"
      options={options}
      series={chartSeries}
      height={height}
      width={width}
    />
  );
};
