import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type StrokedGaugeProps = ChartSize & {
  value: number;
  label?: string;
};

export const StrokedGauge = ({
  value,
  label = '',
  height = 280,
  width = '100%',
}: StrokedGaugeProps) => {
  const { brand } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit' },
    colors: [brand],
    stroke: { lineCap: 'round', dashArray: 4 },
    plotOptions: {
      radialBar: {
        hollow: { size: '70%' },
        track: { background: 'rgba(150,150,150,0.15)', strokeWidth: '100%' },
        dataLabels: {
          name: { fontSize: '12px', offsetY: -10 },
          value: { fontSize: '32px', fontWeight: 700, formatter: (v) => `${v}%` },
        },
      },
    },
    labels: [label],
  };
  return (
    <ReactApexChart
      type="radialBar"
      options={options}
      series={[value]}
      height={height}
      width={width}
    />
  );
};
