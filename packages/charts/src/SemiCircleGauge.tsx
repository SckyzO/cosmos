import { PolarAngleAxis, RadialBar, RadialBarChart, usePlotArea } from 'recharts';
import { ANIMATION } from './core/animation';
import { MUTED, SERIES, TEXT, TRACK } from './core/colors';
import { frameProps } from './core/frame';
import { clampTo, gaugeName, percent, statusColor } from './core/gauge';
import { useElementWidth } from './core/useElementWidth';
import type { ChartProps } from './types';

export type SemiCircleGaugeProps = Omit<ChartProps, 'height'> & {
  value: number;
  label?: string;
  /**
   * Color of the arc. Default: the accent, or the theme's status colors when
   * `warnAt` or `critAt` is set.
   */
  color?: string;
  /** Value at the start of the arc. Default 0. */
  min?: number;
  /** Value at the end of the arc, above `min`. Default 100. Out of range, the arc stops at an end. */
  max?: number;
  /**
   * Value from which the arc turns to the theme's warning color. Setting it (or
   * `critAt`) colors the arc by status: the theme's success color below, the
   * warning color from `warnAt`, the critical color from `critAt`. Without
   * either, the arc keeps one color, so a gauge where higher is better (an
   * uptime, a score) does not turn red.
   */
  warnAt?: number;
  /** Value from which the arc turns to the theme's critical color. See `warnAt`. */
  critAt?: number;
  /**
   * Format the center value, from `value` itself (not its share of the range), and the
   * `showRange` labels. Default: `67%`.
   */
  formatValue?: (value: number) => string;
  /** Write `min` and `max`, formatted, under the two ends of the arc. Default off. */
  showRange?: boolean;
  /**
   * The most the gauge takes, in pixels (default 120). The arc is as wide as the box allows, up
   * to this height: in a narrower box the gauge is shorter, never taller.
   */
  height?: number;
};

// Room under the arc: the `showRange` labels, and a margin without them.
const RANGE_ROW = 20;
const EDGE_ROW = 4;
// The value, from the text tokens, large enough for the arc it sits in.
const valueSize = (radius: number) =>
  radius >= 110
    ? 'var(--text-3xl, 1.875rem)'
    : radius >= 80
      ? 'var(--text-2xl, 1.5rem)'
      : 'var(--text-xl, 1.25rem)';

type FaceProps = {
  radius: number;
  value: string;
  label: string;
  showRange: boolean;
  range: [string, string];
};

// The value over its label on the base of the arc, inside its hollow, and the
// ends of the range under the two ends of the arc, starting at its outer edge
// so a long one is not cut by the box. Plain SVG text.
const Face = ({ radius, value, label, showRange, range }: FaceProps) => {
  const area = usePlotArea();
  if (!area) return null;
  const cx = area.x + area.width / 2;
  return (
    <>
      <text data-chart-center="" textAnchor="middle" pointerEvents="none">
        <tspan
          x={cx}
          y={radius - (label ? 24 : 8)}
          fill={TEXT}
          fontWeight={700}
          style={{ fontSize: valueSize(radius) }}
        >
          {value}
        </tspan>
        {label && (
          <tspan x={cx} y={radius - 6} fill={MUTED} style={{ fontSize: 'var(--text-xs, 0.75rem)' }}>
            {label}
          </tspan>
        )}
      </text>
      {showRange &&
        ([-1, 1] as const).map((side, i) => (
          <text
            key={side}
            data-chart-range=""
            x={cx + side * radius}
            y={radius + 14}
            textAnchor={side < 0 ? 'start' : 'end'}
            fill={MUTED}
            pointerEvents="none"
            style={{ fontSize: 'var(--text-2xs, 0.6875rem)' }}
          >
            {range[i]}
          </text>
        ))}
    </>
  );
};

export const SemiCircleGauge = ({
  value,
  label = '',
  color,
  min = 0,
  max = 100,
  warnAt,
  critAt,
  formatValue = percent,
  showRange = false,
  ariaLabel,
  children,
  height = 120,
  width,
}: SemiCircleGaugeProps) => {
  const { ref: box, width: boxWidth } = useElementWidth();
  const text = formatValue(value);
  const row = showRange ? RANGE_ROW : EDGE_ROW;
  // The arc fills the width, up to the height it is allowed.
  const radius = boxWidth === undefined ? 0 : Math.floor(Math.min(boxWidth / 2, height - row));
  const thickness = Math.min(24, Math.max(8, Math.round(radius * 0.2)));
  const byStatus = warnAt !== undefined || critAt !== undefined;
  const arc = color ?? (byStatus ? statusColor(value, warnAt, critAt) : SERIES[0]);
  return (
    <div
      ref={box}
      style={{ width: width ?? '100%', maxWidth: '100%', height: radius + row, minHeight: row }}
    >
      {radius > 0 && (
        <RadialBarChart
          {...frameProps({
            height: radius + row,
            width: '100%',
            ariaLabel: gaugeName(ariaLabel ?? (label || 'Gauge'), text),
            keyboard: false,
          })}
          data={[{ name: label || 'value', value: clampTo(value, min, max) }]}
          cx="50%"
          cy={radius}
          startAngle={180}
          endAngle={0}
          innerRadius={radius - thickness}
          outerRadius={radius}
          barSize={thickness}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <PolarAngleAxis type="number" domain={[min, max]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            fill={arc}
            cornerRadius={thickness / 2}
            background={{ fill: TRACK, cornerRadius: thickness / 2 }}
            {...ANIMATION}
          />
          <Face
            radius={radius}
            value={text}
            label={label}
            showRange={showRange}
            range={[formatValue(min), formatValue(max)]}
          />
          {children}
        </RadialBarChart>
      )}
    </div>
  );
};
