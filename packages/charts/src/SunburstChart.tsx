import { useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from 'react';
import type { LegendPayload } from 'recharts';
import { ChartLegend, useHiddenSeries } from './core/ChartLegend';
import { TooltipCard } from './core/ChartTooltip';
import { MUTED, PANEL, TEXT, seriesColor } from './core/colors';
import { seriesKey } from './core/data';
import { ChartEmpty } from './core/frame';
import { textOn } from './core/readable';
import { shares } from './core/shares';
import { useControllableState } from './core/useControllableState';
import { useElementSize } from './core/useElementSize';
import { VISUALLY_HIDDEN } from './core/visuallyHidden';
import {
  arcPath,
  branches,
  findArc,
  isRelated,
  labelFits,
  labelPlacement,
  move,
  partition,
  percentLabel,
  polar,
  ringRadii,
  shadeOf,
  type Arc,
  type Move,
  type SunburstNode,
} from './sunburst';
import type { ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type { SunburstNode } from './sunburst';

export type SunburstChartProps = Omit<ChartProps, 'children'> &
  ChartEmptyProps &
  ChartLegendProps & {
    /**
     * The first ring: its nodes share the whole circle by their values, and
     * each node shares its arc among its `children`, ring after ring outward.
     * There is no single root; the sum of the first ring is the total. A node
     * with children takes the sum of theirs, and a `value` set on it is
     * ignored. A value that is not a positive finite number counts as none,
     * and a node with none has no arc. Four levels read well; more are drawn.
     * Names should be unique among siblings: a selection is a path of names.
     */
    data: SunburstNode[];
    /**
     * One color per node of the first ring, cycling; the rings after it are
     * lighter steps of it. Default: the Cosmos palette.
     */
    colors?: string[];
    /** Format the values, in the center, the tooltip and the legend. Default `String`. */
    formatValue?: (value: number) => string;
    /** The small text under the center value, in place of "Total". Drawn as plain text. */
    centerLabel?: string;
    /** The center value, in place of the total (which `formatValue` formats). Drawn as plain text. */
    centerValue?: string;
    /**
     * Write each branch's value (through `formatValue`) and its share of the
     * total in the legend, in whole percents that add up to 100. The figures
     * keep the whole data: hiding a branch does not move the others' share.
     */
    legendValues?: boolean;
    /**
     * Called with the path of a sector, the names from the first ring, when it
     * is clicked, or when Enter or Space is pressed on the one the keyboard
     * is on; with `[]` when the selected sector is picked again, or Escape is
     * pressed. It makes the sectors selectable: without it, the chart only
     * shows.
     */
    onSelect?: (path: string[]) => void;
    /**
     * The selected sector, as a path of names; `[]` for none. The selected
     * sector keeps its color with the sectors it belongs to and contains, and
     * the rest fades. Only `undefined` leaves the chart to hold its own selection.
     */
    selected?: string[];
    /** The sector selected at first, while the chart holds its own selection. */
    defaultSelected?: string[];
  };

// The circle is as large as its box allows, up to this many pixels, unless `height` is set.
const MAX_SIZE = 380;
// The sectors that are not on the line from the first ring to the active one.
const FADED = 0.3;
// The line between two sectors, in the color of the card.
const GAP = 2;
// Room the tooltip leaves the sector.
const TIP_GAP = 6;
// The center text is as wide as the hole, less this.
const CENTER_PAD = 12;
// Below this hole radius, the center has room for the value and the name only.
const SMALL_HOLE = 40;

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

const KEYS: Record<string, Move> = {
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  ArrowDown: 'child',
  ArrowUp: 'parent',
  Home: 'first',
  End: 'last',
};

/** The sectors as nested lists, for a screen reader: each node with its value, its children below it. */
const Outline = ({
  byParent,
  parent,
  format,
}: {
  byParent: Map<string | undefined, Arc[]>;
  parent?: string;
  format: (value: number) => string;
}) => {
  const items = byParent.get(parent);
  if (!items) return null;
  return (
    <ul>
      {items.map((arc) => (
        <li key={arc.id}>
          {`${arc.name}: ${format(arc.value)}`}
          <Outline byParent={byParent} parent={arc.id} format={format} />
        </li>
      ))}
    </ul>
  );
};

export const SunburstChart = ({
  data,
  colors,
  formatValue = String,
  centerLabel,
  centerValue,
  legendValues = false,
  legendPosition = 'right',
  onSelect,
  selected,
  defaultSelected,
  emptyMessage = 'No data',
  ariaLabel,
  height,
  width,
}: SunburstChartProps) => {
  const frame = useRef<HTMLDivElement>(null);
  const hidden = useHiddenSeries();
  const { ref: measure, width: boxWidth, height: boxHeight } = useElementSize();
  // The sector under the pointer, the one the keyboard is on, and the tab stop.
  const [hover, setHover] = useState<string>();
  const [ringed, setRinged] = useState<string>();
  const [roving, setRoving] = useState<string>();
  const [path, setPath] = useControllableState<string[]>({
    value: selected,
    defaultValue: defaultSelected ?? [],
    onChange: onSelect,
    name: 'SunburstChart.selected',
  });
  const selectable = onSelect !== undefined;

  const legendItems = branches(data);
  // The rings are those of the whole data, so hiding a branch does not change their thickness.
  const { rings } = partition(data);
  const off = new Set(
    legendItems.filter((item) => hidden.hidden.has(seriesKey(item.index))).map((item) => item.index)
  );
  const { arcs, total } = partition(data, off);
  const name = ariaLabel ?? `Sunburst chart: ${legendItems.map((item) => item.name).join(', ')}`;
  if (legendItems.length === 0) {
    return (
      <ChartEmpty message={emptyMessage} ariaLabel={name} height={height ?? 240} width={width} />
    );
  }

  const byId = new Map(arcs.map((arc) => [arc.id, arc]));
  const selectedArc = path.length > 0 ? findArc(arcs, path) : undefined;
  const hovered = hover === undefined ? undefined : byId.get(hover);
  const focused = ringed === undefined ? undefined : byId.get(ringed);
  const tipArc = hovered ?? focused;
  // What the rest fades from: the pointer, then the keyboard, then the selection.
  const active = tipArc ?? selectedArc;
  const tabbable = roving !== undefined && byId.has(roving) ? roving : arcs[0]?.id;

  const hueOf = (arc: Arc) => seriesColor(arc.branch, colors);
  const fillOf = (arc: Arc) =>
    arc.depth === 0
      ? hueOf(arc)
      : `color-mix(in oklab, ${hueOf(arc)} ${shadeOf(arc.depth)}%, ${PANEL})`;
  const shareName = (arc: Arc) =>
    arc.parent === undefined ? 'total' : (byId.get(arc.parent)?.name ?? 'total');
  const shareOf = (arc: Arc) =>
    percentLabel(
      arc.value,
      arc.parent === undefined ? total : (byId.get(arc.parent)?.value ?? total)
    );
  const nameOf = (arc: Arc) =>
    `${arc.path.join(', ')}: ${formatValue(arc.value)}, ${shareOf(arc)} of ${shareName(arc)}`;

  const pick = (arc: Arc) => setPath(selectedArc?.id === arc.id ? [] : arc.path);

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = (event.target as Element).closest<SVGElement>('[data-arc]')?.dataset.arc;
    if (from === undefined) return;
    const direction = KEYS[event.key];
    if (direction) {
      event.preventDefault();
      const to = move(arcs, from, direction);
      if (to) frame.current?.querySelector<SVGElement>(`[data-arc="${to.id}"]`)?.focus();
    } else if (selectable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const arc = byId.get(from);
      if (arc) pick(arc);
    } else if (selectable && event.key === 'Escape' && path.length > 0) {
      event.preventDefault();
      setPath([]);
    }
  };
  const focusArc = (event: FocusEvent<SVGElement>, id: string) => {
    setRoving(id);
    // A click focuses a sector too, and the pointer already shows its tooltip: only the keyboard needs this.
    if (event.currentTarget.matches(':focus-visible')) setRinged(id);
  };

  // The circle: as large as the box of the plot allows. Not drawn until it is measured.
  const size =
    boxWidth === undefined
      ? undefined
      : Math.floor(height === undefined ? boxWidth : Math.min(boxWidth, boxHeight ?? boxWidth));
  const side = legendPosition === 'left' || legendPosition === 'right';
  const legendFirst = legendPosition === 'top' || legendPosition === 'left';

  const picture =
    size !== undefined &&
    size > 0 &&
    (() => {
      const { hole, thickness } = ringRadii(size, rings);
      const centre = size / 2;
      const edges = (arc: Arc) => {
        const inner = hole + arc.depth * thickness;
        return { inner, outer: inner + thickness };
      };
      const outline = (arc: Arc) => {
        const { inner, outer: out } = edges(arc);
        return arcPath(centre, centre, inner, out, arc.start, arc.end);
      };
      const tipAt = (arc: Arc) => {
        const { inner } = edges(arc);
        const [x, y] = polar(centre, centre, inner + thickness / 2, (arc.start + arc.end) / 2);
        const align = x < size / 3 ? 'start' : x > (2 * size) / 3 ? 'end' : 'center';
        // Not enough room above for the card: it goes under.
        const below = y - thickness / 2 < 90;
        return {
          x,
          align,
          below,
          y: below ? y + thickness / 2 + TIP_GAP : y - thickness / 2 - TIP_GAP,
        };
      };
      const tip = tipArc && tipAt(tipArc);
      const parentName = tipArc?.path.slice(0, -1).join(' › ');
      return (
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ display: 'block' }}
          >
            {arcs.map((arc) => (
              <path
                key={arc.id}
                data-arc={arc.id}
                d={outline(arc)}
                fill={fillOf(arc)}
                stroke={PANEL}
                strokeWidth={GAP}
                strokeLinejoin="round"
                opacity={active && !isRelated(active, arc) ? FADED : 1}
                role={selectable ? 'button' : 'img'}
                aria-pressed={selectable ? selectedArc?.id === arc.id : undefined}
                aria-label={nameOf(arc)}
                tabIndex={arc.id === tabbable ? 0 : -1}
                style={{ outline: 'none', cursor: selectable ? 'pointer' : undefined }}
                onMouseEnter={() => setHover(arc.id)}
                onMouseLeave={() => setHover(undefined)}
                onClick={selectable ? () => pick(arc) : undefined}
                onFocus={(event) => focusArc(event, arc.id)}
                onBlur={() => setRinged(undefined)}
              />
            ))}
            {arcs.map((arc) => {
              const { inner } = edges(arc);
              const middle = inner + thickness / 2;
              if (!labelFits(arc.name, (arc.end - arc.start) * middle, thickness)) return null;
              const { x, y, rotate } = labelPlacement(centre, centre, middle, arc.start, arc.end);
              return (
                <text
                  key={arc.id}
                  data-arc-label={arc.id}
                  transform={`translate(${x} ${y}) rotate(${rotate})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity={active && !isRelated(active, arc) ? FADED : 1}
                  pointerEvents="none"
                  style={{
                    fill: textOn(fillOf(arc)),
                    fontSize: 'var(--text-xs, 0.75rem)',
                    fontWeight: 500,
                  }}
                >
                  {arc.name}
                </text>
              );
            })}
            {selectedArc && (
              <path
                d={outline(selectedArc)}
                data-sunburst-selected=""
                fill="none"
                stroke={TEXT}
                strokeWidth={2}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}
            {focused && (
              // The keyboard's ring, in the text color: an accent one would vanish on the sector.
              <path
                d={outline(focused)}
                data-sunburst-ring=""
                fill="none"
                stroke={TEXT}
                strokeWidth={2.5}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}
          </svg>
          <div
            data-sunburst-center=""
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: Math.max(hole * 2 - CENTER_PAD, 0),
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              lineHeight: 1.3,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                ...ellipsis,
                color: TEXT,
                fontSize: 'var(--text-2xl, 1.5rem)',
                fontWeight: 700,
              }}
            >
              {active ? formatValue(active.value) : (centerValue ?? formatValue(total))}
            </div>
            <div style={{ ...ellipsis, color: MUTED, fontSize: 'var(--text-xs, 0.75rem)' }}>
              {active ? active.name : (centerLabel ?? 'Total')}
            </div>
            {active && hole >= SMALL_HOLE && (
              <div style={{ ...ellipsis, color: MUTED, fontSize: 'var(--text-2xs, 0.6875rem)' }}>
                {percentLabel(active.value, total)} of total
              </div>
            )}
          </div>
          {tipArc && tip && (
            <div
              data-sunburst-tooltip=""
              style={{
                position: 'absolute',
                left: tip.x,
                top: tip.y,
                transform: `translate(${{ start: '0', center: '-50%', end: '-100%' }[tip.align]}, ${tip.below ? '0' : '-100%'})`,
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <TooltipCard
                title={parentName ? <bdi>{parentName}</bdi> : undefined}
                rows={[
                  { name: tipArc.name, value: formatValue(tipArc.value), color: fillOf(tipArc) },
                  {
                    name: 'Share of total',
                    value: percentLabel(tipArc.value, total),
                    color: 'transparent',
                  },
                ]}
              />
            </div>
          )}
        </div>
      );
    })();

  const percents = shares(legendItems.map((item) => item.value));
  const entries: LegendPayload[] = legendItems.map((item) => ({
    dataKey: seriesKey(item.index),
    value: item.name,
    color: seriesColor(item.index, colors),
  }));
  const legend = (
    <div style={side ? { flex: '0 1 15.5rem', minWidth: 0 } : { width: '100%' }}>
      <ChartLegend
        payload={entries}
        hidden={hidden.hidden}
        onToggle={hidden.toggle}
        column={side}
        detail={
          legendValues
            ? (index) => ({
                value: formatValue(legendItems[index].value),
                share: `${percents[index]}%`,
              })
            : undefined
        }
      />
    </div>
  );

  const byParent = new Map<string | undefined, Arc[]>();
  for (const arc of arcs) byParent.set(arc.parent, [...(byParent.get(arc.parent) ?? []), arc]);

  const plot: CSSProperties =
    height === undefined
      ? side
        ? { flex: '1 1 16rem', minWidth: 0, maxWidth: MAX_SIZE, aspectRatio: '1' }
        : { width: '100%', maxWidth: MAX_SIZE, aspectRatio: '1' }
      : { flex: '1 1 0', minWidth: 0, minHeight: 0, width: side ? undefined : '100%' };

  return (
    <div
      ref={frame}
      data-sunburst=""
      role="group"
      aria-label={name}
      onKeyDown={keyDown}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: side ? 'row' : 'column',
        flexWrap: side && height === undefined ? 'wrap' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem 1.5rem',
        width: width ?? '100%',
        height,
        maxWidth: '100%',
        minWidth: 0,
        // A chart keeps its left-to-right layout under `dir="rtl"`, as the Recharts ones do.
        direction: 'ltr',
      }}
    >
      {legendFirst && legend}
      <div
        ref={measure}
        data-sunburst-plot=""
        style={{ ...plot, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {picture}
      </div>
      {!legendFirst && legend}
      <div style={VISUALLY_HIDDEN}>
        <Outline byParent={byParent} format={formatValue} />
      </div>
    </div>
  );
};
