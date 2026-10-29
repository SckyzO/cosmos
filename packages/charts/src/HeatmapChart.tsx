import type { CSSProperties } from 'react';
import { TEXT_SIZE } from './core/axes';
import { MUTED, SEQUENTIAL, seriesColor } from './core/colors';
import { hasNoData } from './core/data';
import { ChartEmpty } from './core/frame';
import { HeatGrid, type HeatCell } from './core/HeatGrid';
import type {
  ChartAxisTitleProps,
  ChartEmptyProps,
  ChartLegendPosition,
  ChartLegendProps,
  ChartProps,
} from './types';

export type HeatmapColorRange = {
  /** Lowest value of the range, inclusive. */
  from: number;
  /** Highest value of the range, inclusive. A value on a shared bound takes the later range. */
  to: number;
  color: string;
  /** Legend label. Default: `from – to`, formatted with `formatValue`. */
  name?: string;
};

export type HeatmapChartProps = Omit<ChartProps, 'children'> &
  ChartEmptyProps &
  ChartLegendProps &
  ChartAxisTitleProps & {
    /** One row per series, drawn top to bottom; one value per category. */
    series: { name: string; data: number[] }[];
    categories: (string | number)[];
    /**
     * Color steps, low to high, spread over the data range in buckets with
     * round bounds. Default: five steps of the current accent, mixed over the
     * card.
     */
    colors?: string[];
    /**
     * Explicit color ranges (thresholds such as OK / WARN / CRIT), which take
     * precedence over `colors`. Cover every value: a cell outside all ranges
     * falls back to a series color.
     */
    ranges?: HeatmapColorRange[];
    /** Format the values in the tooltip, the legend and the cells. */
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

/** The range a value falls in; on a bound shared by two ranges, the later one. */
const rangeOf = (value: number, ranges: HeatmapColorRange[]) =>
  [...ranges].reverse().find((range) => value >= range.from && value <= range.to);

const legendStyle = (position: ChartLegendPosition): CSSProperties => {
  const column = position === 'left' || position === 'right';
  return {
    display: 'flex',
    flexDirection: column ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: column ? '0.375rem' : '0.25rem 1rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    fontSize: TEXT_SIZE,
    color: MUTED,
  };
};

const SIDES: Record<ChartLegendPosition, CSSProperties> = {
  top: { flexDirection: 'column' },
  bottom: { flexDirection: 'column-reverse' },
  left: { flexDirection: 'row' },
  right: { flexDirection: 'row-reverse' },
};

export const HeatmapChart = ({
  series,
  categories,
  colors,
  ranges,
  formatValue = String,
  xTitle,
  yTitle,
  showValues = false,
  showLegend = true,
  legendPosition = 'top',
  emptyMessage = 'No data',
  ariaLabel,
  height = 320,
  width,
}: HeatmapChartProps) => {
  const name = ariaLabel ?? `Heatmap: ${series.map((s) => s.name).join(', ')}`;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  const colorRanges = (
    ranges ??
    evenRanges(
      series.flatMap((s) => s.data),
      colors ?? SEQUENTIAL
    )
  ).map((range) => ({
    ...range,
    name: range.name ?? `${formatValue(range.from)} – ${formatValue(range.to)}`,
  }));
  const cells = series.flatMap((s, row) =>
    s.data.flatMap((value, column): HeatCell[] =>
      Number.isFinite(value)
        ? [
            {
              row,
              column,
              color: rangeOf(value, colorRanges)?.color ?? seriesColor(row),
              title: String(categories[column] ?? column),
              label: s.name,
              value: formatValue(value),
              text: showValues ? formatValue(value) : undefined,
            },
          ]
        : []
    )
  );
  const legend = showLegend && (
    <ul data-heat-legend="" style={legendStyle(legendPosition)}>
      {colorRanges.map((range, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span
            aria-hidden
            style={{
              width: '0.625rem',
              height: '0.625rem',
              borderRadius: 3,
              background: range.color,
            }}
          />
          {range.name}
        </li>
      ))}
    </ul>
  );
  return (
    <div
      style={{
        // The axes keep their order under `dir="rtl"`, and so do the legend's sides.
        direction: 'ltr',
        display: 'flex',
        gap: '1rem',
        width: width ?? '100%',
        height,
        maxWidth: '100%',
        ...SIDES[legendPosition],
      }}
    >
      {legend}
      <div style={{ flex: '1 1 0', minWidth: 0, minHeight: 0 }}>
        <HeatGrid
          rows={series.map((s) => s.name)}
          columns={categories.map(String)}
          cells={cells}
          ariaLabel={name}
          xTitle={xTitle}
          yTitle={yTitle}
        />
      </div>
    </div>
  );
};
