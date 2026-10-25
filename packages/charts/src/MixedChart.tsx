import type { ApexOptions } from 'apexcharts';
import 'apexcharts/line';
import 'apexcharts/bar';
import 'apexcharts/features/legend';
import { ApexChart } from './ApexChart';
import { seriesTitle, useCategoryTitle, useStableCallback } from './formatters';
import { escapeHtml } from './escape';
import { chartLegend } from './legend';
import { useChartTheme } from './theme';
import type {
  ChartAxisTitleProps,
  ChartBaseProps,
  ChartEmptyProps,
  ChartLegendProps,
} from './types';

export type MixedChartAxis = 'left' | 'right';

export type MixedChartSeries = {
  name: string;
  /** `column` draws bars, `line` draws a line over them. */
  type: 'line' | 'column';
  data: number[];
  /** The y axis the series is read on. Any `right` series adds a second axis. Default `left`. */
  axis?: MixedChartAxis;
};

export type MixedChartProps = ChartBaseProps &
  ChartEmptyProps &
  ChartLegendProps &
  ChartAxisTitleProps & {
    /** Lines and columns on one category axis. Names must be unique: each y axis finds its series by name. */
    series: MixedChartSeries[];
    categories: (string | number)[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /**
     * Format the left axis labels and the tooltip values of its series.
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatValue?: (value: number) => string;
    /**
     * Format the right axis labels and the tooltip values of its series.
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatRightValue?: (value: number) => string;
    /**
     * Title beside the right axis. `yTitle` names the left one. With one axis only, that axis
     * takes the title of its side.
     */
    yRightTitle?: string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

const SIDES: MixedChartAxis[] = ['left', 'right'];
const axisOf = (s: MixedChartSeries): MixedChartAxis => s.axis ?? 'left';

export const MixedChart = ({
  series,
  categories,
  colors,
  formatValue,
  formatRightValue,
  xTitle,
  yTitle,
  yRightTitle,
  showLegend,
  legendPosition = 'top',
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 320,
  width = '100%',
}: MixedChartProps) => {
  const { grid, axisLabels, axisTitle, palette, tooltipTheme } = useChartTheme();
  const legendVisible = showLegend ?? series.length > 1;
  const formatters = { left: formatValue, right: formatRightValue };
  const titles = { left: yTitle, right: yRightTitle };
  const categoryTitle = useCategoryTitle(categories);
  // Each value in the format of its series' axis. Read on hover: a stable
  // function, so a parent render does not redraw the chart.
  const tooltipValue = useStableCallback((v: number, opts?: { seriesIndex: number }) => {
    const s = opts && series[opts.seriesIndex];
    const format = (s && formatters[axisOf(s)]) ?? String;
    return escapeHtml(format(Number(v)));
  });

  const usedSides = SIDES.filter((side) => series.some((s) => axisOf(s) === side));
  const sides = usedSides.length > 0 ? usedSides : SIDES.slice(0, 1);
  // One labels object per axis: ApexCharts mutates them. With two axes, each
  // one lists its series by name; a single axis reads every series.
  const yaxis: ApexOptions['yaxis'] = sides.map((side) => ({
    seriesName:
      sides.length > 1 ? series.filter((s) => axisOf(s) === side).map((s) => s.name) : undefined,
    opposite: side === 'right',
    title: axisTitle(titles[side]),
    labels: { ...axisLabels, formatter: formatters[side] },
  }));

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: colors ?? palette,
    dataLabels: { enabled: false },
    // Lines only: columns have no stroke. monotoneCubic stays smooth without
    // overshooting the samples, so a latency line never dips below its data.
    stroke: { width: series.map((s) => (s.type === 'line' ? 3 : 0)), curve: 'monotoneCubic' },
    plotOptions: {
      bar: { columnWidth: '55%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    grid,
    xaxis: {
      categories,
      title: axisTitle(xTitle),
      labels: { ...axisLabels },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis,
    legend: {
      ...chartLegend({
        show: legendVisible,
        position: legendPosition,
        color: axisLabels.style.colors,
      }),
      // ApexCharts stacks the series of each y axis in a column of their own:
      // keep one row, like the other charts.
      clusterGroupedSeries: false,
    },
    // The tooltip is HTML: escape the category, the series names and the values.
    tooltip: {
      theme: tooltipTheme,
      x: { formatter: categoryTitle },
      y: { formatter: tooltipValue, title: { formatter: seriesTitle } },
    },
    fill: { opacity: 1 },
  };

  return (
    <ApexChart
      type="line"
      options={options}
      series={series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      apexOptions={apexOptions}
      emptyMessage={emptyMessage}
    />
  );
};
