// The maths of WorldMap: the five color steps of a set of values, the step of a
// value, the bounds the legend prints, the size of the markers and the routes,
// and the order the keyboard walks the map in. No DOM and no colors, so it runs
// in plain Node.

import type { GeoPath } from 'd3-geo';

/** How many color steps the scale has. */
export const STEPS = 5;

export type Scale = {
  /** The lower bound of steps 1 to 4: a value at or above `thresholds[i]` is in step `i + 1` at least. */
  thresholds: number[];
  /** The lower bound of each step, step 0 first: what the legend prints. */
  bounds: number[];
  /** The ends values are clamped to, or `undefined` for none. */
  min?: number;
  max?: number;
};

/** The value kept inside `min` and `max`; an end that is not given leaves that side open. */
export const clamp = (value: number, min?: number, max?: number): number =>
  Math.min(Math.max(value, min ?? -Infinity), max ?? Infinity);

/**
 * The scale of a set of values: five steps by quantiles, so each step holds
 * about as many countries. The thresholds are the values a fifth, two fifths…
 * of the way up the sorted list, which a linear scale cannot do: one large
 * country would otherwise wash every other one out. A repeated value can
 * leave a step empty (all values equal: only the top step is used).
 *
 * `min` and `max` clamp every value before the quantiles are taken (a value
 * under `min` counts as `min`, one over `max` as `max`), so an outlier takes
 * the top step without stretching the others. `min` is also the first bound
 * the legend prints. Given the wrong way round they are swapped. `undefined`
 * when there is no finite value.
 */
export const scaleOf = (
  values: readonly number[],
  min?: number,
  max?: number
): Scale | undefined => {
  const [low, high] = min !== undefined && max !== undefined && min > max ? [max, min] : [min, max];
  const sorted = values
    .filter(Number.isFinite)
    .map((value) => clamp(value, low, high))
    .sort((a, b) => a - b);
  if (sorted.length === 0) return undefined;
  const thresholds = [1, 2, 3, 4].map((q) => sorted[Math.floor((sorted.length * q) / STEPS)]);
  return { thresholds, bounds: [low ?? sorted[0], ...thresholds], min: low, max: high };
};

/** The step, 0 to 4, of a value: the number of thresholds it reaches. */
export const stepOf = (value: number, scale: Scale): number => {
  const clamped = clamp(value, scale.min, scale.max);
  return scale.thresholds.filter((threshold) => clamped >= threshold).length;
};

/** The countries that have a value, largest first and, for equal values, by name: the order of the keyboard walk and of the hidden table. */
export const ranked = <T extends { name: string; value?: number }>(
  countries: readonly T[]
): (T & { value: number })[] =>
  countries
    .filter((country): country is T & { value: number } => country.value !== undefined)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

// ── Markers and routes ────────────────────────────────────────────────────────

/** A point on the globe: longitude, then latitude, in degrees. */
export type Position = [longitude: number, latitude: number];

/** The end of a route: the `id` of a marker, or a position. */
export type RouteEnd = string | Position;

