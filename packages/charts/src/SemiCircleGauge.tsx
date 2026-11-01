import { useId } from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart, Sector, usePlotArea } from 'recharts';
import { ANIMATION } from './core/animation';
import { MUTED, PANEL, SERIES, TEXT, TRACK } from './core/colors';
import { safeId } from './core/data';
import { frameProps } from './core/frame';
import {
  arcAngle,
  arcMark,
  clampTo,
  DIAL_HEIGHT,
  DIAL_HUB,
  dialFace,
  dialTip,
  gaugeName,
  needleOf,
  percent,
  rangeShare,
  statusColor,
  STATUS_COLORS,
  trackRing,
  zoneSpans,
  type ZoneSpan,
} from './core/gauge';
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
   * A goal on the scale of `min`–`max`, drawn as a mark across the arc. Out of range, the mark
   * stops at an end of the arc, as the arc does. The target, formatted by `formatValue`, is read
   * after the value in the name of the gauge.
   */
  target?: number;
  /**
   * Draw the zones `warnAt` and `critAt` cut on the track, under the arc: the theme's success
   * color up to `warnAt`, its warning color up to `critAt`, its critical color after it, as
   * tints the arc stands out from. With one threshold the track has the two zones it cuts,
   * with none no zone. The thresholds join the name of the gauge, after the target. Default off.
   */
  showZones?: boolean;
  /**
   * Make the gauge a dial: no arc for the value, but a needle on a hub at the center of the half
   * circle, pointing at the value on the scale of `min`–`max` (out of range, it stops at an end).
   * The track is the plain one, or the zones with `showZones`, which `warnAt` and `critAt` cut:
   * the value no longer colors an arc, so `color` has nothing to color. The value and its label
   * are written under the hub, where the needle never crosses them, and under the range labels
   * when `showRange` is on. A dial takes 180px of `height` by default, for the room they take.
   * Default off.
   */
  showNeedle?: boolean;
  /**
   * The most the gauge takes, in pixels (default 120, 180 with `showNeedle`). The arc is as wide
   * as the box allows, up to this height: in a narrower box the gauge is shorter, never taller.
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
  /** A dial: the value is under the hub, not in the hollow. */
  dial: boolean;
};

// The value over its label on the base of the arc, inside its hollow, and the
// ends of the range under the two ends of the arc, starting at its outer edge
// so a long one is not cut by the box. A dial writes the value under its hub,
// from the top of its row down: `dy` in `em` follows the text size setting.
// Plain SVG text.
const Face = ({ radius, value, label, showRange, range, dial }: FaceProps) => {
  const area = usePlotArea();
  if (!area) return null;
  const cx = area.x + area.width / 2;
  const top = radius + dialFace({ hasLabel: label !== '', showRange }).top;
  return (
    <>
      {dial ? (
        <text data-chart-center="" textAnchor="middle" pointerEvents="none">
          <tspan
            x={cx}
            y={top}
            dy="0.8em"
            fill={TEXT}
            fontWeight={700}
            style={{ fontSize: 'var(--text-2xl, 1.5rem)' }}
          >
            {value}
          </tspan>
          {label && (
            <tspan x={cx} dy="1.5em" fill={MUTED} style={{ fontSize: 'var(--text-xs, 0.75rem)' }}>
              {label}
            </tspan>
          )}
        </text>
      ) : (
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
            <tspan
              x={cx}
              y={radius - 6}
              fill={MUTED}
              style={{ fontSize: 'var(--text-xs, 0.75rem)' }}
            >
              {label}
            </tspan>
          )}
        </text>
      )}
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

type TargetProps = { radius: number; thickness: number; share: number };

// A radial mark across the arc, a little longer than it is thick: a dark line over a
// halo in the card's color, so it reads on the arc, on the track and on the card.
const Target = ({ radius, thickness, share }: TargetProps) => {
  const area = usePlotArea();
  if (!area) return null;
  const mark = arcMark(
    { cx: area.x + area.width / 2, cy: radius },
    { inner: radius - thickness - 4, outer: radius + 4 },
    share
  );
  return (
    <g data-chart-target="" pointerEvents="none" strokeLinecap="round">
      <line {...mark} stroke={PANEL} strokeWidth={6} />
      <line {...mark} stroke={TEXT} strokeWidth={3} />
    </g>
  );
};

type ZonesProps = { radius: number; thickness: number; spans: ZoneSpan[] };

// A tint of a status color: the track shows through, and the arc, in the solid color, stands out.
const ZONE_SHARE = 40;

