import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart as RechartsRadialBarChart,
  Tooltip,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { ANIMATION } from './core/animation';
import { TooltipCard } from './core/ChartTooltip';
import { TRACK, seriesColor } from './core/colors';
import { ChartEmpty, frameProps } from './core/frame';
import { CenterText, percent } from './core/radial';
import type { ChartEmptyProps, ChartProps } from './types';

export type RadialBarChartProps = ChartProps &
  ChartEmptyProps & {
    series: number[];
    labels: string[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the ring values and their average, on the 0–100 scale of the rings. Default: `78%`. */
    formatValue?: (value: number) => string;
  };

type Ring = { name: string; value: number; raw: number; fill: string };

const RingTooltip = ({
  active,
  payload,
  format,
}: Partial<TooltipContentProps> & { format: (value: number) => string }) => {
  if (!active || !payload?.length) return null;
  const rows = payload.map((item) => {
    const ring = item.payload as Ring;
    return { name: ring.name, value: format(ring.raw), color: ring.fill };
  });
  return <TooltipCard rows={rows} />;
};

export const RadialBarChart = ({
  series,
  labels,
  colors,
  formatValue = percent,
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 320,
  width,
}: RadialBarChartProps) => {
  // The ring the pointer is on, shown in the center in place of the average.
  const [active, setActive] = useState<number>();
  const name = ariaLabel ?? `Radial bar chart: ${labels.join(', ')}`;
  if (series.length === 0) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  // The arcs stop at the ends of the 0–100 scale; the center and the tooltip give the value.
  const rings: Ring[] = labels.map((label, i) => ({
    name: label,
    value: Math.min(100, Math.max(0, series[i])),
    raw: series[i],
    fill: seriesColor(i, colors),
  }));
  const ring = active === undefined ? undefined : rings[active];
  const average = Math.round(series.reduce((a, b) => a + b, 0) / series.length);
  return (
    <RechartsRadialBarChart
      {...frameProps({ height, width, ariaLabel: name })}
      data={rings}
      // From the top, clockwise.
      startAngle={90}
      endAngle={-270}
      innerRadius="40%"
      outerRadius="100%"
      barCategoryGap="12%"
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
      {/* The first series is the outer ring. */}
      <PolarRadiusAxis type="category" dataKey="name" reversed tick={false} axisLine={false} />
      <RadialBar
        dataKey="value"
        background={{ fill: TRACK }}
        cornerRadius={6}
        onMouseEnter={(_, index) => setActive(index)}
        onMouseLeave={() => setActive(undefined)}
        {...ANIMATION}
      />
      <CenterText
        value={formatValue(ring ? ring.raw : average)}
        label={ring ? ring.name : 'Avg'}
        valueSize="var(--text-xl, 1.25rem)"
      />
      <Tooltip
        content={<RingTooltip format={formatValue} />}
        cursor={false}
        animationDuration={150}
      />
      {children}
    </RechartsRadialBarChart>
  );
};
