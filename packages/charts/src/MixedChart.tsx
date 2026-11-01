import { useId } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { ANIMATION } from './core/animation';
import { GRID_PROPS, TEXT_SIZE, useAxis, xAxisTitle, yAxisTitle } from './core/axes';
import { categoryAxis } from './core/categoryAxis';
import { TooltipCard } from './core/ChartTooltip';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, MUTED, PANEL, seriesColor } from './core/colors';
import { hasNoData, safeId, seriesKey, toRows } from './core/data';
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

export type MixedChartAxis = 'left' | 'right';

export type MixedChartSeries = {
  name: string;
  /** `column` draws bars, `line` draws a line over them, `area` fills under a line, behind the bars. */
  type: 'line' | 'column' | 'area';
  data: number[];
  /** The y axis the series is read on. Any `right` series adds a second axis. Default `left`. */
  axis?: MixedChartAxis;
};

export type MixedChartProps = ChartProps &
  ChartEmptyProps &
  ChartLoadingProps &
  ChartLegendProps &
  ChartAxisTitleProps &
  ChartReferenceProps & {
    /** Lines and columns on one category axis. */
    series: MixedChartSeries[];
    categories: (string | number)[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the left axis labels and the tooltip values of its series. */
    formatValue?: (value: number) => string;
    /** Format the right axis labels and the tooltip values of its series. */
    formatRightValue?: (value: number) => string;
    /**
     * Title beside the right axis. `yTitle` names the left one. With one axis only, that axis
     * takes the title of its side.
     */
    yRightTitle?: string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
    /** Pile the `column` series on each other instead of grouping them side by side; the columns of each axis stack apart. */
    stackedColumns?: boolean;
  };

const SIDES: MixedChartAxis[] = ['left', 'right'];
const axisOf = (s: MixedChartSeries): MixedChartAxis => s.axis ?? 'left';

// The title of the right axis reads top to bottom, mirroring the left one.
const rightAxisTitle = (title?: string) =>
  title
    ? ({
        label: {
          value: title,
          angle: 90,
          position: 'insideRight',
          offset: 4,
          fill: MUTED,
          style: { fill: MUTED, fontSize: TEXT_SIZE, textAnchor: 'middle' },
        },
      } as const)
    : {};

export const MixedChart = ({
  series,
  categories,
  colors,
  formatValue,
  formatRightValue,
  xTitle,
  yTitle,
  yRightTitle,
  referenceLines,
  referenceBands,
  showLegend,
  legendPosition = 'top',
  stackedColumns = false,
  emptyMessage = 'No data',
  loading,
  ariaLabel,
  children,
  height = 320,
  width,
}: MixedChartProps) => {
  const uid = safeId(useId());
  const hidden = useHiddenSeries();
  const axis = useAxis();
  const name = ariaLabel ?? `Mixed chart: ${series.map((s) => s.name).join(', ')}`;
  if (loading) return <ChartSkeleton ariaLabel={name} height={height} width={width} />;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  const formatters = { left: formatValue, right: formatRightValue };
  const usedSides = SIDES.filter((side) => series.some((s) => axisOf(s) === side));
  const sides = usedSides.length > 0 ? usedSides : SIDES.slice(0, 1);

  // Each value in the format of its series' axis; the card is the shared one.
  const tooltip = ({ active, payload, label }: Partial<TooltipContentProps>) => {
    if (!active || !payload?.length) return null;
    return (
      <TooltipCard
        title={label}
        rows={payload.map((item) => {
          const s = series[Number(String(item.dataKey).slice(1))];
          const format = formatters[axisOf(s)] ?? String;
          return {
            name: String(item.name),
            value: format(Number(item.value)),
            color: String(item.color),
          };
        })}
      />
    );
  };

  // The columns on each axis stack apart, and only the outer segment of a stack is rounded.
  const stackKeys = (side: MixedChartAxis) =>
    series.flatMap((s, i) =>
      s.type === 'column' && axisOf(s) === side && !hidden.hidden.has(seriesKey(i))
        ? [seriesKey(i)]
        : []
    );

  return (
    <ComposedChart
      {...frameProps({ height, width, ariaLabel: name })}
      data={toRows(categories, series)}
      // Stacks of both signs: the negative values stack down from zero, apart from the positive ones.
      {...(stackedColumns ? { stackOffset: 'sign' as const } : {})}
      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      barGap={4}
      barCategoryGap="22%"
    >
      {series.some((s) => s.type === 'area') && (
        <defs>
          {series.map((s, i) =>
            s.type === 'area' ? (
              <linearGradient key={seriesKey(i)} id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesColor(i, colors)} stopOpacity={0.32} />
                <stop offset="100%" stopColor={seriesColor(i, colors)} stopOpacity={0} />
              </linearGradient>
            ) : null
          )}
        </defs>
      )}
      <CartesianGrid {...GRID_PROPS} />
      <XAxis
        dataKey="category"
        {...axis}
        {...xAxisTitle(xTitle)}
        {...categoryAxis(categories, xTitle)}
      />
      {sides.map((side) => (
        <YAxis
          key={side}
          yAxisId={side}
          orientation={side}
          width="auto"
          tickFormatter={formatters[side]}
          {...axis}
          {...(side === 'left' ? yAxisTitle(yTitle) : rightAxisTitle(yRightTitle))}
        />
      ))}
      {(showLegend ?? series.length > 1) && <Legend {...legendProps(legendPosition, hidden)} />}
      <Tooltip
        content={tooltip}
        cursor={{ fill: BORDER, fillOpacity: 0.35, radius: 8 }}
        animationDuration={150}
      />
      {series.map((s, i) => {
        const key = seriesKey(i);
        const color = seriesColor(i, colors);
        if (s.type === 'area') {
          return (
            <Area
              key={key}
              name={s.name}
              dataKey={key}
              yAxisId={axisOf(s)}
              type="monotone"
              stroke={color}
              strokeWidth={2.25}
              fill={`url(#${uid}-${i})`}
              dot={false}
              activeDot={{ r: 5, fill: PANEL, stroke: color, strokeWidth: 2.5 }}
              hide={hidden.hidden.has(key)}
              {...ANIMATION}
            />
          );
        }
        return s.type === 'line' ? (
          <Line
            key={key}
            name={s.name}
            dataKey={key}
            yAxisId={axisOf(s)}
            type="monotone"
            stroke={color}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: PANEL, stroke: color, strokeWidth: 2.5 }}
            hide={hidden.hidden.has(key)}
            {...ANIMATION}
          />
        ) : (
          <Bar
            key={key}
            name={s.name}
            dataKey={key}
            yAxisId={axisOf(s)}
            fill={color}
            stackId={stackedColumns ? `stack-${axisOf(s)}` : undefined}
            maxBarSize={44}
            shape={roundedBarShape({
              layout: 'horizontal',
              radius: 4,
              dataKey: key,
              isOuter: stackedColumns ? isOuterInStack(stackKeys(axisOf(s)), key) : undefined,
            })}
            hide={hidden.hidden.has(key)}
            {...ANIMATION}
          />
        );
      })}
      {referenceMarks({ referenceLines, referenceBands, axisId: sides[0] })}
      {children}
    </ComposedChart>
  );
};