// The zones the thresholds cut on the track, over it and under the arc (the default layer sits
// between the track's and the arc's). Each is a plain sector, all cut to the track's own
// rounded shape so the ends of the track keep their caps.
const Zones = ({ radius, thickness, spans }: ZonesProps) => {
  const area = usePlotArea();
  const clip = safeId(useId());
  if (!area || spans.length === 0) return null;
  const ring = { cx: area.x + area.width / 2, cy: radius, ...trackRing(radius, thickness) };
  return (
    <g data-chart-zones="" pointerEvents="none">
      <clipPath id={clip}>
        <Sector {...ring} startAngle={180} endAngle={0} cornerRadius={thickness / 2} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {spans.map(({ status, from, to }) => (
          <g key={status} data-zone={status}>
            <Sector
              {...ring}
              startAngle={arcAngle(from)}
              endAngle={arcAngle(to)}
              fill={`color-mix(in srgb, ${STATUS_COLORS[status]} ${ZONE_SHARE}%, transparent)`}
              stroke="none"
            />
          </g>
        ))}
      </g>
    </g>
  );
};

type NeedleProps = { radius: number; thickness: number; share: number };

// The needle's width at the hub.
const NEEDLE_WIDTH = 6;

// A classic needle: a wedge from a hub at the center of the arc to halfway across the track.
// In the text color, over a halo in the card's color that keeps it apart from the zones and
// the track, drawn under the shapes so it does not cut the needle where it meets the hub.
const Needle = ({ radius, thickness, share }: NeedleProps) => {
  const area = usePlotArea();
  if (!area) return null;
  const hub = { cx: area.x + area.width / 2, cy: radius };
  const { tip, left, right } = needleOf(
    hub,
    { from: 0, to: dialTip(radius, thickness), halfWidth: NEEDLE_WIDTH / 2 },
    share
  );
  const shapes = (
    <>
      <polygon points={[tip, left, right].map(({ x, y }) => `${x},${y}`).join(' ')} />
      <circle cx={hub.cx} cy={hub.cy} r={DIAL_HUB} />
    </>
  );
  return (
    <g data-chart-needle="" pointerEvents="none">
      <g data-halo="" fill={PANEL} stroke={PANEL} strokeWidth={4} strokeLinejoin="round">
        {shapes}
      </g>
      <g data-shape="" fill={TEXT}>
        {shapes}
      </g>
    </g>
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
  target,
  showZones = false,
  showNeedle = false,
  ariaLabel,
  children,
  height,
  width,
}: SemiCircleGaugeProps) => {
  const { ref: box, width: boxWidth } = useElementWidth();
  const text = formatValue(value);
  // Under the arc: for a dial the hub, the value and its label (and the range labels); for the
  // plain gauge the `showRange` labels, or a margin without them.
  const row = showNeedle
    ? dialFace({ hasLabel: label !== '', showRange }).row
    : showRange
      ? RANGE_ROW
      : EDGE_ROW;
  // The arc fills the width, up to the height it is allowed.
  const room = height ?? (showNeedle ? DIAL_HEIGHT : 120);
  const radius = boxWidth === undefined ? 0 : Math.floor(Math.min(boxWidth / 2, room - row));
  const thickness = Math.min(24, Math.max(8, Math.round(radius * 0.2)));
  const byStatus = warnAt !== undefined || critAt !== undefined;
  const arc = color ?? (byStatus ? statusColor(value, warnAt, critAt) : SERIES[0]);
  const spans = showZones ? zoneSpans(min, max, warnAt, critAt) : [];
  // What the name adds after the value: the target, and the thresholds of the zones drawn.
  const notes = [
    ...(target === undefined ? [] : [`target ${formatValue(target)}`]),
    ...(warnAt !== undefined && spans.some((span) => span.status === 'warn')
      ? [`warning from ${formatValue(warnAt)}`]
      : []),
    ...(critAt !== undefined && spans.some((span) => span.status === 'crit')
      ? [`critical from ${formatValue(critAt)}`]
      : []),
  ];
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
            ariaLabel:
              gaugeName(ariaLabel ?? (label || 'Gauge'), text) +
              notes.map((note) => `, ${note}`).join(''),
            keyboard: false,
          })}
          // A dial has no arc for the value: a bar of no length draws nothing but the track.
          data={[{ name: label || 'value', value: showNeedle ? min : clampTo(value, min, max) }]}
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
          <Zones radius={radius} thickness={thickness} spans={spans} />
          {showNeedle && (
            <Needle radius={radius} thickness={thickness} share={rangeShare(value, min, max)} />
          )}
          <Face
            radius={radius}
            value={text}
            label={label}
            showRange={showRange}
            range={[formatValue(min), formatValue(max)]}
            dial={showNeedle}
          />
          {target !== undefined && (
            <Target radius={radius} thickness={thickness} share={rangeShare(target, min, max)} />
          )}
          {children}
        </RadialBarChart>
      )}
    </div>
  );
};
