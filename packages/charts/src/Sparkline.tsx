import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { ANIMATION } from './core/animation';
import { ChartTooltip } from './core/ChartTooltip';
import { BORDER, ERROR, PANEL, SERIES } from './core/colors';
import { hasNoData, safeId } from './core/data';
import { ChartEmpty, ChartSkeleton, frameProps } from './core/frame';
import { roundedBarShape } from './core/roundedBar';
import type { ChartEmptyProps, ChartLoadingProps, ChartProps } from './types';

export type SparklineProps = ChartProps &
  ChartEmptyProps &
  ChartLoadingProps & {
    data: number[];
    /** A CSS color. Default: the accent. */
    color?: string;
    /**
     * `area` (default), `line`, or `bar`: narrow columns in `color`, the ones below zero in the
     * danger color under a dashed zero line.
     */
    variant?: 'line' | 'area' | 'bar';
    /** Names the value in the tooltip. Default `value`. Drawn as plain text. */
    label?: string;
    /** Format the tooltip value (default `String`). */
    formatValue?: (value: number) => string;
    /**
     * Bottom of the scale. Default: the lowest value of `data`, so each sparkline fills its
     * height; for `bar`, the lower of 0 and the lowest value, since a bar scale that does not
     * start at zero exaggerates the differences. Set the same `min` and `max` on sparklines that
     * are read against each other.
     */
    min?: number;
    /** Top of the scale. Default: the highest value of `data` (for `bar`, at least 0). */
    max?: number;
  };

export const Sparkline = ({
  data,
  color = SERIES[0],
  variant = 'area',
  label = 'value',
  formatValue,
  min,
  max,
  emptyMessage = 'No data',
  loading,
  ariaLabel,
  children,
  height = 60,
  width,
}: SparklineProps) => {
  const uid = safeId(useId());
  const name = ariaLabel ?? `Trend of ${label}`;
  if (loading) return <ChartSkeleton ariaLabel={name} height={height} width={width} />;
  if (hasNoData([{ data }])) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  if (variant === 'bar') {
    const fillFor = (value: number) => (value < 0 ? ERROR : undefined);
    const hasNegative = data.some((value) => value < 0);
    return (
      <BarChart
        {...frameProps({ height, width, ariaLabel: name, keyboard: false })}
        data={data.map((value, i) => ({ i, value }))}
        margin={{ top: 6, right: 4, bottom: 4, left: 4 }}
        barCategoryGap="20%"
      >
        <XAxis hide dataKey="i" />
        <YAxis hide domain={[min ?? Math.min(0, ...data), max ?? Math.max(0, ...data)]} />
        <Tooltip
          content={<ChartTooltip format={formatValue} hideTitle colorOf={fillFor} />}
          cursor={{ fill: BORDER, fillOpacity: 0.35 }}
          offset={12}
          allowEscapeViewBox={{ x: true, y: true }}
          animationDuration={100}
        />
        <Bar
          name={label}
          dataKey="value"
          fill={color}
          maxBarSize={14}
          shape={roundedBarShape({ layout: 'horizontal', radius: 2, dataKey: 'value', fillFor })}
          {...ANIMATION}
        />
        {hasNegative && (
          <ReferenceLine y={0} stroke={BORDER} strokeDasharray="3 3" ifOverflow="hidden" />
        )}
        {children}
      </BarChart>
    );
  }
  return (
    <AreaChart
      // A sparkline is an image: the tooltip follows the pointer, and Tab skips it.
      {...frameProps({ height, width, ariaLabel: name, keyboard: false })}
      data={data.map((value, i) => ({ i, value }))}
      margin={{ top: 6, right: 4, bottom: 4, left: 4 }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* The scale fits the data unless pinned. */}
      <YAxis hide domain={[min ?? 'dataMin', max ?? 'dataMax']} />
      <Tooltip
        content={<ChartTooltip format={formatValue} hideTitle />}
        cursor={false}
        offset={12}
        allowEscapeViewBox={{ x: true, y: true }}
        animationDuration={100}
      />
      <Area
        name={label}
        dataKey="value"
        type="monotone"
        stroke={color}
        strokeWidth={2}
        fill={variant === 'area' ? `url(#${uid})` : 'none'}
        dot={false}
        activeDot={{ r: 4, fill: PANEL, stroke: color, strokeWidth: 2 }}
        {...ANIMATION}
      />
      {children}
    </AreaChart>
  );
};
