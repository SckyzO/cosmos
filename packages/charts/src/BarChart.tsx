import type { ApexOptions } from 'apexcharts';
import 'apexcharts/bar';
import 'apexcharts/features/legend';

import { ApexChart } from './ApexChart';
import { axisTitle } from './axisTitle';
import { escapeHtml } from './escape';
import { seriesTitle, useValueFormat } from './formatters';
import { chartLegend } from './legend';
import { useChartTheme } from './theme';
import type {
  ChartAxisTitleProps,
  ChartBaseProps,
  ChartEmptyProps,
  ChartLegendProps,
} from './types';

export type BarChartOrientation = 'vertical' | 'horizontal';

export type BarChartProps = ChartBaseProps &
  ChartEmptyProps &
  ChartLegendProps &
  ChartAxisTitleProps & {
    series: { name: string; data: number[] }[];
    categories: (string | number)[];
    /** `vertical` (default) draws bars upward; `horizontal` draws them rightward. */
    orientation?: BarChartOrientation;
    /** Stack multi-series bars instead of grouping them side-by-side. */
    stacked?: boolean;
    /** Override the default Cosmos palette. */
    colors?: string[];
    /**
     * Format the numeric axis labels (and tooltip values).
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatValue?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
    /** Tailwind border-radius applied to bar tops. Default 4. */
    borderRadius?: number;
  };

export const BarChart = ({
  series,
  categories,
  orientation = 'vertical',
  stacked = false,
  colors,
  formatValue,
  xTitle,
  yTitle,
  showLegend,
  legendPosition = 'top',
  borderRadius = 4,
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 320,
  width = '100%',
}: BarChartProps) => {
  const { grid, axisLabels, palette, tooltipTheme } = useChartTheme();
  const horizontal = orientation === 'horizontal';
  const legendVisible = showLegend ?? series.length > 1;

  const format = useValueFormat(formatValue);

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
      stacked,
      fontFamily: 'inherit',
    },
    colors: colors ?? palette,
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius,
        borderRadiusApplication: 'end',
        columnWidth: '55%',
      },
    },
    grid,
    // The titles name the axes as drawn: `xTitle` under the horizontal one,
    // whichever of categories and values it carries.
    xaxis: {
      categories,
      title: axisTitle(xTitle, axisLabels.style.colors),
      labels: {
        ...axisLabels,
        formatter: horizontal ? format.axis : undefined,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: axisTitle(yTitle, axisLabels.style.colors),
      labels: {
        ...axisLabels,
        formatter: horizontal ? undefined : format.axis,
      },
    },
    legend: chartLegend({
      show: legendVisible,
      position: legendPosition,
      color: axisLabels.style.colors,
    }),
    // Tooltips and the legend are HTML: escape names, categories and values.
    tooltip: {
      theme: tooltipTheme,
      x: { formatter: escapeHtml },
      y: {
        formatter: format.tooltip,
        title: { formatter: seriesTitle },
      },
    },
    fill: { opacity: 1 },
    stroke: { show: false },
  };

  return (
    <ApexChart
      type="bar"
      options={options}
      series={series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      apexOptions={apexOptions}
      emptyMessage={emptyMessage}
    />
  );
};
