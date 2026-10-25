import type { ApexOptions } from 'apexcharts';
import 'apexcharts/treemap';
import { ApexChart } from './ApexChart';
import { useStableCallback, useValueFormat } from './formatters';
import { readableOn, useChartTheme } from './theme';
import type { ChartBaseProps, ChartEmptyProps } from './types';

export type TreemapDatum = { x: string; y: number };

export type TreemapChartProps = ChartBaseProps &
  ChartEmptyProps & {
    series: { name?: string; data: TreemapDatum[] }[];
    /**
     * Override the default Cosmos palette. Tiles are colored by name, in the
     * order the names first appear: one name keeps its color in every group.
     */
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
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 320,
  width = '100%',
}: TreemapChartProps) => {
  const { palette, surface, tooltipTheme } = useChartTheme();
  const tileColors = colors ?? palette;
  const format = useValueFormat(formatValue);
  // One color per name, so a name has the same color in every group. Tiles
  // carry it as `fillColor`; `distributed` alone colors by position.
  const colorByName = new Map<string, string>();
  for (const { data } of series) {
    for (const { x } of data) {
      if (!colorByName.has(x)) colorByName.set(x, tileColors[colorByName.size % tileColors.length]);
    }
  }
  const colored = series.map((item) => ({
    ...item,
    data: item.data.map((datum) => ({ ...datum, fillColor: colorByName.get(datum.x) })),
  }));
  // A tile's label color, from the color of its name.
  const tileLabelColor = useStableCallback(
    ({ seriesIndex, dataPointIndex }: { seriesIndex: number; dataPointIndex: number }) =>
      readableOn(colorByName.get(series[seriesIndex]?.data[dataPointIndex]?.x ?? '') ?? '')
  );
  const options: ApexOptions = {
    chart: { type: 'treemap', fontFamily: 'inherit', toolbar: { show: false } },
    colors: tileColors,
    legend: { show: false },
    // The gap between tiles is the card's color: ApexCharts' white glares in dark themes.
    stroke: { colors: [surface] },
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
      series={colored}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      apexOptions={apexOptions}
      emptyMessage={emptyMessage}
    />
  );
};
