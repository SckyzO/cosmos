import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type LineAreaChartProps = ChartSize & {
  series: { name: string; data: number[] }[];
  categories: (string | number)[];
};

export const LineAreaChart = ({
  series,
  categories,
  height = 280,
  width = '100%',
}: LineAreaChartProps) => {
  const { grid, axisLabels, palette } = useChartTheme();
  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: palette,
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } },
    grid,
    xaxis: {
      categories,
      labels: axisLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: axisLabels },
    legend: { show: false },
    tooltip: { theme: 'dark' },
  };
  return (
    <ReactApexChart type="area" options={options} series={series} height={height} width={width} />
  );
};
