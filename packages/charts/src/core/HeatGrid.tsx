import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { TEXT_SIZE } from './axes';
import { TooltipCard } from './ChartTooltip';
import { MUTED, TEXT } from './colors';
import { textOn } from './readable';

/** One cell of a `HeatGrid`. A slot with no cell stays empty. */
export type HeatCell = {
  /** Zero-based position: the index in `rows` and in `columns`. */
  row: number;
  column: number;
  /** Any CSS color. The text printed in the cell reads on it. */
  color: string;
  /** Heads the tooltip, such as the column's category. */
  title: string;
  /** Names the cell in the tooltip, such as the row. */
  label: string;
  /** The value, formatted: the tooltip's value, and the end of the cell's accessible name. */
  value: string;
  /** Printed inside the cell. */
  text?: string;
};

type HeatGridProps = {
  /** The label of each row, top to bottom. An empty string leaves the row unlabelled. */
  rows: readonly string[];
  /** The label of each column, left to right. Too many for the width: every n-th one is drawn. */
  columns: readonly string[];
  cells: readonly HeatCell[];
  /**
   * Height of a row in px. Without it the rows share the height of the
   * parent, which must then have one.
   */
  cellHeight?: number;
  /** Names the grid for screen readers. */
  ariaLabel: string;
  /** Title under the columns. Drawn as plain text. */
  xTitle?: string;
  /** Title beside the rows. Drawn as plain text. */
  yTitle?: string;
};

const GAP = 3;
// Clear space kept between two column labels.
const LABEL_GAP = 6;
// Room the tooltip card leaves the pointer or the cell.
const TIP_GAP = 6;

const key = (row: number, column: number) => `${row}:${column}`;

/**
 * How many columns apart the labels are drawn so that none touches the next:
 * 1 when they all fit. Measured on the page, since the text size, the font and
 * the width all change it.
 */
const useLabelStride = (probe: string) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [stride, setStride] = useState(1);
  useLayoutEffect(() => {
    const read = () => {
      const label = probeRef.current?.offsetWidth ?? 0;
      const column = columnRef.current?.offsetWidth ?? 0;
      setStride(column > 0 ? Math.max(1, Math.ceil((label + LABEL_GAP) / (column + GAP))) : 1);
    };
    read();
    const observer = new ResizeObserver(read);
    for (const el of [gridRef.current, probeRef.current]) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [probe]);
  return { gridRef, probeRef, columnRef, stride };
};

type Tip = {
  cell: HeatCell;
  /** Where the card is anchored, in px from the grid's corner, and on which side of the cell. */
  x: number;
  top: number;
  bottom: number;
  align: 'start' | 'center' | 'end';
  below: boolean;
};

/**
 * A grid of colored cells with row and column labels: the drawing of
 * `HeatmapChart`, and of any chart laid out as rows and columns. Recharts has
 * no such chart, so it is plain HTML in a CSS grid, which sizes the label
 * column to the text (it follows the text size) and the cells to the width.
 *
 * Keyboard: the grid is one tab stop (a roving tabindex), and the arrow keys
 * move between cells, skipping empty slots; Home and End go to the ends of the
 * row, Ctrl+Home and Ctrl+End to the first and last cell. The cell under the
 * pointer or the keyboard shows its tooltip. Each cell is named
 * `label, title: value`, so a screen reader reads what the tooltip says.
 */
