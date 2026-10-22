import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import ReactApexChart from 'react-apexcharts/core';
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
  const { brand, text, textMuted } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit', foreColor: text },
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
        track: { background: 'rgba(150,150,150,0.15)' },
        dataLabels: {
          name: { fontSize: '12px', offsetY: -10, color: textMuted },
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
