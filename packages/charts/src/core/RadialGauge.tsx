import type { ReactElement, ReactNode } from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import type { SectorProps } from 'recharts';
import { ANIMATION } from './animation';
import { TRACK } from './colors';
import { frameProps } from './frame';
import { clampTo, gaugeName } from './gauge';
import { CenterText } from './radial';
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
  fill?: string;
  /** Draws the arc, and the track under it, in place of the filled sectors. */
  shape?: (props: SectorProps) => ReactElement;
  /** What the chart defines for `fill`, such as a gradient. */
  defs?: ReactNode;
  children?: ReactNode;
};

/**
 * A full circle with one arc from the top, clockwise, on a neutral track, the
 * value in the middle over its label: the frame of `GradientRadial` and
 * `StrokedGauge`, which draw the arc and the track their own way. It is an image (out of the tab order) named by its value.
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
  shape,
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
    // The arc is as thick as the ring: no gap between the bar and its band.
    barCategoryGap={0}
    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
  >
    {defs && <defs>{defs}</defs>}
    <PolarAngleAxis type="number" domain={[min, max]} tick={false} axisLine={false} />
    <RadialBar
      dataKey="value"
      fill={fill}
      shape={shape}
      // Recharts draws a background sector of its own and cannot restyle it: a
      // `shape` that draws the track too hides it.
      background={shape ? false : { fill: TRACK }}
      {...ANIMATION}
    />
    <CenterText value={text} label={label} valueSize="var(--text-3xl, 1.875rem)" />
    {children}
  </RadialBarChart>
);
