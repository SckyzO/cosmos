import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ANIMATION } from './core/animation';
import { GRID_PROPS, useAxis, xAxisTitle, yAxisTitle } from './core/axes';
import { categoryAxis, trimLabel } from './core/categoryAxis';
import { useCategoryKeys } from './core/categoryKeys';
import { ChartTooltip } from './core/ChartTooltip';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, seriesColor } from './core/colors';
import { hasNoData, seriesKey, toRows } from './core/data';
import { ChartEmpty, ChartSkeleton, frameProps } from './core/frame';
import { referenceMarks } from './core/reference';
import { isOuterInStack, roundedBarShape } from './core/roundedBar';
import type {
  ChartAxisTitleProps,
  ChartEmptyProps,
  ChartLegendProps,
  ChartLoadingProps,
  ChartProps,
  ChartReferenceProps,
} from './types';

export type BarChartOrientation = 'vertical' | 'horizontal';

export type BarChartProps = ChartProps &
  ChartEmptyProps &
  ChartLoadingProps &
  ChartLegendProps &
  ChartAxisTitleProps &
  ChartReferenceProps & {
    series: { name: string; data: number[] }[];
    categories: (string | number)[];
    /** `vertical` (default) draws bars upward; `horizontal` draws them rightward. */
    orientation?: BarChartOrientation;
    /** Stack multi-series bars instead of grouping them side-by-side. */
    stacked?: boolean;
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the numeric axis labels and the tooltip values. */
    formatValue?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
    /** Radius, in px, of the end of a bar away from the axis; only the outer end of a stack is rounded. Default 4. */
    borderRadius?: number;
    /**
     * The color of a bar from its value and the index of its category, for a threshold or a
     * ranking. Return `undefined` to keep the color the other rules give. Applies to every
     * series; the tooltip chip of a bar follows it, the legend keeps the series color.
     */
    colorByValue?: (value: number, index: number) => string | undefined;
    /** One palette color per category (`colors` cycles), instead of one per series. For a single series. */
    distributed?: boolean;
    /** The color of the bars below zero, for diverging bars. `colorByValue` wins over it. */
    negativeColor?: string;
  };

export const BarChart = ({
  series,
  categories,
  orientation = 'vertical',
  stacked = false,
  colors,
  formatValue,
  xTitle,
  yTitle,
  referenceLines,
  referenceBands,
  showLegend,
  legendPosition = 'top',
  borderRadius = 4,
  colorByValue,
  distributed = false,
  negativeColor,
  emptyMessage = 'No data',
  loading,
  ariaLabel,
  children,
  height = 320,
  width,
}: BarChartProps) => {
  const hidden = useHiddenSeries();
  const axis = useAxis();
  // Recharts names the layout after the axis the categories sit on.
  const categoryKeys = useCategoryKeys(orientation === 'horizontal' ? 'vertical' : 'horizontal');
  const name = ariaLabel ?? `Bar chart: ${series.map((s) => s.name).join(', ')}`;
  if (loading) return <ChartSkeleton ariaLabel={name} height={height} width={width} />;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  const horizontal = orientation === 'horizontal';
  // Recharts names the layout after the axis the categories sit on.
  const layout = horizontal ? 'vertical' : 'horizontal';
  // A bar's own color, in order of precedence: colorByValue, negativeColor, distributed.
  const fillFor =
    colorByValue || negativeColor !== undefined || distributed
      ? (value: number, index: number) =>
          colorByValue?.(value, index) ??
          (negativeColor !== undefined && value < 0
            ? negativeColor
            : distributed
              ? seriesColor(index, colors)
              : undefined)
      : undefined;
  const shown = series.map((_, i) => seriesKey(i)).filter((key) => !hidden.hidden.has(key));
  return (
    <RechartsBarChart
      ref={categoryKeys}
      {...frameProps({ height, width, ariaLabel: name })}
      data={toRows(categories, series)}
      layout={layout}
      // Stacks of both signs: the negative values stack down from zero, apart from the positive ones.
      stackOffset="sign"
      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      barGap={4}
      barCategoryGap="22%"
    >
      <CartesianGrid
        {...GRID_PROPS}
        {...(horizontal ? { horizontal: false, vertical: true } : {})}
      />
      {horizontal ? (
        <>
          <XAxis type="number" tickFormatter={formatValue} {...axis} {...xAxisTitle(xTitle)} />
          <YAxis
            type="category"
            dataKey="category"
            width="auto"
            tickFormatter={trimLabel}
            {...axis}
            {...yAxisTitle(yTitle)}
          />
        </>
      ) : (
        <>
          <XAxis
            dataKey="category"
            {...axis}
            {...xAxisTitle(xTitle)}
            {...categoryAxis(categories, xTitle)}
          />
          <YAxis width="auto" tickFormatter={formatValue} {...axis} {...yAxisTitle(yTitle)} />
        </>
      )}
      {(showLegend ?? series.length > 1) && <Legend {...legendProps(legendPosition, hidden)} />}
      <Tooltip
        content={<ChartTooltip format={formatValue} colorOf={fillFor} />}
        cursor={{ fill: BORDER, fillOpacity: 0.35, radius: 8 }}
        animationDuration={150}
      />
      {series.map((s, i) => {
        const key = seriesKey(i);
        return (
          <Bar
            key={key}
            name={s.name}
            dataKey={key}
            fill={seriesColor(i, colors)}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={44}
            shape={roundedBarShape({
              layout,
              radius: borderRadius,
              dataKey: key,
              isOuter: stacked ? isOuterInStack(shown, key) : undefined,
              fillFor,
            })}
            hide={hidden.hidden.has(key)}
            {...ANIMATION}
          />
        );
      })}
      {referenceMarks({ referenceLines, referenceBands, axis: horizontal ? 'x' : 'y' })}
      {children}
    </RechartsBarChart>
  );
};
