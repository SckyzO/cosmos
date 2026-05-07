import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type TreemapDatum = { x: string; y: number };

export type TreemapChartProps = ChartSize & {
  series: { name?: string; data: TreemapDatum[] }[];
};

export const TreemapChart = ({ series, height = 320, width = '100%' }: TreemapChartProps) => {
  const { palette } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'treemap', fontFamily: 'inherit', toolbar: { show: false } },
    colors: palette,
    legend: { show: false },
    dataLabels: { enabled: true, style: { fontSize: '12px' } },
    plotOptions: { treemap: { distributed: true, enableShades: false } },
  };
  return (
    <ReactApexChart
      type="treemap"
      options={options}
      series={series}
      height={height}
      width={width}
    />
  );
};
