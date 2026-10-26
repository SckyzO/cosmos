import { useRef } from 'react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  Tooltip,
} from 'recharts';
import { ANIMATION } from './core/animation';
import { AXIS, TEXT_SIZE } from './core/axes';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { ChartTooltip } from './core/ChartTooltip';
import { BORDER, GRID, MUTED, seriesColor } from './core/colors';
import { hasNoData, seriesKey, toRows } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import { radarSize } from './radarSize';
import { useWidth } from './useWidth';
import type { ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type RadarChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps & {
    /** One polygon per series; one value per category, in the same order. */
    series: { name: string; data: number[] }[];
    /** The axes, clockwise from the top. */
    categories: string[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the scale labels and the tooltip values. */
    formatValue?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
    /** Top of the scale, e.g. 100 for scores. Default: rounded up from the data. */
    max?: number;
    /**
     * Write the scale on the polygons (0, 20 … 100). Default off: the labels sit on the
     * polygons and the tooltip gives the values. `max` and `formatValue` still apply.
     */
    showScale?: boolean;
  };

export const RadarChart = ({
  series,
  categories,
  colors,
  formatValue,
  showLegend,
  legendPosition = 'top',
  max,
  showScale = false,
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 340,
  width,
}: RadarChartProps) => {
  const hidden = useHiddenSeries();
  const box = useRef<HTMLDivElement>(null);
  const boxWidth = useWidth(box);
  const name = ariaLabel ?? `Radar chart: ${series.map((s) => s.name).join(', ')}`;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  const legendVisible = showLegend ?? series.length > 1;
  // The polygons as large as the box allows, less the room of the axis names
  // and the legend. A height that is not a number of pixels, or a box not
  // measured yet, leaves it to a share of the plot.
  const radius =
    typeof height === 'number' && boxWidth
      ? radarSize({
          height,
          width: boxWidth,
          categories,
          legend: legendVisible ? legendPosition : undefined,
        })
      : '70%';
  return (
    <div ref={box} style={{ width: width ?? '100%', maxWidth: '100%' }}>
      <RechartsRadarChart
        {...frameProps({ height, width: '100%', ariaLabel: name })}
        data={toRows(categories, series)}
        outerRadius={radius}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="category" tick={AXIS.tick} tickLine={false} />
        <PolarRadiusAxis
          angle={90}
          domain={[0, max ?? 'auto']}
          tickCount={6}
          tickFormatter={formatValue}
          tick={showScale ? { fill: MUTED, style: { fontSize: TEXT_SIZE } } : false}
          axisLine={false}
        />
        {legendVisible && <Legend {...legendProps(legendPosition, hidden)} />}
        <Tooltip
          content={<ChartTooltip format={formatValue} />}
          cursor={{ stroke: BORDER, strokeDasharray: '4 4' }}
          animationDuration={150}
        />
        {series.map((s, i) => (
          <Radar
            key={seriesKey(i)}
            name={s.name}
            dataKey={seriesKey(i)}
            stroke={seriesColor(i, colors)}
            strokeWidth={2}
            fill={seriesColor(i, colors)}
            fillOpacity={0.15}
            dot={{ r: 3, fill: seriesColor(i, colors), fillOpacity: 1, strokeWidth: 0 }}
            hide={hidden.hidden.has(seriesKey(i))}
            {...ANIMATION}
          />
        ))}
        {children}
      </RechartsRadarChart>
    </div>
  );
};
