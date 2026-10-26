import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type TooltipContentProps,
} from 'recharts';
import { ANIMATION } from './core/animation';
import { useAxis, xAxisTitle, yAxisTitle } from './core/axes';
import { TooltipCard } from './core/ChartTooltip';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, GRID, seriesColor } from './core/colors';
import { hasNoData, seriesKey } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import type { ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type ScatterPoint = {
  x: number;
  y: number;
  /** Names the point in the tooltip title: a node, a host, a rack. */
  label?: string;
};

export type BubblePoint = ScatterPoint & {
  /** Third measure, drawn as the bubble size. */
  z: number;
};

type XYChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps & {
    /** Title under the x-axis. Also labels the x value in the tooltip (default `x`). */
    xTitle?: string;
    /** Title beside the y-axis. Also labels the y value in the tooltip (default `y`). */
    yTitle?: string;
    /** Override the default Cosmos palette, one color per series. */
    colors?: string[];
    /** Format the x-axis labels and the tooltip's x value (default: at most two decimals). */
    formatX?: (value: number) => string;
    /** Format the y-axis labels and the tooltip's y value (default: at most two decimals). */
    formatY?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

export type ScatterChartProps = XYChartProps & {
  series: { name: string; data: ScatterPoint[] }[];
};

export type BubbleChartProps = XYChartProps & {
  series: { name: string; data: BubblePoint[] }[];
  /** Labels the size in the tooltip. Default `Size`. */
  sizeTitle?: string;
  /** Format the size in the tooltip (default: at most two decimals). */
  formatSize?: (value: number) => string;
};

/** Drops the float noise of computed values: 33.333333 reads 33.33. */
const formatNumber = (value: number) => String(Number(value.toFixed(2)));

// The area of a point, in px², for the Scatter chart: a 6px radius disc.
const POINT_AREA = 113;
// The areas of the smallest and the largest bubble.
const BUBBLE_AREAS: [number, number] = [60, 1100];

type Bubbles = { sizeTitle: string; formatSize: (value: number) => string };

type XYProps = XYChartProps & {
  series: { name: string; data: (ScatterPoint & { z?: number })[] }[];
  bubbles?: Bubbles;
};

const XYChart = ({
  series,
  bubbles,
  colors,
  formatX = formatNumber,
  formatY = formatNumber,
  xTitle,
  yTitle,
  showLegend,
  legendPosition = 'top',
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 320,
  width,
}: XYProps) => {
  const hidden = useHiddenSeries();
  const axis = useAxis();
  const name =
    ariaLabel ?? `${bubbles ? 'Bubble' : 'Scatter'} chart: ${series.map((s) => s.name).join(', ')}`;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }

  // The card of the point under the pointer: its label, the series, then one
  // row per measure.
  const tooltip = ({ active, payload }: Partial<TooltipContentProps>) => {
    const point = payload?.[0]?.payload as
      (ScatterPoint & { z?: number; series: number }) | undefined;
    if (!active || !point) return null;
    const color = seriesColor(point.series, colors);
    const none = 'transparent';
    return (
      <TooltipCard
        title={point.label}
        rows={[
          { name: series[point.series].name, value: '', color },
          { name: xTitle ?? 'x', value: formatX(point.x), color: none },
          { name: yTitle ?? 'y', value: formatY(point.y), color: none },
          ...(bubbles && point.z !== undefined
            ? [{ name: bubbles.sizeTitle, value: bubbles.formatSize(point.z), color: none }]
            : []),
        ]}
      />
    );
  };

  return (
    <RechartsScatterChart
      {...frameProps({ height, width, ariaLabel: name })}
      margin={{ top: 4, right: bubbles ? 24 : 12, bottom: 0, left: 0 }}
    >
      <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
      <XAxis
        type="number"
        dataKey="x"
        name={xTitle ?? 'x'}
        domain={['auto', 'auto']}
        tickFormatter={formatX}
        {...axis}
        {...xAxisTitle(xTitle)}
      />
      <YAxis
        type="number"
        dataKey="y"
        name={yTitle ?? 'y'}
        domain={['auto', 'auto']}
        width="auto"
        tickFormatter={formatY}
        {...axis}
        {...yAxisTitle(yTitle)}
      />
      {bubbles ? (
        <ZAxis type="number" dataKey="z" name={bubbles.sizeTitle} range={BUBBLE_AREAS} />
      ) : (
        <ZAxis type="number" range={[POINT_AREA, POINT_AREA]} />
      )}
      {(showLegend ?? series.length > 1) && <Legend {...legendProps(legendPosition, hidden)} />}
      <Tooltip
        content={tooltip}
        cursor={{ stroke: BORDER, strokeDasharray: '4 4' }}
        animationDuration={150}
      />
      {series.map((s, index) => {
        const color = seriesColor(index, colors);
        return (
          <Scatter
            key={seriesKey(index)}
            name={s.name}
            dataKey={seriesKey(index)}
            data={s.data.map((point) => ({ ...point, series: index }))}
            fill={color}
            // Translucent bubbles, outlined in their own color, keep the overlapping ones readable.
            {...(bubbles ? { fillOpacity: 0.6, stroke: color, strokeWidth: 1 } : {})}
            hide={hidden.hidden.has(seriesKey(index))}
            {...ANIMATION}
          />
        );
      })}
      {children}
    </RechartsScatterChart>
  );
};

/** Points on two numeric axes, e.g. latency against load, one point per node. */
export const ScatterChart = (props: ScatterChartProps) => <XYChart {...props} />;

/** A scatter chart whose bubble size carries a third measure (`z`), e.g. request volume. */
export const BubbleChart = ({
  sizeTitle = 'Size',
  formatSize = formatNumber,
  ...props
}: BubbleChartProps) => <XYChart {...props} bubbles={{ sizeTitle, formatSize }} />;
