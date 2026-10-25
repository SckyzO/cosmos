import { useMemo } from 'react';
import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import { ApexChart } from './ApexChart';
import { percent, useStableCallback, useValueFormat } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps, ChartEmptyProps } from './types';

export type RadialBarChartProps = ChartBaseProps &
  ChartEmptyProps & {
    series: number[];
    labels: string[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /**
     * Format the ring values and their average, on the 0–100 scale of the rings. Default: `78%`.
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatValue?: (value: number) => string;
  };

export const RadialBarChart = ({
  series,
  labels,
  colors,
  formatValue = percent,
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 320,
  width = '100%',
}: RadialBarChartProps) => {
  const { palette, text, textMuted, track } = useChartTheme();
  const format = useValueFormat(formatValue);
  // Reads the series, which ApexCharts also gets: a new series redraws the
  // chart, which then calls the latest `mean`.
  const mean = useStableCallback(() =>
    Math.round(series.reduce((a, b) => a + b, 0) / series.length)
  );
  const average = useMemo(() => () => format.axis(mean()), [format, mean]);
  const options: ApexOptions = {
    // foreColor colors the center value (ApexCharts defaults to dark gray).
    chart: { type: 'radialBar', fontFamily: 'inherit', foreColor: text },
    colors: colors ?? palette,
    labels,
    plotOptions: {
      radialBar: {
        track: { background: track },
        dataLabels: {
          // The value large and bold over its small muted label, as on the
          // gauges. The total takes the label's own style, not its default.
          name: { fontSize: '12px', fontWeight: 600, color: textMuted, offsetY: -10 },
          value: { fontSize: '22px', fontWeight: 700, offsetY: 4, formatter: format.axis },
          total: {
            show: true,
            label: 'Avg',
            fontSize: '12px',
            fontWeight: 600,
            color: textMuted,
            formatter: average,
          },
        },
      },
    },
  };
  return (
    <ApexChart
      type="radialBar"
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
