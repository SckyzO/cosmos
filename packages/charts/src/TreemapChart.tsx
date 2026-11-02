import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { Tooltip, Treemap, type TooltipContentProps, type TreemapNode } from 'recharts';
import { ANIMATION } from './core/animation';
import { TooltipCard } from './core/ChartTooltip';
import { MUTED, PANEL, TEXT, TRACK, seriesColor } from './core/colors';
import { hasNoData } from './core/data';
import { ChartEmpty, ChartSkeleton } from './core/frame';
import { textOn } from './core/readable';
import type { ChartEmptyProps, ChartLoadingProps, ChartProps } from './types';

export type TreemapDatum = { x: string; y: number };

export type TreemapChartProps = ChartProps &
  ChartEmptyProps &
  ChartLoadingProps & {
    series: { name?: string; data: TreemapDatum[] }[];
    /**
     * Override the default Cosmos palette. Tiles are colored by name, in the
     * order the names first appear: one name keeps its color in every group.
     */
    colors?: string[];
    /** Format the values in the tooltip and on the tiles. */
    formatValue?: (value: number) => string;
    /**
     * Write each tile's value, formatted, under its name. Default off: the name alone, and the
     * value in the tooltip.
     */
    showValues?: boolean;
  };

/** What a tile carries from the data to the content that draws it. */
type Tile = {
  name: string;
  value: number;
  /** Zero-based position among the tiles, in the order of the data: the order of the arrow keys. */
  tile: number;
  color: string;
  /** The group it sits in, when there are several series. */
  group?: string;
};

type TileNode = TreemapNode & Partial<Tile>;

// Room the label leaves around its text, and the smallest tile that has one.
const PAD = 8;
const MIN_LABEL = { width: 44, height: 28 };
// The group title sits on the corner of its first tile, over the top of its label.
const TITLE_HEIGHT = 24;

const asTile = (node: TileNode): Tile | undefined =>
  node.tile === undefined
    ? undefined
    : {
        name: node.name,
        value: node.value,
        tile: node.tile,
        color: node.color as string,
        group: node.group,
      };

type TileViewProps = {
  node: TileNode;
  /** Whether the group title sits on this tile: the first of its group. */
  titled: boolean;
  tabbable: boolean;
  ring: boolean;
  showValues: boolean;
  format: (value: number) => string;
  onFocusTile: (event: FocusEvent<SVGGElement>, tile: number) => void;
  onBlurTile: (event: FocusEvent<SVGGElement>) => void;
};

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

/**
 * One tile: a rounded rectangle with the card's color for an outline (the gap
 * between tiles), the name and the value in the text color that reads on it,
 * and a focus ring in the theme's text color, since an accent ring would
 * vanish on the accent tile.
 */
