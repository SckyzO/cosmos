import { useMemo } from 'react';
import type { ApexOptions } from 'apexcharts';
import 'apexcharts/donut';
import 'apexcharts/features/legend';
import { ApexChart } from './ApexChart';
import { escapeHtml } from './escape';
import { seriesTitle, useValueFormat } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps, ChartLegendProps } from './types';

export type DonutChartProps = ChartBaseProps &
  ChartLegendProps & {
    series: number[];
    labels: string[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /**
     * Format the slice values in the center and the tooltip, and the total.
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatValue?: (value: number) => string;
  };

export const DonutChart = ({
  series,
  labels,
  colors,
  formatValue,
  legendPosition = 'bottom',
  ariaLabel,
  height = 280,
  width = '100%',
}: DonutChartProps) => {
  const { palette, text, textMuted, tooltipTheme } = useChartTheme();
  const format = useValueFormat(formatValue);
  // ApexCharts' default total, the sum of the visible slices, formatted.
  const total = useMemo(
    () => (w: { globals: { seriesTotals: number[] } }) =>
      format.axis(w.globals.seriesTotals.reduce((a, b) => a + b, 0)),
    [format]
  );
  const options: ApexOptions = {
    // foreColor colors the legend and the center value (ApexCharts defaults to dark gray).
    chart: { type: 'donut', fontFamily: 'inherit', foreColor: text },
    colors: colors ?? palette,
    labels,
    // The legend and the tooltip are HTML: escape the labels and the values.
    legend: { position: legendPosition, formatter: escapeHtml },
    tooltip: {
      theme: tooltipTheme,
      y: { formatter: format.tooltip, title: { formatter: seriesTitle } },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            value: { formatter: format.axis },
            total: { show: true, label: 'Total', color: textMuted, formatter: total },
          },
        },
      },
    },
  };
  return (
    <ApexChart
      type="donut"
      options={options}
      series={series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
    />
  );
};
