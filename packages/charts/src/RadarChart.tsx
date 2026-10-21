import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radar';
import 'apexcharts/features/legend';
import ReactApexChart from 'react-apexcharts/core';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type RadarChartProps = ChartSize & {
  /** One polygon per series; one value per category, in the same order. */
  series: { name: string; data: number[] }[];
  /** The axes, clockwise from the top. */
  categories: string[];
  /** Override the default Cosmos palette. */
  colors?: string[];
  /** Format the scale labels and the tooltip values. */
  formatValue?: (value: number) => string;
  /** Show the legend (auto-true when 2+ series). */
  showLegend?: boolean;
  /** Top of the scale, e.g. 100 for scores. Default: rounded up from the data. */
  max?: number;
};

export const RadarChart = ({
  series,
  categories,
  colors,
  formatValue,
  showLegend,
  max,
  height = 340,
  width = '100%',
}: RadarChartProps) => {
  const { grid, axisLabels, palette } = useChartTheme();
  const legendVisible = showLegend ?? series.length > 1;
  const valueFormatter = formatValue ?? ((v: number) => String(v));

  const options: ApexOptions = {
    chart: {
      type: 'radar',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: colors ?? palette,
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    fill: { opacity: 0.15 },
    // The tooltip is hit-tested on the markers: keep them.
    markers: { size: 3, strokeWidth: 0 },
    // ApexCharts reserves part of an axis name's width only, so on a narrow
    // chart the names at the side vertices ran off the edge. No effect on a
    // wide chart: its size follows the height.
    grid: { padding: { left: 24, right: 24 } },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: grid?.borderColor,
          connectorColors: grid?.borderColor,
          fill: { colors: ['transparent'] },
        },
      },
    },
    // One labels object per axis: ApexCharts mutates them.
    xaxis: { categories, labels: { ...axisLabels } },
    yaxis: {
      max,
      labels: { ...axisLabels, formatter: (val) => valueFormatter(Number(val)) },
    },
    legend: {
      show: legendVisible,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      // The default stroke outlines the swatches in white, glaring in dark themes.
      markers: { size: 5, strokeWidth: 0 },
      formatter: (name) => escapeHtml(name),
    },
    // The tooltip and the legend are HTML: escape names, categories and
    // values. The title is the hovered axis.
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (v, opts) =>
          escapeHtml(opts === undefined ? v : (categories[opts.dataPointIndex] ?? v)),
      },
      y: {
        formatter: (v) => escapeHtml(valueFormatter(Number(v))),
        title: { formatter: (name) => `${escapeHtml(name)}: ` },
      },
    },
  };

  return (
    <ReactApexChart type="radar" options={options} series={series} height={height} width={width} />
  );
};
