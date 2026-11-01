import { STATUS_CRIT, STATUS_WARN, SUCCESS } from './colors';

/** A value as a percentage, the default `formatValue` of the radial charts. */
export const percent = (value: number) => `${value}%`;

/** The value clamped to `min`–`max`: a gauge's arc stops at an end, its text still gives the value. */
export const clampTo = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** The name a gauge is read by: `name` (the host's `ariaLabel`, else the label) and the formatted value. */
export const gaugeName = (name: string, formatted: string) => `${name}: ${formatted}`;

/**
 * The arc color of a status gauge: success, then warning from `warnAt` and
 * critical from `critAt`. A threshold left out is never reached.
 */
export const statusColor = (value: number, warnAt?: number, critAt?: number) =>
  value >= (critAt ?? Infinity)
    ? STATUS_CRIT
    : value >= (warnAt ?? Infinity)
      ? STATUS_WARN
      : SUCCESS;

/** Where `value` sits in `min`–`max`, from 0 (the start) to 1 (the end); one outside the range stops at an end. */
export const rangeShare = (value: number, min: number, max: number) =>
  (clampTo(value, min, max) - min) / (max - min);

/**
 * The two ends of a radial mark across a half-circle arc that opens upward,
 * centered on (`cx`, `cy`): at `share` of the arc (0 on the left end, 1 on the
 * right one), from the radius `inner` to the radius `outer`.
 */
export const arcMark = (
  { cx, cy }: { cx: number; cy: number },
  { inner, outer }: { inner: number; outer: number },
  share: number
) => {
  const angle = Math.PI * (1 - share);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return {
    x1: cx + inner * cos,
    y1: cy - inner * sin,
    x2: cx + outer * cos,
    y2: cy - outer * sin,
  };
};

/** What a stretch of the track says: fine, a warning, critical. */
export type GaugeStatus = 'ok' | 'warn' | 'crit';

/** A stretch of the track in one status, from `from` to `to`, as shares of the range (0 the start, 1 the end). */
export type ZoneSpan = { status: GaugeStatus; from: number; to: number };

/** The color of each status: the one `statusColor` gives the arc. */
export const STATUS_COLORS: Record<GaugeStatus, string> = {
  ok: SUCCESS,
  warn: STATUS_WARN,
  crit: STATUS_CRIT,
};

/**
 * The zones of a gauge's track, in order from the start: success up to `warnAt`,
 * warning up to `critAt`, critical after it, which is where `statusColor` turns
 * the arc. A threshold left out is never reached, so it has no zone, and none
 * set leaves no zone at all. A threshold outside `min`–`max` stops at an end, and
 * a zone that is left with no length is dropped.
 */
export const zoneSpans = (
  min: number,
  max: number,
  warnAt?: number,
  critAt?: number
): ZoneSpan[] => {
  if (warnAt === undefined && critAt === undefined) return [];
  const warn = warnAt === undefined ? 1 : rangeShare(warnAt, min, max);
  const crit = critAt === undefined ? 1 : rangeShare(critAt, min, max);
  const spans: ZoneSpan[] = [
    { status: 'ok', from: 0, to: Math.min(warn, crit) },
    // A warning threshold above the critical one is never reached: critical comes first.
    { status: 'warn', from: warn, to: crit },
    { status: 'crit', from: crit, to: 1 },
  ];
  return spans.filter((span) => span.to > span.from);
};

/**
 * The angle of a share of a half-circle arc that opens upward, in the degrees
 * Recharts reads (counterclockwise from the right): 180 on the left end of the
 * arc, 90 at the top, 0 on the right end.
 */
export const arcAngle = (share: number) => 180 - 180 * share;

type Point = { x: number; y: number };

/**
 * The three corners of a needle on the radius of a half-circle arc that opens
 * upward, at `share` of the arc, around (`cx`, `cy`): the `tip` at radius `to`,
 * and the two ends of its base at radius `from`, `halfWidth` either side of the
 * radius.
 */
export const needleOf = (
  { cx, cy }: { cx: number; cy: number },
  { from, to, halfWidth }: { from: number; to: number; halfWidth: number },
  share: number
): { tip: Point; left: Point; right: Point } => {
  const angle = Math.PI * (1 - share);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return {
    tip: { x: cx + to * cos, y: cy - to * sin },
    left: { x: cx + from * cos + halfWidth * sin, y: cy - from * sin + halfWidth * cos },
    right: { x: cx + from * cos - halfWidth * sin, y: cy - from * sin - halfWidth * cos },
  };
};

/**
 * The ring Recharts fills with a bar `thickness` thick, drawn in a band of the same
 * thickness (a `barSize` that fills its band): 90% of the band, centered, the offset
 * rounded to a pixel. What the zones and the needle of a half-circle gauge measure
 * against, so they sit on the track as it is drawn.
 */
export const trackRing = (radius: number, thickness: number) => {
  const size = thickness * 0.9;
  const innerRadius = radius - thickness + Math.round((thickness - size) / 2);
  return { innerRadius, outerRadius: innerRadius + size };
};

/** The radius of the hub a dial's needle pivots on, in px. */
export const DIAL_HUB = 6;

/**
 * The most a dial takes by default, in px: the room under the pivot for the
 * value over its label, and an arc as large as the one of a plain gauge.
 */
export const DIAL_HEIGHT = 180;

/**
 * Where the needle of a dial stops: halfway across the track, so it is on the
 * zones and not in the hollow.
 */
export const dialTip = (radius: number, thickness: number) => {
  const { innerRadius, outerRadius } = trackRing(radius, thickness);
  return (innerRadius + outerRadius) / 2;
};

// The gap under the hub, the row the range labels take when they are shown, and the room the
// value and the label take under it (at the largest text size), in px.
const FACE_GAP = 8;
const FACE_RANGE_BAND = 18;
const FACE_VALUE = 36;
const FACE_LABEL = 20;
const FACE_MARGIN = 4;

/**
 * What a dial puts under its pivot, in px: where the value starts below it (under the hub, and
 * under the range labels when they are shown), and the whole row the gauge adds to the radius,
 * with room for the label when there is one.
 */
export const dialFace = ({ hasLabel, showRange }: { hasLabel: boolean; showRange: boolean }) => {
  const top = DIAL_HUB + FACE_GAP + (showRange ? FACE_RANGE_BAND : 0);
  return { top, row: top + FACE_VALUE + (hasLabel ? FACE_LABEL : 0) + FACE_MARGIN };
};
