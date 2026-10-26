import type { SectorProps } from 'recharts';
import { SERIES, TRACK } from './core/colors';
import { percent } from './core/radial';
import { RadialGauge } from './core/RadialGauge';
import type { ChartProps } from './types';

export type StrokedGaugeProps = ChartProps & {
  value: number;
  label?: string;
  /** Color of the arc. Default: the accent. */
  color?: string;
  /** Value at the start of the arc. Default 0. */
  min?: number;
  /** Value at the end of the arc, above `min`. Default 100. Out of range, the arc stops at an end. */
  max?: number;
  /** Format the center value, from `value` itself (not its share of the range). Default: `92%`. */
  formatValue?: (value: number) => string;
};

const RADIAN = Math.PI / 180;

// A Recharts sector is a filled shape, which cannot be dashed: the arc is
// drawn as a stroke of the sector's thickness along its middle line. Recharts
// angles run counter-clockwise from the right; the arc goes clockwise.
const arcPath = (cx: number, cy: number, r: number, from: number, to: number) => {
  const at = (angle: number) =>
    `${cx + r * Math.cos(-angle * RADIAN)} ${cy + r * Math.sin(-angle * RADIAN)}`;
  const sweep = Math.abs(to - from);
  // A single arc cannot close a circle: two halves.
  if (sweep >= 359.99)
    return `M${at(from)} A${r} ${r} 0 1 1 ${at(from - 180)} A${r} ${r} 0 1 1 ${at(from)}`;
  return `M${at(from)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${at(to)}`;
};

// Round dashes a little longer than the ring is thick, spaced so a whole
// number of them closes the circle: the arc and the track share the pattern
// and the same start, so the arc lights the dashes of the track.
const dashes = (thickness: number, r: number) => {
  const circumference = 2 * Math.PI * r;
  const step = circumference / Math.max(1, Math.round(circumference / (thickness * 2)));
  const dash = thickness * 0.4;
  return `${dash} ${step - dash}`;
};

// The whole circle in the same dashes, from the same start, behind the arc: the
// shape draws both from one set of sector props, so the arc lights the dashes
// of the track. It is called for an empty arc too.
const dashedGauge =
  (color: string) =>
  ({
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
  }: SectorProps) => {
    const thickness = Number(outerRadius) - Number(innerRadius);
    const r = (Number(outerRadius) + Number(innerRadius)) / 2;
    const [x, y, from, to] = [cx, cy, startAngle, endAngle].map(Number);
    const stroke = {
      fill: 'none',
      strokeWidth: thickness,
      strokeLinecap: 'round' as const,
      strokeDasharray: dashes(thickness, r),
    };
    return (
      <g>
        <path
          className="recharts-radial-bar-background-sector"
          d={arcPath(x, y, r, from, from - 360)}
          stroke={TRACK}
          {...stroke}
        />
        {/* A zero-length arc would still draw its round cap. */}
        {Math.abs(to - from) >= 0.01 && (
          <path
            className="recharts-radial-bar-sector"
            d={arcPath(x, y, r, from, to)}
            stroke={color}
            {...stroke}
          />
        )}
      </g>
    );
  };

export const StrokedGauge = ({
  value,
  label = '',
  color = SERIES[0],
  min = 0,
  max = 100,
  formatValue = percent,
  ariaLabel,
  children,
  height = 280,
  width,
}: StrokedGaugeProps) => (
  <RadialGauge
    value={value}
    label={label}
    min={min}
    max={max}
    text={formatValue(value)}
    ariaLabel={ariaLabel}
    hollow="88%"
    shape={dashedGauge(color)}
    height={height}
    width={width}
  >
    {children}
  </RadialGauge>
);
