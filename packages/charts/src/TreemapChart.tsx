import { useMemo } from 'react';
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
    /**
     * Write each tile's value, formatted, under its name. Default off: the name alone, and the
     * value in the tooltip.
     */
    showValues?: boolean;
  };

export const TreemapChart = ({
  series,
  colors,
  formatValue,
  showValues = false,
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 320,
  width = '100%',
}: TreemapChartProps) => {
  const { palette, surface, text, track, tooltipTheme } = useChartTheme();
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
  // A tile's label is its name; with `showValues` a second line, the value
  // ApexCharts hands the formatter. Labels are SVG text: no escaping. Stable,
  // unless `formatValue` changes, so a parent render does not redraw the chart.
  const tileLabel = useMemo<NonNullable<NonNullable<ApexOptions['dataLabels']>['formatter']>>(
    () => (name, opts) => [String(name), format.axis(opts?.value ?? 0)],
    [format]
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
      ...(showValues ? { formatter: tileLabel } : {}),
    },
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false,
        // The name of a group, on the corner of its first tile: the card's
        // colors, where ApexCharts' is a translucent black plate.
        seriesTitle: {
          borderColor: track,
          style: { background: surface, color: text, fontSize: '12px', fontWeight: 600 },
        },
      },
    },
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
