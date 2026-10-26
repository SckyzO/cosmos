import { geoNaturalEarth1, geoPath } from 'd3-geo';
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { TooltipCard } from './core/ChartTooltip';
import { BORDER, MUTED, PANEL, SEQUENTIAL, TEXT, TRACK } from './core/colors';
import { NUMERIC_TO_ALPHA2 } from './world-map-codes';
import { ranked, scaleOf, stepOf, walk, type Scale } from './world-map';
import type { ChartProps } from './types';

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

type Shape = {
  /** Alpha-2 code, when the feature has an id the table knows. */
  code?: string;
  name: string;
  /** The SVG path. */
  d: string;
};

type Country = Shape & { value?: number; step?: number };

type Tip = {
  code: string;
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
 * fitted to the width of the box, and the height of the box that holds them.
 */
const shapesOf = (geography: Topology): { shapes: Shape[]; viewHeight: number } => {
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
  return { shapes, viewHeight: Math.ceil(bottom) + MARGIN };
};

export const WorldMap = ({
  data,
  geography,
  formatValue = String,
  label,
  min,
  max,
  showLegend = true,
  onSelect,
  ariaLabel,
  height,
  width,
}: WorldMapProps) => {
  const frame = useRef<HTMLDivElement>(null);
  const { shapes, viewHeight } = useMemo(() => shapesOf(geography), [geography]);
  const [hover, setHover] = useState<Tip>();
  const [focus, setFocus] = useState<Tip>();
  // The country the keyboard last stood on, which Tab comes back to.
  const [lastKey, setLastKey] = useState<string>();

  const valued = shapes.map((shape): Country => {
    const value = shape.code === undefined ? undefined : data[shape.code];
    return { ...shape, value: Number.isFinite(value) ? value : undefined };
  });
  const order = ranked(
    valued.filter((country): country is Country & { code: string } => country.code !== undefined)
  );
  const scale = scaleOf(
    order.map((country) => country.value),
    min,
    max
  );
  const countries = valued.map((country): Country => ({
    ...country,
    step: scale && country.value !== undefined ? stepOf(country.value, scale) : undefined,
  }));
  const byCode = new Map(
    countries.flatMap((country) => (country.code ? [[country.code, country] as const] : []))
  );
  const interactive = order.length > 0;
  const stepColor = (step: number | undefined) => (step === undefined ? TRACK : SEQUENTIAL[step]);

  const name =
    ariaLabel ??
    (interactive
      ? `World map, ${label ?? 'value'} by country, from ${formatValue(order[order.length - 1].value)} to ${formatValue(order[0].value)}`
      : 'World map');

  const tip = hover ?? focus;
  const tipCountry = tip && byCode.get(tip.code);

  // The card hangs from the side of the anchor nearest the middle of the map,
  // so it never leaves the box.
  const anchor = (code: string, x: number, top: number, bottom: number, gap: number): Tip => {
    const host = (frame.current as HTMLElement).getBoundingClientRect();
    const middle = x - host.left;
    const align =
      middle < host.width / 3 ? 'start' : middle > (2 * host.width) / 3 ? 'end' : 'center';
    return {
      code,
      x: middle,
      top: top - host.top - gap,
      bottom: bottom - host.top + gap,
      align,
      // Not enough room above for the card: it goes under.
      below: top - host.top < 90,
    };
  };
  const tipAtPointer = (code: string, event: { clientX: number; clientY: number }) =>
    anchor(code, event.clientX, event.clientY, event.clientY, POINTER_GAP - TIP_GAP);
  const tipAtCountry = (code: string): Tip | undefined => {
    const element = frame.current?.querySelector<SVGPathElement>(`[data-code="${code}"]`);
    if (!element) return undefined;
    const box = element.getBoundingClientRect();
    const middle = box.top + box.height / 2;
    return anchor(code, box.left + box.width / 2, middle, middle, 0);
  };

  const goTo = (country: { code: string } | undefined) => {
    if (!country) return;
    setLastKey(country.code);
    setFocus(tipAtCountry(country.code));
  };

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = focus?.code ?? lastKey;
    const targets: Record<string, () => { code: string } | undefined> = {
      ArrowRight: () => walk(order, current, 1),
      ArrowDown: () => walk(order, current, 1),
      ArrowLeft: () => walk(order, current, -1),
      ArrowUp: () => walk(order, current, -1),
      Home: () => order[0],
      End: () => order[order.length - 1],
    };
    if (targets[event.key]) {
      event.preventDefault();
      goTo(targets[event.key]());
    } else if (onSelect && (event.key === 'Enter' || event.key === ' ') && focus) {
      event.preventDefault();
      onSelect(focus.code);
    }
  };
  const focusIn = (event: FocusEvent<HTMLDivElement>) => {
    // A click focuses the map too, and would leave a tooltip up: only the keyboard shows it.
    if (event.target === event.currentTarget && event.currentTarget.matches(':focus-visible')) {
      goTo(order.find((country) => country.code === lastKey) ?? order[0]);
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
  const active = tipCountry?.value === undefined ? undefined : tipCountry;

  const legend = showLegend && scale && <Legend scale={scale} format={formatValue} />;

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
                onMouseEnter={has ? (event) => setHover(tipAtPointer(code, event)) : undefined}
                onMouseMove={has ? (event) => setHover(tipAtPointer(code, event)) : undefined}
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
        </svg>
        {tip && tipCountry && tipCountry.value !== undefined && tipStyle && (
          <div data-world-tooltip="" aria-hidden style={tipStyle}>
            <TooltipCard
              title={tipCountry.name}
              rows={[
                {
                  name: label ?? 'Value',
                  value: formatValue(tipCountry.value),
                  color: stepColor(tipCountry.step),
                },
              ]}
            />
          </div>
        )}
        {interactive && (
          <span data-world-status="" role="status" aria-live="polite" style={HIDDEN}>
            {focus && tipCountry && tipCountry.value !== undefined
              ? `${tipCountry.name}, ${label ?? 'Value'}: ${formatValue(tipCountry.value)}`
              : ''}
          </span>
        )}
      </div>
      {interactive && (
        <div style={HIDDEN}>
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
        </div>
      )}
      {legend}
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
