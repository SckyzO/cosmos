import type { ReactNode } from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import { ANIMATION } from './animation';
import { TRACK } from './colors';
import { frameProps } from './frame';
import { CenterText, clampTo, gaugeName } from './radial';
import type { ChartSize } from '../types';

type RadialGaugeProps = ChartSize & {
  value: number;
  label: string;
  min: number;
  max: number;
  /** The value, formatted: the text in the middle and the end of the name. */
  text: string;
  ariaLabel?: string;
  /** The share of the radius the ring leaves empty in the middle. */
  hollow: string;
  /** The fill of the arc: a color, or a `url(#…)` to what `defs` defines. */
  fill: string;
  /** What the chart defines for `fill`, such as a gradient. */
  defs?: ReactNode;
  children?: ReactNode;
};

/**
 * A full circle with one arc from the top, clockwise, on a neutral track, the
 * value in the middle over its label: the frame of `GradientRadial` and
 * `StrokedGauge`. It is an image (out of the tab order) named by its value.
 */
export const RadialGauge = ({
  value,
  label,
  min,
  max,
  text,
  ariaLabel,
  hollow,
  fill,
  defs,
  children,
  height,
  width,
}: RadialGaugeProps) => (
  <RadialBarChart
    {...frameProps({
      height,
      width,
      ariaLabel: gaugeName(ariaLabel ?? (label || 'Gauge'), text),
      keyboard: false,
    })}
    data={[{ name: label, value: clampTo(value, min, max) }]}
    startAngle={90}
    endAngle={-270}
    innerRadius={hollow}
    outerRadius="100%"
    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
  >
    {defs && <defs>{defs}</defs>}
    <PolarAngleAxis type="number" domain={[min, max]} tick={false} axisLine={false} />
    <RadialBar dataKey="value" fill={fill} background={{ fill: TRACK }} {...ANIMATION} />
    <CenterText value={text} label={label} valueSize="var(--text-3xl, 1.875rem)" />
    {children}
  </RadialBarChart>
);
