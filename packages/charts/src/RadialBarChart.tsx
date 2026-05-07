import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type RadialBarChartProps = ChartSize & {
  series: number[];
  labels: string[];
};

export const RadialBarChart = ({
  series,
  labels,
  height = 320,
  width = '100%',
}: RadialBarChartProps) => {
  const { palette } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit' },
    colors: palette,
    labels,
    plotOptions: {
      radialBar: {
        track: { background: 'rgba(150,150,150,0.15)' },
        dataLabels: {
          name: { fontSize: '12px' },
          value: { fontSize: '14px', formatter: (v) => `${v}%` },
          total: {
            show: true,
            label: 'Avg',
            formatter: () => `${Math.round(series.reduce((a, b) => a + b, 0) / series.length)}%`,
          },
        },
      },
    },
  };
  return (
    <ReactApexChart
      type="radialBar"
      options={options}
      series={series}
      height={height}
      width={width}
    />
  );
};
