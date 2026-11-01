import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { ANIMATION } from './core/animation';
import { GRID_PROPS, useAxis, xAxisTitle, yAxisTitle } from './core/axes';
import { ChartTooltip } from './core/ChartTooltip';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, PANEL, seriesColor } from './core/colors';
import { hasNoData, safeId, seriesKey, toRows } from './core/data';
import { ChartEmpty, ChartSkeleton, frameProps } from './core/frame';
import { referenceMarks } from './core/reference';
import type {
  ChartAxisTitleProps,
  ChartEmptyProps,
  ChartLegendProps,
  ChartLoadingProps,
  ChartProps,
  ChartReferenceProps,
} from './types';

export type LineAreaChartVariant = 'area' | 'line';

/** How a series is drawn: a `solid` smooth curve, a `dashed` one, or a `step` line that jumps from value to value. */
export type LineAreaChartSeriesStyle = 'solid' | 'dashed' | 'step';

// The dash of a `dashed` series, as the reference lines have it.
const DASH = '6 4';

export type LineAreaChartProps = ChartProps &
  ChartEmptyProps &
  ChartLoadingProps &
  ChartLegendProps &
  ChartAxisTitleProps &
  ChartReferenceProps & {
    series: {
      name: string;
      data: number[];
      /** `solid` (default), `dashed` or `step`: a line that jumps from one value to the next, such as a quota or a replica count. */
      style?: LineAreaChartSeriesStyle;
    }[];
    categories: (string | number)[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the y-axis labels and the tooltip values. */
    formatValue?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
    /** `area` (default) fills under each line with a gradient; `line` draws the lines alone. */
    variant?: LineAreaChartVariant;
    /** Pile the series on each other, so the top line is the sum: the share of each in a total. */
    stacked?: boolean;
    /** Mark every data point with a dot. Default off: a dot appears under the pointer only. */
    markers?: boolean;
  };

export const LineAreaChart = ({
  series,
  categories,
  colors,
  formatValue,
  xTitle,
  yTitle,
  referenceLines,
  referenceBands,
  emptyMessage = 'No data',
  loading,
  ariaLabel,
  children,
  height = 280,
  width,
  showLegend,
  legendPosition = 'top',
  variant = 'area',
  stacked = false,
  markers = false,
}: LineAreaChartProps) => {
  const uid = safeId(useId());
  const hidden = useHiddenSeries();
  const axis = useAxis();
  const name = ariaLabel ?? `Area chart: ${series.map((s) => s.name).join(', ')}`;
  if (loading) return <ChartSkeleton ariaLabel={name} height={height} width={width} />;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  const legendVisible = showLegend ?? series.length > 1;
  return (
    <AreaChart
      {...frameProps({ height, width, ariaLabel: name })}
      data={toRows(categories, series)}
      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
    >
      {variant === 'area' && (
        <defs>
          {series.map((_, i) => (
            <linearGradient key={seriesKey(i)} id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={seriesColor(i, colors)} stopOpacity={0.32} />
              <stop offset="100%" stopColor={seriesColor(i, colors)} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
      )}
      <CartesianGrid {...GRID_PROPS} />
      <XAxis dataKey="category" {...axis} {...xAxisTitle(xTitle)} />
      <YAxis width="auto" tickFormatter={formatValue} {...axis} {...yAxisTitle(yTitle)} />
      {legendVisible && <Legend {...legendProps(legendPosition, hidden)} />}
      <Tooltip
        content={<ChartTooltip format={formatValue} />}
        cursor={{ stroke: BORDER, strokeDasharray: '4 4' }}
        animationDuration={150}
      />
      {series.map((s, i) => {
        const color = seriesColor(i, colors);
        return (
          <Area
            key={seriesKey(i)}
            name={s.name}
            dataKey={seriesKey(i)}
            type={s.style === 'step' ? 'step' : 'monotone'}
            stroke={color}
            strokeWidth={2.25}
            strokeDasharray={s.style === 'dashed' ? DASH : undefined}
            stackId={stacked ? 'stack' : undefined}
            fill={variant === 'area' ? `url(#${uid}-${i})` : 'none'}
            dot={markers ? { r: 3.5, fill: PANEL, stroke: color, strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: PANEL, stroke: color, strokeWidth: 2.5 }}
            hide={hidden.hidden.has(seriesKey(i))}
            {...ANIMATION}
          />
        );
      })}
      {referenceMarks({ referenceLines, referenceBands })}
      {children}
    </AreaChart>
  );
};
