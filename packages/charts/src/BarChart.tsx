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
import { ChartTooltip } from './core/ChartTooltip';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, seriesColor } from './core/colors';
import { hasNoData, seriesKey, toRows } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import { isOuterInStack, roundedBarShape } from './core/roundedBar';
import type { ChartAxisTitleProps, ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type BarChartOrientation = 'vertical' | 'horizontal';

export type BarChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps &
  ChartAxisTitleProps & {
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
  showLegend,
  legendPosition = 'top',
  borderRadius = 4,
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 320,
  width,
}: BarChartProps) => {
  const hidden = useHiddenSeries();
  const axis = useAxis();
  const name = ariaLabel ?? `Bar chart: ${series.map((s) => s.name).join(', ')}`;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  const horizontal = orientation === 'horizontal';
  // Recharts names the layout after the axis the categories sit on.
  const layout = horizontal ? 'vertical' : 'horizontal';
  const shown = series.map((_, i) => seriesKey(i)).filter((key) => !hidden.hidden.has(key));
  return (
    <RechartsBarChart
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
        content={<ChartTooltip format={formatValue} />}
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
            })}
            hide={hidden.hidden.has(key)}
            {...ANIMATION}
          />
        );
      })}
      {children}
    </RechartsBarChart>
  );
};
