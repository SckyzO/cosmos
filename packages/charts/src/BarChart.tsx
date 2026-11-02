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
import { absolute, mirrorSeries, symmetricDomain } from './core/mirror';
import { centralAxis, referenceMarks } from './core/reference';
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
    /** The color of the bars below zero, for diverging bars. `colorByValue` wins over it. Not read when `mirrored`. */
    negativeColor?: string;
    /**
     * Draw the first series on the negative side of a central axis and the others on the
     * positive side, from the axis: a population pyramid with `orientation="horizontal"`, two
     * series either side of it. The values are magnitudes (a sign they arrive with is dropped),
     * the value axis is as long on each side, and its labels and the tooltip give them without a
     * sign, through `formatValue`. It stacks the series, whatever `stacked` says; `colorByValue`
     * gets the magnitude, and `negativeColor` has nothing to color. `referenceLines` and
     * `referenceBands` stay in the signed units of the axis (`-10` is on the first series' side).
     * Default off.
     */
    mirrored?: boolean;
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
  mirrored = false,
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
  // A mirrored chart draws its first series below zero, which is no data: the rules read the magnitude.
  const magnitude = (value: number) => (mirrored ? Math.abs(value) : value);
  const colorBelowZero = mirrored ? undefined : negativeColor;
  // A bar's own color, in order of precedence: colorByValue, negativeColor, distributed.
  const fillFor =
    colorByValue || colorBelowZero !== undefined || distributed
      ? (value: number, index: number) =>
          colorByValue?.(magnitude(value), index) ??
          (colorBelowZero !== undefined && value < 0
            ? colorBelowZero
            : distributed
              ? seriesColor(index, colors)
              : undefined)
      : undefined;
  // The labels and the tooltip of a mirrored chart read the magnitude, with no sign.
  const format = mirrored ? absolute(formatValue) : formatValue;
  const piled = stacked || mirrored;
  const shown = series.map((_, i) => seriesKey(i)).filter((key) => !hidden.hidden.has(key));
  return (
    <RechartsBarChart
      ref={categoryKeys}
      {...frameProps({ height, width, ariaLabel: name })}
      data={toRows(categories, mirrored ? mirrorSeries(series) : series)}
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
          <XAxis
            type="number"
            tickFormatter={format}
            {...(mirrored ? { domain: symmetricDomain } : {})}
            {...axis}
            {...xAxisTitle(xTitle)}
          />
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
          <YAxis
            width="auto"
            tickFormatter={format}
            {...(mirrored ? { domain: symmetricDomain } : {})}
            {...axis}
            {...yAxisTitle(yTitle)}
          />
        </>
      )}
      {(showLegend ?? series.length > 1) && <Legend {...legendProps(legendPosition, hidden)} />}
      <Tooltip
        content={<ChartTooltip format={format} colorOf={fillFor} />}
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
            stackId={piled ? 'stack' : undefined}
            maxBarSize={44}
            shape={roundedBarShape({
              layout,
              radius: borderRadius,
              dataKey: key,
              isOuter: piled ? isOuterInStack(shown, key) : undefined,
              fillFor,
            })}
            hide={hidden.hidden.has(key)}
            {...ANIMATION}
          />
        );
      })}
      {mirrored && centralAxis(horizontal ? 'x' : 'y')}
      {referenceMarks({ referenceLines, referenceBands, axis: horizontal ? 'x' : 'y' })}
      {children}
    </RechartsBarChart>
  );
};
