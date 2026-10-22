import type { ApexOptions } from 'apexcharts';
import 'apexcharts/line';
import 'apexcharts/features/legend';
import ReactApexChart from 'react-apexcharts/core';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type LineAreaChartProps = ChartSize & {
  series: { name: string; data: number[] }[];
  categories: (string | number)[];
  /** Show the legend (auto-true when 2+ series). */
  showLegend?: boolean;
};

export const LineAreaChart = ({
  series,
  categories,
  height = 280,
  width = '100%',
  showLegend,
}: LineAreaChartProps) => {
  const { grid, axisLabels, palette } = useChartTheme();
  const legendVisible = showLegend ?? series.length > 1;
  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: palette,
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } },
    grid,
    // One labels object per axis: ApexCharts writes the x-axis category
    // formatter onto it, which blanked the y labels on the next update.
    xaxis: {
      categories,
      labels: { ...axisLabels },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { ...axisLabels } },
    legend: {
      show: legendVisible,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      markers: { size: 5 },
      formatter: (name) => escapeHtml(name),
    },
    // The tooltip and the legend are HTML: escape the category and the series
    // name. ApexCharts hands the x formatter the point's position on the axis
    // (1, 2, …), not its category, so read the category back by index.
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (v, opts) =>
          escapeHtml(opts === undefined ? v : (categories[opts.dataPointIndex] ?? v)),
      },
      y: { title: { formatter: (name) => `${escapeHtml(name)}: ` } },
    },
  };
  return (
    <ReactApexChart type="area" options={options} series={series} height={height} width={width} />
  );
};
