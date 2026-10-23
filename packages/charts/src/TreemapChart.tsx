import type { ApexOptions } from 'apexcharts';
import 'apexcharts/treemap';
import { ApexChart } from './ApexChart';
import { useStableCallback, useValueFormat } from './formatters';
import { readableOn, useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type TreemapDatum = { x: string; y: number };

export type TreemapChartProps = ChartBaseProps & {
  series: { name?: string; data: TreemapDatum[] }[];
  /** Override the default Cosmos palette. */
  colors?: string[];
  /**
   * Format the tooltip values.
   * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
   */
  formatValue?: (value: number) => string;
};

export const TreemapChart = ({
  series,
  colors,
  formatValue,
  ariaLabel,
  height = 320,
  width = '100%',
}: TreemapChartProps) => {
  const { palette, tooltipTheme } = useChartTheme();
  const tileColors = colors ?? palette;
  const format = useValueFormat(formatValue);
  // A tile's label color, from the colors also passed as `colors`.
  const tileLabelColor = useStableCallback(({ dataPointIndex }: { dataPointIndex: number }) =>
    readableOn(tileColors[dataPointIndex % tileColors.length])
  );
  const options: ApexOptions = {
    chart: { type: 'treemap', fontFamily: 'inherit', toolbar: { show: false } },
    colors: tileColors,
    legend: { show: false },
    // The tooltip is HTML: escape the formatted value.
    tooltip: { theme: tooltipTheme, y: { formatter: format.tooltip } },
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
