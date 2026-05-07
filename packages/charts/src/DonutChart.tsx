import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type DonutChartProps = ChartSize & {
  series: number[];
  labels: string[];
  /** Whether to show the right-side legend (default: bottom). */
  rightLegend?: boolean;
};

export const DonutChart = ({
  series,
  labels,
  rightLegend = false,
  height = 280,
  width = '100%',
}: DonutChartProps) => {
  const { palette } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    colors: palette,
    labels,
    legend: { position: rightLegend ? 'right' : 'bottom' },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Total' } } },
      },
    },
  };
  return (
    <ReactApexChart type="donut" options={options} series={series} height={height} width={width} />
  );
};

export const DonutRightLegend = (props: Omit<DonutChartProps, 'rightLegend'>) => (
  <DonutChart {...props} rightLegend />
);
