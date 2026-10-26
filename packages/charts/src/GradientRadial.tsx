import { useId } from 'react';
import { SERIES, SUCCESS } from './core/colors';
import { safeId } from './core/data';
import { percent } from './core/radial';
import { RadialGauge } from './core/RadialGauge';
import type { ChartProps } from './types';

export type GradientRadialProps = ChartProps & {
  value: number;
  label?: string;
  /** Color the arc starts from, fading to the theme's success color. Default: the accent. */
  color?: string;
  /** Value at the start of the arc. Default 0. */
  min?: number;
  /** Value at the end of the arc, above `min`. Default 100. Out of range, the arc stops at an end. */
  max?: number;
  /** Format the center value, from `value` itself (not its share of the range). Default: `84%`. */
  formatValue?: (value: number) => string;
};

export const GradientRadial = ({
  value,
  label = 'Score',
  color = SERIES[0],
  min = 0,
  max = 100,
  formatValue = percent,
  ariaLabel,
  children,
  height = 280,
  width,
}: GradientRadialProps) => {
  const id = safeId(useId());
  return (
    <RadialGauge
      value={value}
      label={label}
      min={min}
      max={max}
      text={formatValue(value)}
      ariaLabel={ariaLabel}
      hollow="70%"
      fill={`url(#${id})`}
      defs={
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={SUCCESS} />
        </linearGradient>
      }
      height={height}
      width={width}
    >
      {children}
    </RadialGauge>
  );
};
