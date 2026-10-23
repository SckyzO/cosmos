import type { ApexOptions } from 'apexcharts';
import 'apexcharts/line';
import 'apexcharts/features/legend';
import { ApexChart } from './ApexChart';
import { seriesTitle, useCategoryTitle } from './formatters';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type LineAreaChartProps = ChartBaseProps & {
  series: { name: string; data: number[] }[];
  categories: (string | number)[];
  /** Show the legend (auto-true when 2+ series). */
  showLegend?: boolean;
};

export const LineAreaChart = ({
  series,
  categories,
  ariaLabel,
  height = 280,
  width = '100%',
  showLegend,
}: LineAreaChartProps) => {
  const { grid, axisLabels, palette, tooltipTheme } = useChartTheme();
  const legendVisible = showLegend ?? series.length > 1;
  const categoryTitle = useCategoryTitle(categories);
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
      formatter: escapeHtml,
    },
    // The tooltip and the legend are HTML: escape the category and the series name.
    tooltip: {
      theme: tooltipTheme,
      x: { formatter: categoryTitle },
      y: { title: { formatter: seriesTitle } },
    },
  };
  return (
    <ApexChart
      type="area"
      options={options}
      series={series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
    />
  );
};
