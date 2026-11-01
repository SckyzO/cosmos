import { geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { TooltipCard, type TooltipRow } from './core/ChartTooltip';
import {
  BORDER,
  INTENT_COLORS,
  MUTED,
  PANEL,
  SEQUENTIAL,
  SERIES,
  TEXT,
  TRACK,
} from './core/colors';
import { useElementSize } from './core/useElementSize';
import { NUMERIC_TO_ALPHA2 } from './world-map-codes';
import {
  byValue,
  finiteValue,
  jump,
  keySizes,
  markerMaxRadius,
  markerRadius,
  ranked,
  resolveRoutes,
  ROUTE_WIDTH,
  routePath,
  routeWidth,
  scaleOf,
  stepOf,
  stopId,
  stopsOf,
  usableMarkers,
  walk,
  type ResolvedRoute,
  type Scale,
  type Stop,
} from './world-map';
import type { ChartIntent, ChartProps } from './types';

export type WorldMapMarker = {
  /**
   * Names the marker: a route's `from` and `to` point at it by this. Keep it
   * unique: of two markers with the same `id`, the first is drawn.
   */
  id: string;
  /**
   * Where the marker sits: longitude, then latitude, in degrees (`[2.35, 48.86]`
   * is Paris). A marker whose position is not on the globe is not drawn.
   */
  coordinates: [longitude: number, latitude: number];
  /**
   * What the marker is called: the title of its tooltip, what a screen reader
   * reads and the row of the reading table. Drawn as plain text.
   */
  label: string;
  /**
   * The area of the bubble, and the figure in its tooltip (through
   * `formatValue`, named by the map's `label`). Without one, or with a value
   * that is not a finite number, the marker is a dot of the smallest size and
   * its tooltip gives the name alone.
   */
  value?: number;
  /**
   * Draws the marker in a status color of the theme. Default: the second
   * series color, which is never one of the five steps of the countries.
   */
  intent?: ChartIntent;
};

export type WorldMapRoute = {
  /** Where the route starts: the `id` of a marker, or a position (longitude, then latitude). */
  from: string | [longitude: number, latitude: number];
  /** Where the route ends: the `id` of a marker, or a position. */
  to: string | [longitude: number, latitude: number];
  /**
   * The width of the line, and the figure in the tooltip (through
   * `formatValue`, named by the map's `label`). Without one, the narrowest line.
   */
  value?: number;
  /**
   * The title of the tooltip, and the name a screen reader reads. Default:
   * `Rotterdam → New York` from the names of the markers at its ends, or from
   * the coordinates of an end that is a position. Drawn as plain text.
   */
  label?: string;
};

export type WorldMapProps = Omit<ChartProps, 'children'> & {
  /**
   * The value of each country, keyed by ISO 3166-1 alpha-2 code in upper case
   * (`FR`, `US`). A code the `geography` does not hold is not drawn, and a
   * value that is not a finite number counts as none.
   */
  data: Record<string, number>;
  /**
   * The map: a TopoJSON `Topology` with a `countries` object, such as
   * `world-atlas/countries-110m.json` or `countries-50m.json`. The package
   * ships no map data. A country is a feature whose `id` is its ISO 3166-1
   * numeric code and whose `properties.name` is the name the tooltip and the
   * reading table give; a feature without an id (Kosovo) is drawn and never
   * takes a value. Antarctica is left out.
   */
  geography: Topology;
  /** Format the values, in the tooltip, the legend and the table. Default `String`. */
  formatValue?: (value: number) => string;
  /** Names the value in the tooltip, such as `visitors`. Default `Value`. */
  label?: string;
  /**
   * Clamp the values to this end before the color steps are cut: a value under
   * `min` counts as `min`. The legend starts at `min`. Default: the lowest value.
   */
  min?: number;
  /** Clamp the values to this end before the color steps are cut: a value over `max` counts as `max`. Default: no limit. */
  max?: number;
  /** Show the legend: the lower bound of each step, and a swatch for countries without data. Default true. Never shown without a value to draw. */
  showLegend?: boolean;
  /**
   * Called with the code of a country that has a value when it is clicked, or
   * when Enter or Space is pressed on the one the keyboard is on. Without it,
   * the map only shows.
   */
  onSelect?: (code: string) => void;
  /**
   * Points on the map, drawn as bubbles above the countries and the routes,
   * the smallest on top. The radius is in screen pixels (a sixtieth of the
   * width of the map, from 6 to 16px, for the largest value), so a map in a
   * narrow box keeps readable markers. Each has a touch target of 24px at least.
   * A marker is not drawn when its position is not on the globe.
   */
  markers?: WorldMapMarker[];
  /**
   * Lines between two points: great circles, the shortest way on the globe,
   * which a projection draws as a curve and cuts at the antimeridian. They are
   * drawn under the markers, with a width that follows the value. A route that
   * names a marker `markers` does not hold, that has an end off the globe, or
   * that starts where it ends, is not drawn. Hover and the keyboard read a
   * route; it cannot be clicked.
   */
  routes?: WorldMapRoute[];
  /**
   * Called with a marker when it is clicked, or when Enter or Space is pressed
   * on the one the keyboard is on. Without it, the markers only show.
   */
  onMarkerSelect?: (marker: WorldMapMarker) => void;
};

// The map is drawn in a box this wide, as tall as the map needs (about 470), and
// scaled to the width it is given.
const VIEW_WIDTH = 960;
// Room left around the map for the strokes at its edge.
const MARGIN = 2;
// world-atlas gives Antarctica the id 010. It would take a fifth of the box for no data.
const ANTARCTICA = '010';
// Room the tooltip card leaves the pointer or the country.
const TIP_GAP = 6;
const POINTER_GAP = 14;
// A marker is a 24px target at least (WCAG 2.5.8), in screen pixels.
const TARGET_RADIUS = 12;
// What a pointer must be within of a route to read it, and the card-colored
// edge that separates a route from the country under it, in screen pixels.
const ROUTE_REACH = 14;
const ROUTE_EDGE = 2.5;
// The line of the route the pointer or the keyboard is on is this much wider,
// and the others fade to this opacity.
const ROUTE_ACTIVE = 1.5;
const ROUTE_FADED = 0.25;
// The markers and the routes are the second series color unless given an intent.
const MARKER_COLOR = SERIES[1];

type Shape = {
  /** Alpha-2 code, when the feature has an id the table knows. */
  code?: string;
  name: string;
  /** The SVG path. */
  d: string;
};

type Country = Shape & { value?: number; step?: number };

type Tip = Stop & {
  /** Where the card is anchored, in px from the map's corner, and on which side. */
  x: number;
  top: number;
  bottom: number;
  align: 'start' | 'center' | 'end';
  below: boolean;
};

// Visually hidden, still read by screen readers.
const HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * The countries of the topology as SVG paths in the Natural Earth projection,
 * fitted to the width of the box, the height of the box that holds them, and
 * the projection and the path generator the markers and routes are drawn with.
 */
const shapesOf = (
  geography: Topology
): { shapes: Shape[]; viewHeight: number; projection: GeoProjection; path: GeoPath } => {
  const countries = geography.objects.countries;
  if (!countries) {
    throw new Error('WorldMap: `geography` has no `countries` object');
  }
  const collection = feature(geography, countries);
  const features = (
    collection.type === 'FeatureCollection' ? collection.features : [collection]
  ).filter((item) => String(item.id).padStart(3, '0') !== ANTARCTICA);
  const world = { type: 'FeatureCollection' as const, features };
  // `fitWidth` puts the map's top left corner at 0,0: shift it by the margin.
  const projection = geoNaturalEarth1().fitWidth(VIEW_WIDTH - 2 * MARGIN, world);
  const [x, y] = projection.translate();
  projection.translate([x + MARGIN, y + MARGIN]);
  const path = geoPath(projection);
  const [, [, bottom]] = path.bounds(world);
  const shapes = features.flatMap((item): Shape[] => {
    const d = path(item);
    if (!d) return [];
    const name = item.properties?.name;
    return [
      {
        code:
          item.id === undefined ? undefined : NUMERIC_TO_ALPHA2[String(item.id).padStart(3, '0')],
        name: typeof name === 'string' ? name : '',
        d,
      },
    ];
  });
  return { shapes, viewHeight: Math.ceil(bottom) + MARGIN, projection, path };
};

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export const WorldMap = ({
  data,
  geography,
  formatValue = String,
  label,
  min,
  max,
  showLegend = true,
  onSelect,
  markers,
  routes,
  onMarkerSelect,
  ariaLabel,
  height,
  width,
}: WorldMapProps) => {
  const frame = useRef<HTMLDivElement>(null);
  const { shapes, viewHeight, projection, path } = useMemo(() => shapesOf(geography), [geography]);
  // The markers and the routes are in screen pixels: how many viewBox units one is.
  const { ref: measureMap, width: mapWidth, height: mapHeight } = useElementSize<SVGSVGElement>();
  const scale = mapWidth && mapHeight ? Math.min(mapWidth / VIEW_WIDTH, mapHeight / viewHeight) : 1;
  const px = 1 / scale;
  const [hover, setHover] = useState<Tip>();
  const [focus, setFocus] = useState<Tip>();
  // The stop the keyboard last stood on, which Tab comes back to.
  const [lastKey, setLastKey] = useState<string>();

  const valued = shapes.map((shape): Country => {
    const value = shape.code === undefined ? undefined : data[shape.code];
    return { ...shape, value: Number.isFinite(value) ? value : undefined };
  });
  const order = ranked(
    valued.filter((country): country is Country & { code: string } => country.code !== undefined)
  );
  const colorScale = scaleOf(
    order.map((country) => country.value),
    min,
    max
  );
  const countries = valued.map((country): Country => ({
    ...country,
    step: colorScale && country.value !== undefined ? stepOf(country.value, colorScale) : undefined,
  }));
  const byCode = new Map(
    countries.flatMap((country) => (country.code ? [[country.code, country] as const] : []))
  );
  const stepColor = (step: number | undefined) => (step === undefined ? TRACK : SEQUENTIAL[step]);

  // The markers, the largest first so the smallest are drawn above them and
  // walked after them, and the routes between them.
  const placed = useMemo(() => usableMarkers(markers ?? []), [markers]);
  const dots = useMemo(
    () =>
      placed.flatMap((marker) => {
        const point = projection(marker.coordinates);
        return point ? [{ marker, x: point[0], y: point[1] }] : [];
      }),
    [placed, projection]
  );
  const lines = useMemo(
    () =>
      resolveRoutes(placed, routes ?? []).flatMap((route) => {
        const d = routePath(path, route.from, route.to);
        return d ? [{ ...route, d }] : [];
      }),
    [placed, routes, path]
  );
  const markerOrder = byValue(
    dots.map((dot) => ({ ...dot, label: dot.marker.label, value: finiteValue(dot.marker.value) }))
  );
  const routeOrder = byValue(
    lines.map((line) => ({ line, label: routeName(line), value: line.value }))
  ).map(({ line }) => line);
  const markerById = new Map(markerOrder.map((dot) => [dot.marker.id, dot]));
  const routeByKey = new Map(routeOrder.map((line) => [String(line.index), line]));
  const stops = stopsOf({
    countries: order.map((country) => country.code),
    markers: markerOrder.map((dot) => dot.marker.id),
    routes: routeOrder.map((line) => String(line.index)),
  });
  const interactive = stops.length > 0;

  const largestMarker = Math.max(0, ...markerOrder.map((dot) => dot.value ?? 0));
  const largestRoute = Math.max(0, ...routeOrder.map((line) => line.value ?? 0));
  const maxRadius = markerMaxRadius(VIEW_WIDTH * scale);
  const radiusOf = (value: number | undefined) => markerRadius(value, largestMarker, maxRadius);
  const markerColor = (marker: WorldMapMarker) =>
    (marker.intent && INTENT_COLORS[marker.intent]) || MARKER_COLOR;

  const name =
    ariaLabel ??
    [
      'World map',
      ...(order.length > 0
        ? [
            `${label ?? 'value'} by country, from ${formatValue(order[order.length - 1].value)} to ${formatValue(order[0].value)}`,
          ]
        : []),
      ...(dots.length > 0 ? [plural(dots.length, 'marker')] : []),
      ...(lines.length > 0 ? [plural(lines.length, 'route')] : []),
    ].join(', ');

  const tip = hover ?? focus;

  // What the card and the screen reader say about a stop: the country, the
  // marker or the route, with its value when it has one.
  const describe = (
    stop: Stop
  ): { title: ReactNode; announced: string; rows: TooltipRow[] } | undefined => {
    const measure = label ?? 'Value';
    const row = (value: number | undefined, color: string): TooltipRow[] =>
      value === undefined ? [] : [{ name: measure, value: formatValue(value), color }];
    const said = (title: string, value: number | undefined) =>
      value === undefined ? title : `${title}, ${measure}: ${formatValue(value)}`;
    if (stop.kind === 'country') {
      const country = byCode.get(stop.key);
      if (!country || country.value === undefined) return undefined;
      return {
        title: country.name,
        announced: said(country.name, country.value),
        rows: row(country.value, stepColor(country.step)),
      };
    }
    if (stop.kind === 'marker') {
      const dot = markerById.get(stop.key);
      if (!dot) return undefined;
      return {
        title: dot.marker.label,
        announced: said(dot.marker.label, dot.value),
        rows: row(dot.value, markerColor(dot.marker)),
      };
    }
    const line = routeByKey.get(stop.key);
    if (!line) return undefined;
    return {
      title: line.label ?? (
        // The arrow points from the start to the end whatever the direction of the page.
        <bdi dir="ltr">{`${line.fromName} → ${line.toName}`}</bdi>
      ),
      announced: said(routeName(line), line.value),
      rows: row(line.value, MARKER_COLOR),
    };
  };
  const info = tip && describe(tip);

  // The card hangs from the side of the anchor nearest the middle of the map,
  // so it never leaves the box.
  const anchor = (stop: Stop, x: number, top: number, bottom: number, gap: number): Tip => {
    const host = (frame.current as HTMLElement).getBoundingClientRect();
    const middle = x - host.left;
    const align =
      middle < host.width / 3 ? 'start' : middle > (2 * host.width) / 3 ? 'end' : 'center';
    return {
      ...stop,
      x: middle,
      top: top - host.top - gap,
      bottom: bottom - host.top + gap,
      align,
      // Not enough room above for the card: it goes under.
      below: top - host.top < 90,
    };
  };
  const tipAtPointer = (stop: Stop, event: { clientX: number; clientY: number }) =>
    anchor(stop, event.clientX, event.clientY, event.clientY, POINTER_GAP - TIP_GAP);
  const elementOf = (stop: Stop): Element | undefined => {
    const host = frame.current;
    if (!host) return undefined;
    if (stop.kind === 'country')
      return host.querySelector(`[data-code="${stop.key}"]`) ?? undefined;
    const attribute = stop.kind === 'marker' ? 'data-marker' : 'data-route';
    return [...host.querySelectorAll(`[${attribute}]`)].find(
      (element) => element.getAttribute(attribute) === stop.key
    );
  };
  const tipAtStop = (stop: Stop): Tip | undefined => {
    const element = elementOf(stop);
    if (!element) return undefined;
    const box = element.getBoundingClientRect();
    const x = box.left + box.width / 2;
    // The card of a marker sits above or under its bubble; the others, on the middle of the shape.
    if (stop.kind === 'marker') return anchor(stop, x, box.top, box.bottom, TIP_GAP);
    const middle = box.top + box.height / 2;
    return anchor(stop, x, middle, middle, 0);
  };

  const goTo = (stop: Stop | undefined) => {
    if (!stop) return;
    setLastKey(stopId(stop));
    setFocus(tipAtStop(stop));
  };

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = focus ? stopId(focus) : lastKey;
    const targets: Record<string, () => Stop | undefined> = {
      ArrowRight: () => walk(stops, current, 1),
      ArrowDown: () => walk(stops, current, 1),
      ArrowLeft: () => walk(stops, current, -1),
      ArrowUp: () => walk(stops, current, -1),
      PageDown: () => jump(stops, current, 1),
      PageUp: () => jump(stops, current, -1),
      Home: () => stops[0],
      End: () => stops[stops.length - 1],
    };
    if (targets[event.key]) {
      event.preventDefault();
      goTo(targets[event.key]());
    } else if ((event.key === 'Enter' || event.key === ' ') && focus) {
      if (focus.kind === 'country' && onSelect) {
        event.preventDefault();
        onSelect(focus.key);
      } else if (focus.kind === 'marker' && onMarkerSelect) {
        event.preventDefault();
        const dot = markerById.get(focus.key);
        if (dot) onMarkerSelect(dot.marker);
      }
    }
  };
  const focusIn = (event: FocusEvent<HTMLDivElement>) => {
    // A click focuses the map too, and would leave a tooltip up: only the keyboard shows it.
    if (event.target === event.currentTarget && event.currentTarget.matches(':focus-visible')) {
      goTo(stops.find((stop) => stopId(stop) === lastKey) ?? stops[0]);
    }
  };
  const focusOut = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocus(undefined);
  };

  const tipStyle: CSSProperties | undefined = tip && {
    position: 'absolute',
    left: tip.x,
    top: tip.below ? tip.bottom : tip.top,
    transform: `translate(${{ start: '0', center: '-50%', end: '-100%' }[tip.align]}, ${tip.below ? '0' : '-100%'})`,
    zIndex: 10,
    pointerEvents: 'none',
  };
  const tipCountry = tip?.kind === 'country' ? byCode.get(tip.key) : undefined;
  const active = tipCountry?.value === undefined ? undefined : tipCountry;
  const activeMarker = tip?.kind === 'marker' ? markerById.get(tip.key) : undefined;
  const activeRoute = tip?.kind === 'route' ? tip.key : undefined;

  // The keys of the sizes and of the widths, next to the steps of the countries.
  const sizes = keySizes(largestMarker, maxRadius).map((value) => ({
    value,
    radius: radiusOf(value),
  }));
  const widths = routeValues(routeOrder);
  const legend = showLegend && (colorScale || sizes.length > 0 || widths.length > 0) && (
    <Legends scale={colorScale} format={formatValue} sizes={sizes} widths={widths} />
  );

  return (
    <div
      data-world-map=""
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: width ?? '100%',
        height,
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <div
        ref={frame}
        role={interactive ? 'application' : undefined}
        aria-label={interactive ? name : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={interactive ? keyDown : undefined}
        onFocus={interactive ? focusIn : undefined}
        onBlur={interactive ? focusOut : undefined}
        style={{
          position: 'relative',
          flex: height === undefined ? undefined : '1 1 0',
          minHeight: 0,
          // The country outline and the tooltip show where the keyboard is.
          outline: 'none',
        }}
      >
        <svg
          ref={measureMap}
          role="img"
          aria-label={name}
          viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
          style={{
            display: 'block',
            width: '100%',
            height: height === undefined ? 'auto' : '100%',
          }}
        >
          {countries.map((country, i) => {
            const code = country.code;
            const has = code !== undefined && country.value !== undefined;
            const stop: Stop = { kind: 'country', key: code ?? '' };
            return (
              <path
                key={i}
                d={country.d}
                data-code={has ? code : undefined}
                data-step={country.step}
                fill={stepColor(country.step)}
                stroke={PANEL}
                strokeWidth={0.5}
                strokeLinejoin="round"
                style={has && onSelect ? { cursor: 'pointer' } : undefined}
                onMouseEnter={has ? (event) => setHover(tipAtPointer(stop, event)) : undefined}
                onMouseMove={has ? (event) => setHover(tipAtPointer(stop, event)) : undefined}
                onMouseLeave={has ? () => setHover(undefined) : undefined}
                onClick={has && onSelect ? () => onSelect(code) : undefined}
              />
            );
          })}
          {active && (
            // The same outline for the pointer and the keyboard, in the text color:
            // an accent one would vanish on the darkest steps. Drawn last to sit
            // above the neighbors' borders.
            <path
              d={active.d}
              data-world-active=""
              fill="none"
              stroke={TEXT}
              strokeWidth={1.6}
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
          {routeOrder.map((line) => {
            const stop: Stop = { kind: 'route', key: String(line.index) };
            const wide = routeWidth(line.value, largestRoute);
            const here = (event: { clientX: number; clientY: number }) =>
              setHover(tipAtPointer(stop, event));
            return (
              <g
                key={line.index}
                opacity={activeRoute !== undefined && activeRoute !== stop.key ? ROUTE_FADED : 1}
              >
                {/* The edge in the color of the card, so a route reads over any country. */}
                <path
                  d={line.d}
                  fill="none"
                  stroke={PANEL}
                  strokeOpacity={0.85}
                  strokeWidth={(wide + ROUTE_EDGE) * px}
                  strokeLinecap="round"
                />
                <path
                  d={line.d}
                  data-route={line.index}
                  fill="none"
                  stroke={MARKER_COLOR}
                  strokeOpacity={0.92}
                  strokeWidth={wide * (activeRoute === stop.key ? ROUTE_ACTIVE : 1) * px}
                  strokeLinecap="round"
                />
                <path
                  d={line.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={ROUTE_REACH * px}
                  pointerEvents="stroke"
                  onMouseEnter={here}
                  onMouseMove={here}
                  onMouseLeave={() => setHover(undefined)}
                />
              </g>
            );
          })}
          {markerOrder.map(({ marker, x, y, value }) => {
            const stop: Stop = { kind: 'marker', key: marker.id };
            const radius = radiusOf(value);
            const here = (event: { clientX: number; clientY: number }) =>
              setHover(tipAtPointer(stop, event));
            return (
              <g
                key={marker.id}
                style={onMarkerSelect ? { cursor: 'pointer' } : undefined}
                onMouseEnter={here}
                onMouseMove={here}
                onMouseLeave={() => setHover(undefined)}
                onClick={onMarkerSelect ? () => onMarkerSelect(marker) : undefined}
              >
                <circle
                  data-marker={marker.id}
                  cx={x}
                  cy={y}
                  r={radius * px}
                  fill={markerColor(marker)}
                  fillOpacity={0.85}
                  stroke={PANEL}
                  strokeWidth={1.5 * px}
                />
                {/* The target of the pointer: 24px at least, whatever the bubble. */}
                <circle cx={x} cy={y} r={Math.max(radius, TARGET_RADIUS) * px} fill="transparent" />
              </g>
            );
          })}
          {activeMarker && (
            <circle
              data-world-active=""
              cx={activeMarker.x}
              cy={activeMarker.y}
              r={(radiusOf(activeMarker.value) + 2) * px}
              fill="none"
              stroke={TEXT}
              strokeWidth={1.6 * px}
              pointerEvents="none"
            />
          )}
        </svg>
        {tip && info && tipStyle && (
          <div data-world-tooltip="" aria-hidden style={tipStyle}>
            <TooltipCard title={info.title} rows={info.rows} />
          </div>
        )}
        {interactive && (
          <span data-world-status="" role="status" aria-live="polite" style={HIDDEN}>
            {focus ? (describe(focus)?.announced ?? '') : ''}
          </span>
        )}
      </div>
      {interactive && (
        <div style={HIDDEN}>
          {order.length > 0 && (
            <table data-world-table="">
              <caption>{name}</caption>
              <thead>
                <tr>
                  <th scope="col">Country</th>
                  <th scope="col">{label ?? 'Value'}</th>
                </tr>
              </thead>
              <tbody>
                {order.map((country) => (
                  <tr key={country.code}>
                    <th scope="row">{country.name}</th>
                    <td>{formatValue(country.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {markerOrder.length > 0 && (
            <ReadingTable
              kind="markers"
              caption="Markers"
              first="Marker"
              measure={label ?? 'Value'}
              rows={markerOrder.map((dot) => ({
                key: dot.marker.id,
                name: dot.marker.label,
                value: dot.value === undefined ? undefined : formatValue(dot.value),
              }))}
            />
          )}
          {routeOrder.length > 0 && (
            <ReadingTable
              kind="routes"
              caption="Routes"
              first="Route"
              measure={label ?? 'Value'}
              rows={routeOrder.map((line) => ({
                key: String(line.index),
                name: routeName(line),
                value: line.value === undefined ? undefined : formatValue(line.value),
              }))}
            />
          )}
        </div>
      )}
      {legend}
    </div>
  );
};

/** What names a route in plain text: the label it was given, or `Rotterdam to New York`. */
const routeName = (line: ResolvedRoute) => line.label ?? `${line.fromName} to ${line.toName}`;

/** The smallest and the largest value of the routes that have one: what the width key spans. */
const routeValues = (lines: readonly { value?: number }[]): number[] => {
  const values = lines.flatMap((line) => (line.value === undefined ? [] : [line.value]));
  return values.length === 0 ? [] : [Math.min(...values), Math.max(...values)];
};

/**
 * The table of the markers or of the routes, for a screen reader: a name and a
 * value. The value column is left out when none of the rows has one.
 */
const ReadingTable = ({
  kind,
  caption,
  first,
  measure,
  rows,
}: {
  kind: 'markers' | 'routes';
  caption: string;
  first: string;
  measure: string;
  rows: { key: string; name: string; value?: string }[];
}) => {
  const valued = rows.some((row) => row.value !== undefined);
  return (
    <table data-world-table={kind}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{first}</th>
          {valued && <th scope="col">{measure}</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row">{row.name}</th>
            {valued && <td>{row.value}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * What the legend holds: the steps of the countries, then the sizes of the
 * bubbles, then the widths of the lines, in one row that wraps. With the steps
 * alone it is the steps' own list, as it was before markers and routes.
 */
const Legends = ({
  scale,
  format,
  sizes,
  widths,
}: {
  scale?: Scale;
  format: (value: number) => string;
  sizes: { value: number; radius: number }[];
  /** The smallest and the largest value of the routes, or none. */
  widths: number[];
}) => {
  const steps = scale && <Legend scale={scale} format={format} />;
  if (sizes.length === 0 && widths.length === 0) return steps || null;
  return (
    <div
      data-world-keys=""
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        columnGap: '1.5rem',
        rowGap: '0.5rem',
        fontSize: 'var(--text-2xs, 0.6875rem)',
        color: MUTED,
      }}
    >
      {steps}
      {sizes.length > 0 && (
        <ul
          data-world-size-key=""
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.625rem',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {sizes.map(({ value, radius }) => {
            const side = Math.ceil(radius * 2 + 2);
            return (
              <li
                key={value}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <svg aria-hidden width={side} height={side} viewBox={`0 0 ${side} ${side}`}>
                  <circle
                    cx={side / 2}
                    cy={side / 2}
                    r={radius}
                    fill={MARKER_COLOR}
                    fillOpacity={0.85}
                    stroke={PANEL}
                    strokeWidth={1.5}
                  />
                </svg>
                <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {format(value)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {widths.length > 0 && (
        <div
          data-world-width-key=""
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <svg aria-hidden width={54} height={10} viewBox="0 0 54 10">
            {/* The narrowest line and the widest, on the same scale as the routes. */}
            {widths[0] !== widths[1] && (
              <line
                x1={1}
                y1={5}
                x2={25}
                y2={5}
                stroke={MARKER_COLOR}
                strokeWidth={ROUTE_WIDTH.min}
                strokeLinecap="round"
              />
            )}
            <line
              x1={widths[0] === widths[1] ? 1 : 29}
              y1={5}
              x2={53}
              y2={5}
              stroke={MARKER_COLOR}
              strokeWidth={ROUTE_WIDTH.max}
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {widths[0] === widths[1]
              ? format(widths[0])
              : `${format(widths[0])} to ${format(widths[1])}`}
          </span>
        </div>
      )}
    </div>
  );
};

const Legend = ({ scale, format }: { scale: Scale; format: (value: number) => string }) => (
  <ul
    data-world-legend=""
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      columnGap: 2,
      rowGap: '0.5rem',
      margin: 0,
      padding: 0,
      listStyle: 'none',
      fontSize: 'var(--text-2xs, 0.6875rem)',
      color: MUTED,
    }}
  >
    {SEQUENTIAL.map((color, i) => (
      <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: '2.75rem' }}>
        <span
          aria-hidden
          data-world-swatch=""
          style={{ height: 10, borderRadius: 2, background: color }}
        />
        <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {format(scale.bounds[i])}+
        </span>
      </li>
    ))}
    <li style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: '0.75rem' }}>
      <span
        aria-hidden
        data-world-swatch=""
        style={{
          width: '1.75rem',
          height: 10,
          borderRadius: 2,
          background: TRACK,
          border: `1px solid ${BORDER}`,
          boxSizing: 'border-box',
        }}
      />
      <span style={{ whiteSpace: 'nowrap' }}>No data</span>
    </li>
  </ul>
);
