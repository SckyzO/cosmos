import type { ApexOptions } from 'apexcharts';
import 'apexcharts/treemap';
import { ApexChart } from './ApexChart';
import { useStableCallback } from './formatters';
import { readableOn, useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type TreemapDatum = { x: string; y: number };

export type TreemapChartProps = ChartBaseProps & {
  series: { name?: string; data: TreemapDatum[] }[];
};

export const TreemapChart = ({
  series,
  ariaLabel,
  height = 320,
  width = '100%',
}: TreemapChartProps) => {
  const { palette, tooltipTheme } = useChartTheme();
  // A tile's label color, from the palette also passed as `colors`.
  const tileLabelColor = useStableCallback(({ dataPointIndex }: { dataPointIndex: number }) =>
    readableOn(palette[dataPointIndex % palette.length])
  );
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
        colors: series.map(() => tileLabelColor),
      },
    },
    plotOptions: { treemap: { distributed: true, enableShades: false } },
  };
  return (
    <ApexChart
      type="treemap"
      options={options}
      series={series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
    />
  );
};