const TileView = ({
  node,
  titled,
  tabbable,
  ring,
  showValues,
  format,
  onFocusTile,
  onBlurTile,
}: TileViewProps) => {
  const tile = asTile(node);
  // A group draws nothing of its own: its tiles are drawn over it.
  if (!tile) return <g />;
  const { x, y, width, height } = node;
  const label = tile.group ? `${tile.group}, ${tile.name}` : tile.name;
  return (
    <g
      data-tile={tile.tile}
      role="img"
      aria-label={`${label}: ${format(tile.value)}`}
      tabIndex={tabbable ? 0 : -1}
      onFocus={(event) => onFocusTile(event, tile.tile)}
      onBlur={onBlurTile}
      style={{ outline: 'none' }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        fill={tile.color}
        stroke={PANEL}
        strokeWidth={2}
      />
      {ring && (
        <rect
          x={x + 3}
          y={y + 3}
          width={Math.max(width - 6, 0)}
          height={Math.max(height - 6, 0)}
          rx={3}
          fill="none"
          stroke={TEXT}
          strokeWidth={2}
          pointerEvents="none"
        />
      )}
      {width >= MIN_LABEL.width && height >= MIN_LABEL.height + (titled ? TITLE_HEIGHT : 0) && (
        // HTML in the SVG: the browser clips the text to the tile and sizes it
        // with the text size setting.
        <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none">
          <div
            style={{
              boxSizing: 'border-box',
              width: '100%',
              height: '100%',
              padding: titled ? `${PAD + TITLE_HEIGHT}px ${PAD}px ${PAD}px` : PAD,
              overflow: 'hidden',
              color: textOn(tile.color),
              fontSize: 'var(--text-xs, 0.75rem)',
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            <div style={ellipsis}>{tile.name}</div>
            {showValues && (
              <div style={{ ...ellipsis, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                {format(tile.value)}
              </div>
            )}
          </div>
        </foreignObject>
      )}
      {titled && tile.group && (
        // The name of a group, on the corner of its first tile, in the card's colors.
        <foreignObject
          x={x}
          y={y}
          width={Math.min(width, 180)}
          height={TITLE_HEIGHT + 2}
          pointerEvents="none"
        >
          <div
            style={{
              ...ellipsis,
              display: 'inline-block',
              maxWidth: '100%',
              boxSizing: 'border-box',
              padding: '2px 8px',
              color: TEXT,
              background: PANEL,
              border: `1px solid ${TRACK}`,
              borderRadius: '0 0 5px 0',
              fontSize: 'var(--text-xs, 0.75rem)',
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            {tile.group}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

/** The tooltip card: the group (if any) for the title, the tile for the row. */
const TreemapTooltip = ({
  active,
  payload,
  format,
}: Partial<TooltipContentProps> & { format: (value: number) => string }) => {
  const tile = active && payload?.length ? asTile(payload[0].payload as TileNode) : undefined;
  if (!tile) return null;
  return (
    <TooltipCard
      title={tile.group}
      rows={[{ name: tile.name, value: format(tile.value), color: tile.color }]}
    />
  );
};

// A Treemap has no keyboard layer. It shows a tile's tooltip when the pointer
// enters the tile and hides it when the pointer leaves the chart, so the tile
// that takes the keyboard focus sends those two events to itself.
const pointerOver = (element: Element) =>
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
const pointerOut = (element: Element) =>
  element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));

export const TreemapChart = ({
  series,
  colors,
  formatValue = String,
  showValues = false,
  emptyMessage = 'No data',
  loading,
  ariaLabel,
  children,
  height = 320,
  width = '100%',
}: TreemapChartProps) => {
  const frame = useRef<HTMLDivElement>(null);
  const [roving, setRoving] = useState(0);
  const [ringed, setRinged] = useState<number>();
  const name = ariaLabel ?? `Treemap: ${series.flatMap((s) => s.data.map((d) => d.x)).join(', ')}`;
  if (loading) return <ChartSkeleton ariaLabel={name} height={height} width={width} />;
  // A tile with no area cannot be seen, hovered or focused.
  const drawn = series.map((s) => ({ ...s, data: s.data.filter((d) => d.y > 0) }));
  if (hasNoData(drawn)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  // One color per name, so a name has the same color in every group.
  const colorByName = new Map<string, string>();
  for (const { data } of drawn) {
    for (const { x } of data) {
      if (!colorByName.has(x)) colorByName.set(x, seriesColor(colorByName.size, colors));
    }
  }
  let count = 0;
  const toTile =
    (group?: string) =>
    (datum: TreemapDatum): Tile => ({
      name: datum.x,
      value: datum.y,
      tile: count++,
      color: colorByName.get(datum.x) as string,
      group,
    });
  // Several series are groups, each a block of its own; a single one is just its tiles.
  const grouped = drawn.length > 1;
  const groups = grouped
    ? drawn.map((s, i) => {
        const group = s.name ?? `Series ${i + 1}`;
        return { name: group, children: s.data.map(toTile(group)) };
      })
    : [];
  const data = grouped ? groups : drawn[0].data.map(toTile());
  const firstOfGroup = new Set(grouped ? groups.map((group) => group.children[0].tile) : []);
  // The tab stop stays on a tile that exists when the data shrinks.
  const tabbable = Math.min(roving, count - 1);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = {
      ArrowRight: tabbable + 1,
      ArrowDown: tabbable + 1,
      ArrowLeft: tabbable - 1,
      ArrowUp: tabbable - 1,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const index = Math.min(Math.max(next, 0), count - 1);
    frame.current?.querySelector<SVGGElement>(`[data-tile="${index}"]`)?.focus();
  };
  const onFocusTile = (event: FocusEvent<SVGGElement>, index: number) => {
    setRoving(index);
    // A click focuses a tile too, and the pointer already shows its tooltip: only the keyboard needs this.
    if (event.currentTarget.matches(':focus-visible')) {
      setRinged(index);
      pointerOver(event.currentTarget);
    }
  };
  const onBlurTile = (event: FocusEvent<SVGGElement>) => {
    setRinged(undefined);
    pointerOut(event.currentTarget);
  };

  return (
    <div
      ref={frame}
      role="group"
      aria-label={name}
      onKeyDown={onKeyDown}
      style={{ width, height, maxWidth: '100%', color: MUTED }}
    >
      <Treemap
        width="100%"
        height="100%"
        data={data}
        dataKey="value"
        nameKey="name"
        aspectRatio={1.4}
        content={(node) => {
          const tileNode = node as TileNode;
          return (
            <TileView
              node={tileNode}
              titled={firstOfGroup.has(tileNode.tile ?? -1)}
              tabbable={tileNode.tile === tabbable}
              ring={tileNode.tile === ringed}
              showValues={showValues}
              format={formatValue}
              onFocusTile={onFocusTile}
              onBlurTile={onBlurTile}
            />
          );
        }}
        {...ANIMATION}
      >
        <Tooltip content={<TreemapTooltip format={formatValue} />} animationDuration={150} />
        {children}
      </Treemap>
    </div>
  );
};
