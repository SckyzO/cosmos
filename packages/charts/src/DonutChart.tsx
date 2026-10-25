import { useMemo } from 'react';
import type { ApexOptions } from 'apexcharts';
import 'apexcharts/donut';
import 'apexcharts/features/legend';
import { ApexChart } from './ApexChart';
import { seriesTitle, useValueFormat } from './formatters';
import { chartLegend } from './legend';
import { useChartTheme } from './theme';
import type { ChartBaseProps, ChartEmptyProps, ChartLegendProps } from './types';

export type DonutChartProps = ChartBaseProps &
  ChartEmptyProps &
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
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 280,
  width = '100%',
}: DonutChartProps) => {
  const { palette, surface, text, textMuted, tooltipTheme } = useChartTheme();
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
    legend: chartLegend({ position: legendPosition, alignRight: false }),
    tooltip: {
      theme: tooltipTheme,
      // ApexCharts fills a donut's tooltip with the slice color under white
      // text (2.6:1 on the success green): keep the themed body of the other
      // charts, the slice color stays on the marker.
      fillSeriesColor: false,
      y: { formatter: format.tooltip, title: { formatter: seriesTitle } },
    },
    // The gap between slices is the card's color: ApexCharts' white glares in dark themes.
    stroke: { colors: [surface] },
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
      apexOptions={apexOptions}
      emptyMessage={emptyMessage}
    />
  );
};
