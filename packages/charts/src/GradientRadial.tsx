import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type GradientRadialProps = ChartSize & {
  value: number;
  label?: string;
};

export const GradientRadial = ({
  value,
  label = 'Score',
  height = 280,
  width = '100%',
}: GradientRadialProps) => {
  const { brand } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit' },
    colors: [brand],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#10b981'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    plotOptions: {
      radialBar: {
        hollow: { size: '70%' },
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
