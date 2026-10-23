import type { ApexOptions } from 'apexcharts';
import 'apexcharts/line';
import 'apexcharts/features/legend';
import { ApexChart } from './ApexChart';
import { seriesTitle, useCategoryTitle, useOptionalValueFormat } from './formatters';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import type { ChartBaseProps, ChartLegendProps } from './types';

export type LineAreaChartProps = ChartBaseProps &
  ChartLegendProps & {
    series: { name: string; data: number[] }[];
    categories: (string | number)[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /**
     * Format the y-axis labels and the tooltip values.
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatValue?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

export const LineAreaChart = ({
  series,
  categories,
  colors,
  formatValue,
  ariaLabel,
  height = 280,
  width = '100%',
  showLegend,
  legendPosition = 'top',
}: LineAreaChartProps) => {
  const { grid, axisLabels, palette, tooltipTheme } = useChartTheme();
  const legendVisible = showLegend ?? series.length > 1;
  const categoryTitle = useCategoryTitle(categories);
  const format = useOptionalValueFormat(formatValue);
  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: colors ?? palette,
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
    yaxis: { labels: { ...axisLabels, formatter: format.axis } },
    legend: {
      show: legendVisible,
      position: legendPosition,
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      markers: { size: 5 },
      formatter: escapeHtml,
    },
    // The tooltip and the legend are HTML: escape the category, the series
    // name and the formatted value.
    tooltip: {
      theme: tooltipTheme,
      x: { formatter: categoryTitle },
      y: { formatter: format.tooltip, title: { formatter: seriesTitle } },
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