/** The value if it is a finite number, `undefined` otherwise: what the map counts as no value. */
export const finiteValue = (value: number | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const isPosition = (position: unknown): position is Position =>
  Array.isArray(position) &&
  position.length === 2 &&
  Number.isFinite(position[0]) &&
  Number.isFinite(position[1]) &&
  Math.abs(position[1]) <= 90;

/** The latitude, then the longitude, to a tenth of a degree: `48.9°N, 2.4°E`. */
export const positionLabel = ([longitude, latitude]: Position): string =>
  `${Math.abs(latitude).toFixed(1)}°${latitude < 0 ? 'S' : 'N'}, ` +
  `${Math.abs(longitude).toFixed(1)}°${longitude < 0 ? 'W' : 'E'}`;

/** The smallest radius of a marker, in screen pixels: a marker with no value has it. */
export const MARKER_MIN_RADIUS = 3;
const MARKER_MAX_RADIUS = { min: 6, max: 16 };

/** The radius, in screen pixels, of the marker with the largest value: a sixtieth of the width of the map, from 6 to 16px. */
export const markerMaxRadius = (mapWidth: number): number =>
  clamp(mapWidth / 60, MARKER_MAX_RADIUS.min, MARKER_MAX_RADIUS.max);

/**
 * The radius of a marker, in screen pixels. The area follows the value, which
 * is how a bubble is read: `maxRadius` for the largest value, half of it for a
 * quarter of it, never under `MARKER_MIN_RADIUS`. A marker with no value, a
 * value of 0 or less, or nothing to compare it with, has the smallest radius.
 */
export const markerRadius = (
  value: number | undefined,
  largest: number,
  maxRadius: number
): number =>
  value === undefined || !(value > 0) || !(largest > 0)
    ? MARKER_MIN_RADIUS
    : Math.max(MARKER_MIN_RADIUS, maxRadius * Math.sqrt(Math.min(value, largest) / largest));

/** The narrowest and the widest line of a route, in screen pixels: the legend draws both. */
export const ROUTE_WIDTH = { min: 1.2, max: 3.6 };

/** The width of a route's line, in screen pixels, from the narrowest for no value to the widest for the largest. */
export const routeWidth = (value: number | undefined, largest: number): number =>
  value === undefined || !(value > 0) || !(largest > 0)
    ? ROUTE_WIDTH.min
    : ROUTE_WIDTH.min + (ROUTE_WIDTH.max - ROUTE_WIDTH.min) * Math.min(value / largest, 1);

/**
 * The values the legend draws a bubble for: the largest, and the quarter and
 * the sixteenth of it (half and a quarter of its radius) rounded to two
 * figures, smallest first. A bubble is left out when its radius would fall
 * under the floor, since it would be drawn as large as the one above it.
 */
export const keySizes = (largest: number, maxRadius: number): number[] => {
  if (!Number.isFinite(largest) || !(largest > 0)) return [];
  const smaller = [largest / 16, largest / 4]
    .map((value) => Number(value.toPrecision(2)))
    .filter((value) => maxRadius * Math.sqrt(value / largest) >= MARKER_MIN_RADIUS);
  return [...new Set([...smaller, largest])].sort((a, b) => a - b);
};

/**
 * The markers with a position on the globe, a longitude and a latitude that
 * are finite numbers with the latitude between -90 and 90. Of two markers with
 * the same `id`, the first is kept: a route names a marker by it.
 */
export const usableMarkers = <M extends { id: string; coordinates: Position }>(
  markers: readonly M[]
): M[] => {
  const seen = new Set<string>();
  return markers.filter((marker) => {
    if (!isPosition(marker.coordinates) || seen.has(marker.id)) return false;
    seen.add(marker.id);
    return true;
  });
};

/** A route with both ends on the globe. */
export type ResolvedRoute = {
  /** Where the route stood in the list the host gave: its key. */
  index: number;
  from: Position;
  to: Position;
  /** What names an end: the `label` of its marker, or its coordinates. */
  fromName: string;
  toName: string;
  /** The `label` the host gave the route, if any. */
  label?: string;
  value?: number;
};

/**
 * The routes with both ends on the globe, each end read from the marker it
 * names or taken as the position it is. A route that names a marker that is
 * not in `markers`, has an end that is not on the globe, or starts where it
 * ends, is left out: there is nothing to draw. Pass `markers` through
 * `usableMarkers` first.
 */
export const resolveRoutes = (
  markers: readonly { id: string; coordinates: Position; label: string }[],
  routes: readonly { from: RouteEnd; to: RouteEnd; value?: number; label?: string }[]
): ResolvedRoute[] => {
  const byId = new Map(markers.map((marker) => [marker.id, marker]));
  const end = (point: RouteEnd) => {
    if (typeof point === 'string') {
      const marker = byId.get(point);
      return marker && { position: marker.coordinates, name: marker.label };
    }
    return isPosition(point) ? { position: point, name: positionLabel(point) } : undefined;
  };
  return routes.flatMap((route, index): ResolvedRoute[] => {
    const from = end(route.from);
    const to = end(route.to);
    if (!from || !to) return [];
    if (from.position[0] === to.position[0] && from.position[1] === to.position[1]) return [];
    return [
      {
        index,
        from: from.position,
        to: to.position,
        fromName: from.name,
        toName: to.name,
        label: route.label,
        value: finiteValue(route.value),
      },
    ];
  });
};

/** The items with the largest value first and, for equal values, by label; what has no value goes last, by label. */
export const byValue = <T extends { label: string; value?: number }>(items: readonly T[]): T[] =>
  [...items].sort((a, b) => {
    const x = finiteValue(a.value);
    const y = finiteValue(b.value);
    if (x === undefined || y === undefined) {
      return x === y ? a.label.localeCompare(b.label) : x === undefined ? 1 : -1;
    }
    return y - x || a.label.localeCompare(b.label);
  });

/**
 * The line of a route: the great circle between its ends, which a projection
 * draws as a curve, cut where it crosses the antimeridian (a route from
 * Shanghai to Los Angeles leaves by the right edge of the map and comes in by
 * the left one, as the shortest way does). A straight line on the map would
 * cross the whole of Eurasia. `path` is the `geoPath` of the map's projection.
 */
export const routePath = (path: GeoPath, from: Position, to: Position): string | null =>
  path({ type: 'LineString', coordinates: [from, to] });

// ── Keyboard ──────────────────────────────────────────────────────────────────

export type StopKind = 'country' | 'marker' | 'route';

/** Where the keyboard can stand: a country, a marker or a route, by its key. */
export type Stop = { kind: StopKind; key: string };

/** A stop as one string: a country and a marker may have the same key. */
export const stopId = ({ kind, key }: Stop): string => `${kind}:${key}`;

/** The one list the arrow keys walk: the countries, then the markers, then the routes, each in the order given. */
export const stopsOf = ({
  countries,
  markers,
  routes,
}: {
  countries: readonly string[];
  markers: readonly string[];
  routes: readonly string[];
}): Stop[] => [
  ...countries.map((key): Stop => ({ kind: 'country', key })),
  ...markers.map((key): Stop => ({ kind: 'marker', key })),
  ...routes.map((key): Stop => ({ kind: 'route', key })),
];

/** The stop `delta` places from the stop `current` (by `stopId`), stopping at the ends; the first one when `current` is not in the list. */
export const walk = (
  order: readonly Stop[],
  current: string | undefined,
  delta: number
): Stop | undefined => {
  const index = order.findIndex((stop) => stopId(stop) === current);
  if (index < 0) return order[0];
  return order[Math.min(Math.max(index + delta, 0), order.length - 1)];
};

/**
 * The first stop of the next group (`delta` 1) or of the previous one (-1):
 * the groups are the countries, the markers and the routes. It stays on the
 * last group going forward, and goes to the first stop of the list from the
 * first group going back. The first stop when `current` is not in the list.
 */
export const jump = (
  order: readonly Stop[],
  current: string | undefined,
  delta: 1 | -1
): Stop | undefined => {
  const index = order.findIndex((stop) => stopId(stop) === current);
  if (index < 0) return order[0];
  const { kind } = order[index];
  if (delta > 0) return order.find((stop, i) => i > index && stop.kind !== kind) ?? order[index];
  const before = order
    .slice(0, index)
    .reverse()
    .find((stop) => stop.kind !== kind);
  return before ? order.find((stop) => stop.kind === before.kind) : order[0];
};
