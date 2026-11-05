import { useId } from 'react';
import { SERIES, SUCCESS } from './core/colors';
import { safeId } from './core/data';
import { percent } from './core/gauge';
import {
  GRADIENT_RADIAL_LABELS,
  type CommonChartLabels,
  type GradientRadialLabels,
} from './core/labels';
import { useChartLabels } from './core/labelsContext';
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
  /** The texts it writes, over `ChartLabelsProvider`'s `gradientRadial` and `chart` and the English defaults. */
  labels?: Partial<CommonChartLabels & GradientRadialLabels>;
};

export const GradientRadial = ({
  value,
  label,
  color = SERIES[0],
  min = 0,
  max = 100,
  formatValue = percent,
  labels: ownLabels,
  ariaLabel,
  children,
  height = 280,
  width,
}: GradientRadialProps) => {
  const labels = useChartLabels('gradientRadial', GRADIENT_RADIAL_LABELS, ownLabels);
  const id = safeId(useId());
  return (
    <RadialGauge
      value={value}
      label={label ?? labels.label}
      min={min}
      max={max}
      text={formatValue(value)}
      ariaLabel={ariaLabel}
      labels={labels}
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
