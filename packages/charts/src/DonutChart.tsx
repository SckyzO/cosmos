import type { ApexOptions } from 'apexcharts';
import 'apexcharts/donut';
import 'apexcharts/features/legend';
import ReactApexChart from 'react-apexcharts/core';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type DonutChartProps = ChartSize & {
  series: number[];
  labels: string[];
  /** Whether to show the right-side legend (default: bottom). */
  rightLegend?: boolean;
};

export const DonutChart = ({
  series,
  labels,
  rightLegend = false,
  height = 280,
  width = '100%',
}: DonutChartProps) => {
  const { palette, text, textMuted, tooltipTheme } = useChartTheme();
  const options: ApexOptions = {
    // foreColor colors the legend and the center value (ApexCharts defaults to dark gray).
    chart: { type: 'donut', fontFamily: 'inherit', foreColor: text },
    colors: palette,
    labels,
    // The legend and the tooltip are HTML: escape the labels.
    legend: { position: rightLegend ? 'right' : 'bottom', formatter: (name) => escapeHtml(name) },
    tooltip: {
      theme: tooltipTheme,
      y: { title: { formatter: (name) => `${escapeHtml(name)}: ` } },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: { show: true, total: { show: true, label: 'Total', color: textMuted } },
        },
      },
    },
  };
  return (
    <ReactApexChart type="donut" options={options} series={series} height={height} width={width} />
  );
};

export const DonutRightLegend = (props: Omit<DonutChartProps, 'rightLegend'>) => (
  <DonutChart {...props} rightLegend />
);
