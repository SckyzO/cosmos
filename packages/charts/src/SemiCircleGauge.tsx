import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type SemiCircleGaugeProps = ChartSize & {
  value: number;
  label?: string;
  color?: string;
};

export const SemiCircleGauge = ({
  value,
  label = '',
  color,
  height = 200,
  width = '100%',
}: SemiCircleGaugeProps) => {
  const { brand } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit', sparkline: { enabled: true } },
    colors: [color ?? brand],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: { background: 'rgba(150,150,150,0.15)', strokeWidth: '100%' },
        dataLabels: {
          name: { offsetY: -10, fontSize: '12px' },
          value: { offsetY: -45, fontSize: '24px', fontWeight: 700, formatter: (v) => `${v}%` },
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
