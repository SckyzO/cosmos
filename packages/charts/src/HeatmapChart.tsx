import type { ApexOptions } from 'apexcharts';
import 'apexcharts/heatmap';
import 'apexcharts/features/legend';
import { ApexChart } from './ApexChart';
import { seriesTitle, useCategoryTitle, useValueFormat } from './formatters';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import type { ChartBaseProps, ChartEmptyProps, ChartLegendProps } from './types';

export type HeatmapColorRange = {
  /** Lowest value of the range, inclusive. */
  from: number;
  /** Highest value of the range, inclusive. A value on a shared bound takes the later range. */
  to: number;
  color: string;
  /** Legend label. Default: `from – to`, formatted with `formatValue`. */
  name?: string;
};

export type HeatmapChartProps = ChartBaseProps &
  ChartEmptyProps &
  ChartLegendProps & {
    /** One row per series, drawn top to bottom; one value per category. */
    series: { name: string; data: number[] }[];
    categories: (string | number)[];
    /**
     * Color steps, low to high, spread over the data range in buckets with
     * round bounds. Default: five brand steps of the current theme and accent.
     */
    colors?: string[];
    /**
     * Explicit color ranges (thresholds such as OK / WARN / CRIT), which take
     * precedence over `colors`. Cover every value: a cell outside all ranges
     * falls back to a series color.
     */
    ranges?: HeatmapColorRange[];
    /**
     * Format the values in the tooltip, the legend and the cells.
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatValue?: (value: number) => string;
    /** Print each value inside its cell. */
    showValues?: boolean;
    /** Show the color legend. Default true. */
    showLegend?: boolean;
  };

// Round bucket sizes, × 10^n. Finer than 1-2-5 so that the buckets fit the
// data instead of leaving the top colors unused.
const NICE_STEPS = [1, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** The smallest round bucket size that is at least `value`. */
const niceStep = (value: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = NICE_STEPS.find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
};

// Drops the float noise of `start + i * step` (0.30000000000000004).
const round = (value: number) => Number(value.toPrecision(12));

/** `colors.length` contiguous ranges with round bounds covering every value. */
const evenRanges = (values: number[], colors: string[]): HeatmapColorRange[] => {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0 || colors.length === 0) return [];
  const min = finite.reduce((a, b) => Math.min(a, b));
  const max = finite.reduce((a, b) => Math.max(a, b));
  let step = niceStep((max - min) / colors.length || Math.abs(max) || 1);
  let start = Math.floor(min / step) * step;
  // Flooring the start can leave the top value out: take the next round step.
  while (start + step * colors.length < max) {
    step = niceStep(step * 1.001);
    start = Math.floor(min / step) * step;
  }
  return colors.map((color, i) => ({
    from: round(start + step * i),
    to: round(start + step * (i + 1)),
    color,
  }));
};

/** Dark text on light cells, white on dark ones. `undefined` for a non-hex color. */
const textColorOn = (color: string): string | undefined => {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) return undefined;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2 ? '#101828' : '#ffffff';
};

export const HeatmapChart = ({
  series,
  categories,
  colors,
  ranges,
  formatValue,
  showValues = false,
  showLegend = true,
  legendPosition = 'top',
  emptyMessage,
  ariaLabel,
  height = 320,
  width = '100%',
}: HeatmapChartProps) => {
  const { axisLabels, brandScale, surface, tooltipTheme } = useChartTheme();
  const format = useValueFormat(formatValue);
  const categoryTitle = useCategoryTitle(categories);

  const colorRanges = (
    ranges ??
    evenRanges(
      series.flatMap((s) => s.data),
      colors ?? brandScale
    )
  ).map((range) => ({
    ...range,
    name: range.name ?? `${format.axis(range.from)} – ${format.axis(range.to)}`,
    foreColor: textColorOn(range.color),
  }));

  const options: ApexOptions = {
    chart: {
      type: 'heatmap',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    dataLabels: {
      enabled: showValues,
      formatter: format.axis,
      style: { fontSize: '11px', fontWeight: 500 },
    },
    plotOptions: {
      heatmap: {
        radius: 3,
        // The ranges carry the exact colors: no shading on top of them.
        enableShades: false,
        colorScale: { ranges: colorRanges },
      },
    },
    // Gaps between the cells, in the card's color.
    stroke: { width: 2, colors: [surface] },
    grid: { show: false },
    // One labels object per axis: ApexCharts mutates them. Narrow columns
    // skip the labels that would overlap instead of rotating them into a
    // pile; the tooltip still names every column.
    xaxis: {
      categories,
      labels: { ...axisLabels, rotate: 0 },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    // ApexCharts draws the first series at the bottom; read top-down instead.
    yaxis: { reversed: true, labels: { ...axisLabels } },
    legend: {
      show: showLegend,
      position: legendPosition,
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      // The default stroke outlines the swatches in white, glaring in dark themes.
      markers: { size: 5, strokeWidth: 0 },
      formatter: escapeHtml,
    },
    // The tooltip and the legend are HTML: escape row names, categories,
    // range names and values. The title is the hovered column's category.
    tooltip: {
      theme: tooltipTheme,
      x: { show: true, formatter: categoryTitle },
      y: { formatter: format.tooltip, title: { formatter: seriesTitle } },
    },
  };

  return (
    <ApexChart
      type="heatmap"
      options={options}
      series={series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      emptyMessage={emptyMessage}
    />
  );
};
