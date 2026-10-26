import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { ANIMATION } from './core/animation';
import { AXIS, GRID_PROPS, xAxisTitle, yAxisTitle } from './core/axes';
import { ChartTooltip } from './core/ChartTooltip';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, PANEL, seriesColor } from './core/colors';
import { hasNoData, safeId, seriesKey, toRows } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import type { ChartAxisTitleProps, ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type LineAreaChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps &
  ChartAxisTitleProps & {
    series: { name: string; data: number[] }[];
    categories: (string | number)[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the y-axis labels and the tooltip values. */
    formatValue?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

export const LineAreaChart = ({
  series,
  categories,
  colors,
  formatValue,
  xTitle,
  yTitle,
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 280,
  width,
  showLegend,
  legendPosition = 'top',
}: LineAreaChartProps) => {
  const uid = safeId(useId());
  const hidden = useHiddenSeries();
  const name = ariaLabel ?? `Area chart: ${series.map((s) => s.name).join(', ')}`;
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
      <defs>
        {series.map((_, i) => (
          <linearGradient key={seriesKey(i)} id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={seriesColor(i, colors)} stopOpacity={0.32} />
            <stop offset="100%" stopColor={seriesColor(i, colors)} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis dataKey="category" {...AXIS} {...xAxisTitle(xTitle)} />
      <YAxis width="auto" tickFormatter={formatValue} {...AXIS} {...yAxisTitle(yTitle)} />
      {legendVisible && <Legend {...legendProps(legendPosition, hidden)} />}
      <Tooltip
        content={<ChartTooltip format={formatValue} />}
        cursor={{ stroke: BORDER, strokeDasharray: '4 4' }}
        animationDuration={150}
      />
      {series.map((s, i) => (
        <Area
          key={seriesKey(i)}
          name={s.name}
          dataKey={seriesKey(i)}
          type="monotone"
          stroke={seriesColor(i, colors)}
          strokeWidth={2.25}
          fill={`url(#${uid}-${i})`}
          dot={false}
          activeDot={{ r: 5, fill: PANEL, stroke: seriesColor(i, colors), strokeWidth: 2.5 }}
          hide={hidden.hidden.has(seriesKey(i))}
          {...ANIMATION}
        />
      ))}
      {children}
    </AreaChart>
  );
};
