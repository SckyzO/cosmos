import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import { ApexChart } from './ApexChart';
import { percent, useStableCallback } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type RadialBarChartProps = ChartBaseProps & {
  series: number[];
  labels: string[];
};

export const RadialBarChart = ({
  series,
  labels,
  ariaLabel,
  height = 320,
  width = '100%',
}: RadialBarChartProps) => {
  const { palette, text, textMuted } = useChartTheme();
  const average = useStableCallback(
    () => `${Math.round(series.reduce((a, b) => a + b, 0) / series.length)}%`
  );
  const options: ApexOptions = {
    // foreColor colors the center value (ApexCharts defaults to dark gray).
    chart: { type: 'radialBar', fontFamily: 'inherit', foreColor: text },
    colors: palette,
    labels,
    plotOptions: {
      radialBar: {
        track: { background: 'rgba(150,150,150,0.15)' },
        dataLabels: {
          name: { fontSize: '12px', color: textMuted },
          value: { fontSize: '14px', formatter: percent },
          total: {
            show: true,
            label: 'Avg',
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
    />
  );
};