export const HeatGrid = ({
  rows,
  columns,
  cells,
  cellHeight,
  ariaLabel,
  xTitle,
  yTitle,
}: HeatGridProps) => {
  const frame = useRef<HTMLDivElement>(null);
  const longest = columns.reduce((a, b) => (b.length > a.length ? b : a), '');
  const { gridRef, probeRef, columnRef, stride } = useLabelStride(longest);
  const byPosition = new Map(cells.map((cell) => [key(cell.row, cell.column), cell]));
  const cellsByRow = new Map<number, HeatCell[]>();
  for (const cell of cells) cellsByRow.set(cell.row, [...(cellsByRow.get(cell.row) ?? []), cell]);
  const inReadingOrder = [...cells].sort((a, b) => a.row - b.row || a.column - b.column);
  const [roving, setRoving] = useState<string>();
  // The cell that takes Tab: the last one focused, while it is still there.
  const first = inReadingOrder[0];
  const tabbable =
    roving && byPosition.has(roving) ? roving : first && key(first.row, first.column);
  const [hover, setHover] = useState<Tip>();
  const [focus, setFocus] = useState<Tip>();
  const tip = hover ?? focus;

  const tipFor = (cell: HeatCell, element: HTMLElement): Tip => {
    const host = (frame.current as HTMLElement).getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const middle = box.left - host.left + box.width / 2;
    // The card hangs from the side of the cell nearest the middle of the grid,
    // so it never leaves the grid.
    const align =
      middle < host.width / 3 ? 'start' : middle > (2 * host.width) / 3 ? 'end' : 'center';
    return {
      cell,
      x: { start: box.left - host.left, center: middle, end: box.right - host.left }[align],
      top: box.top - host.top,
      bottom: box.bottom - host.top,
      align,
      // Not enough room above the cell for the card: it goes under.
      below: box.top - host.top < 90,
    };
  };

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const origin = (event.target as HTMLElement).closest<HTMLElement>('[data-heat-cell]');
    if (!origin) return;
    const row = Number(origin.dataset.row);
    const column = Number(origin.dataset.column);
    // The next cell in a direction: empty slots are skipped, the edge stops.
    const step = (dRow: number, dColumn: number) => {
      for (
        let r = row + dRow, c = column + dColumn;
        r >= 0 && r < rows.length && c >= 0 && c < columns.length;
        r += dRow, c += dColumn
      ) {
        if (byPosition.has(key(r, c))) return key(r, c);
      }
    };
    const edge = (last: boolean) => {
      const pool = event.ctrlKey
        ? inReadingOrder
        : inReadingOrder.filter((cell) => cell.row === row);
      const cell = last ? pool.at(-1) : pool[0];
      return cell && key(cell.row, cell.column);
    };
    const targets: Record<string, () => string | undefined> = {
      ArrowRight: () => step(0, 1),
      ArrowLeft: () => step(0, -1),
      ArrowDown: () => step(1, 0),
      ArrowUp: () => step(-1, 0),
      Home: () => edge(false),
      End: () => edge(true),
    };
    const target = targets[event.key];
    if (!target) return;
    event.preventDefault();
    const next = target();
    if (next) gridRef.current?.querySelector<HTMLElement>(`[data-position="${next}"]`)?.focus();
  };

  const focusIn = (cell: HeatCell, event: FocusEvent<HTMLElement>) => {
    setRoving(key(cell.row, cell.column));
    // A click focuses a cell too, and would leave its tooltip up: only the keyboard shows it.
    if (event.currentTarget.matches(':focus-visible')) {
      setFocus(tipFor(cell, event.currentTarget));
    }
  };
  const focusOut = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocus(undefined);
  };

  const rowOffset = yTitle ? 2 : 1;
  const labelsRow = rows.length + 1;
  const tipStyle: CSSProperties | undefined = tip && {
    position: 'absolute',
    left: tip.x,
    top: tip.below ? tip.bottom + TIP_GAP : tip.top - TIP_GAP,
    transform: `translate(${{ start: '0', center: '-50%', end: '-100%' }[tip.align]}, ${tip.below ? '0' : '-100%'})`,
    zIndex: 10,
    pointerEvents: 'none',
  };

  return (
    <div ref={frame} style={{ position: 'relative', width: '100%', height: '100%', minWidth: 0 }}>
      <div
        ref={gridRef}
        role="grid"
        aria-label={ariaLabel}
        onKeyDown={move}
        onBlur={focusOut}
        style={{
          display: 'grid',
          gridTemplateColumns: `${yTitle ? 'auto ' : ''}fit-content(40%) repeat(${columns.length}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows.length}, ${cellHeight ? `${cellHeight}px` : 'minmax(0, 1fr)'}) auto${xTitle ? ' auto' : ''}`,
          gap: GAP,
          width: '100%',
          height: cellHeight ? undefined : '100%',
          fontSize: TEXT_SIZE,
          color: MUTED,
        }}
      >
        {yTitle && (
          <div
            aria-hidden
            style={{
              gridRow: `1 / ${rows.length + 1}`,
              gridColumn: 1,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              textAlign: 'center',
              alignSelf: 'center',
            }}
          >
            {yTitle}
          </div>
        )}
        {rows.map((name, r) => (
          <div key={r} role="row" style={{ display: 'contents' }}>
            <div
              aria-hidden
              data-heat-row=""
              style={{
                gridRow: r + 1,
                gridColumn: rowOffset,
                alignSelf: 'center',
                paddingRight: '0.5rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </div>
            {(cellsByRow.get(r) ?? []).map((cell) => {
              const position = key(cell.row, cell.column);
              const active = tip?.cell === cell;
              return (
                <div
                  key={position}
                  role="gridcell"
                  data-heat-cell=""
                  data-position={position}
                  data-row={cell.row}
                  data-column={cell.column}
                  tabIndex={position === tabbable ? 0 : -1}
                  aria-label={`${cell.label}, ${cell.title}: ${cell.value}`}
                  onFocus={(event) => focusIn(cell, event)}
                  onMouseEnter={(event) => setHover(tipFor(cell, event.currentTarget))}
                  onMouseLeave={() => setHover(undefined)}
                  style={{
                    gridRow: r + 1,
                    gridColumn: cell.column + rowOffset + 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden',
                    borderRadius: 5,
                    background: cell.color,
                    color: textOn(cell.color),
                    fontSize: 'var(--text-2xs, 0.6875rem)',
                    fontWeight: 500,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    // The same ring for the pointer and the keyboard, in the text color
                    // since an accent ring would vanish on the cells that are the accent.
                    outline: active ? `2px solid ${TEXT}` : 'none',
                    zIndex: active ? 1 : undefined,
                  }}
                >
                  {cell.text}
                </div>
              );
            })}
          </div>
        ))}
        {columns.map((name, c) => (
          <div
            key={c}
            ref={c === 0 ? columnRef : undefined}
            aria-hidden
            data-heat-column=""
            style={{
              gridRow: labelsRow,
              gridColumn: c + rowOffset + 1,
              display: 'flex',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {c % stride === 0 ? name : null}
          </div>
        ))}
        {xTitle && (
          <div
            aria-hidden
            style={{
              gridRow: labelsRow + 1,
              gridColumn: `${rowOffset + 1} / -1`,
              textAlign: 'center',
            }}
          >
            {xTitle}
          </div>
        )}
        <span
          ref={probeRef}
          aria-hidden
          style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap' }}
        >
          {longest}
        </span>
      </div>
      {tip && tipStyle && (
        <div data-heat-tooltip="" aria-hidden style={tipStyle}>
          <TooltipCard
            title={tip.cell.title}
            rows={[{ name: tip.cell.label, value: tip.cell.value, color: tip.cell.color }]}
          />
        </div>
      )}
    </div>
  );
};
