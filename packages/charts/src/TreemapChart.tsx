import type { ApexOptions } from 'apexcharts';
import 'apexcharts/treemap';
import ReactApexChart from 'react-apexcharts/core';
import { readableOn, useChartTheme } from './theme';
import type { ChartSize } from './types';

export type TreemapDatum = { x: string; y: number };

export type TreemapChartProps = ChartSize & {
  series: { name?: string; data: TreemapDatum[] }[];
};

export const TreemapChart = ({ series, height = 320, width = '100%' }: TreemapChartProps) => {
  const { palette, tooltipTheme } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'treemap', fontFamily: 'inherit', toolbar: { show: false } },
    colors: palette,
    legend: { show: false },
    tooltip: { theme: tooltipTheme },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        // Tiles are not all dark: white on the green or amber was under 3:1.
        // ApexCharts reads this per series, with the tile's index in the call.
        colors: series.map(
          () =>
            ({ dataPointIndex }: { dataPointIndex: number }) =>
              readableOn(palette[dataPointIndex % palette.length])
        ),
      },
    },
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
