import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { TooltipCard } from './core/ChartTooltip';
import { MUTED, PANEL, SERIES, TEXT, TRACK, seriesColor } from './core/colors';
import { ChartEmpty } from './core/frame';
import { useElementWidth } from './core/useElementWidth';
import {
  fadeShare,
  flowPoints,
  formatRate,
  funnelRows,
  isEmptyFunnel,
  type FunnelRow,
} from './funnel';
import { TEXT_SIZE } from './core/axes';
import type { ChartEmptyProps, ChartProps } from './types';

export type { FunnelStage } from './funnel';

export type FunnelChartProps = Omit<ChartProps, 'children'> &
  ChartEmptyProps & {
    /**
     * The stages, drawn top to bottom in the order given: the wrapper does not
     * sort them. Each bar is as wide as its value against the largest stage,
     * which is the first one unless a stage grows.
     */
    stages: { label: string; value: number }[];
    /**
     * One color per stage, cycling when there are fewer. Default: the accent,
     * fading from the first stage to the last.
     */
    colors?: string[];
    /** Format the values, in the labels and the tooltip. Percentages always have one decimal. */
    formatValue?: (value: number) => string;
    /**
     * Show the conversion: a chip with the rate from the previous stage, the
     * rate from the first stage beside it, and both in the tooltip. Off, only
     * the values show. Default true.
     */
    showConversion?: boolean;
  };

// A bar is 30px at the normal size and 24px on a narrow box; the flow takes
// the rest of the stage's row, at least this much.
const BAR = '1.875rem';
const BAR_NARROW = '1.5rem';
const FLOW = '1.75rem';
const FLOW_NARROW = '1.25rem';
const FLOW_OPACITY = 0.14;
// Below this width the names and values go above their bar.
const NARROW = 520;
// Room the tooltip card leaves the bar.
const TIP_GAP = 6;

type Tip = {
  index: number;
  x: number;
  top: number;
  bottom: number;
  align: 'start' | 'center' | 'end';
  below: boolean;
};

const textStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const FunnelChart = ({
  stages,
  colors,
  formatValue = String,
  showConversion = true,
  emptyMessage = 'No data',
  ariaLabel,
  height,
  width,
}: FunnelChartProps) => {
  const name = ariaLabel ?? `Funnel: ${stages.map((stage) => stage.label).join(', ')}`;
  const frame = useRef<HTMLDivElement | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const { ref: measure, width: measured } = useElementWidth();
  // The box is read for the tooltip's position and measured for the layout.
  const frameRef = useCallback(
    (element: HTMLDivElement | null) => {
      frame.current = element;
      measure(element);
    },
    [measure]
  );
  const [roving, setRoving] = useState(0);
  const [hover, setHover] = useState<Tip>();
  const [focus, setFocus] = useState<Tip>();
  if (isEmptyFunnel(stages)) {
    return (
      <ChartEmpty message={emptyMessage} ariaLabel={name} height={height ?? 160} width={width} />
    );
  }

  const rows = funnelRows(stages);
  const first = rows[0];
  const narrow = measured !== undefined && measured < NARROW;
  const bar = narrow ? BAR_NARROW : BAR;
  const flow = narrow ? FLOW_NARROW : FLOW;
  const tabbable = Math.min(roving, rows.length - 1);
  const tip = hover ?? focus;

  const color = (i: number) =>
    colors?.length
      ? seriesColor(i, colors)
      : `color-mix(in oklab, ${SERIES[0]} ${fadeShare(i, rows.length)}%, ${PANEL})`;
  const flowColor = (i: number) => (colors?.length ? seriesColor(i, colors) : SERIES[0]);

  const chip = (row: FunnelRow, i: number) => (i === 0 ? '100%' : formatRate(row.fromPrevious));
  const note = (row: FunnelRow) => `${formatRate(row.fromFirst)} of ${first.label}`;
  const nameOf = (row: FunnelRow, i: number) =>
    [
      `${row.label}: ${formatValue(row.value)}`,
      ...(showConversion && i > 0
        ? [`${formatRate(row.fromPrevious)} of previous stage`, note(row)]
        : []),
    ].join(', ');

  const tipFor = (index: number, item: HTMLElement): Tip => {
    const host = (frame.current as HTMLElement).getBoundingClientRect();
    const box = (item.querySelector('[data-funnel-bar]') ?? item).getBoundingClientRect();
    const middle = box.left - host.left + box.width / 2;
    // The card hangs from the side of the bar nearest the middle of the chart,
    // so it never leaves the box.
    const align =
      middle < host.width / 3 ? 'start' : middle > (2 * host.width) / 3 ? 'end' : 'center';
    return {
      index,
      x: { start: box.left - host.left, center: middle, end: box.right - host.left }[align],
      top: box.top - host.top,
      bottom: box.bottom - host.top,
      align,
      below: box.top - host.top < 110,
    };
  };

  const move = (event: KeyboardEvent<HTMLUListElement>) => {
    const origin = (event.target as HTMLElement).closest<HTMLElement>('[data-funnel-stage]');
    if (!origin) return;
    const index = Number(origin.dataset.index);
    const targets: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: rows.length - 1,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    list.current
      ?.querySelector<HTMLElement>(
        `[data-index="${Math.min(Math.max(target, 0), rows.length - 1)}"]`
      )
      ?.focus();
  };

  const focusIn = (index: number, event: FocusEvent<HTMLElement>) => {
    setRoving(index);
    // A click focuses a stage too, and would leave its tooltip up: only the keyboard shows it.
    if (event.currentTarget.matches(':focus-visible')) {
      setFocus(tipFor(index, event.currentTarget));
    }
  };
  const focusOut = (event: FocusEvent<HTMLUListElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocus(undefined);
  };

  const tipRow = tip && rows[tip.index];
  const tipStyle: CSSProperties | undefined = tip && {
    position: 'absolute',
    left: tip.x,
    top: tip.below ? tip.bottom + TIP_GAP : tip.top - TIP_GAP,
    transform: `translate(${{ start: '0', center: '-50%', end: '-100%' }[tip.align]}, ${tip.below ? '0' : '-100%'})`,
    zIndex: 10,
    pointerEvents: 'none',
  };

  const label = (row: FunnelRow, extra?: CSSProperties) => (
    <span
      data-funnel-name=""
      style={{ fontSize: TEXT_SIZE, color: MUTED, minWidth: 0, ...textStyle, ...extra }}
    >
      {row.label}
    </span>
  );
  const figures = (row: FunnelRow, i: number) => (
    <>
      <span
        data-funnel-value=""
        style={{
          fontSize: 'var(--text-sm, 0.875rem)',
          fontWeight: 600,
          color: TEXT,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {formatValue(row.value)}
      </span>
      {showConversion && (
        <span
          data-funnel-chip=""
          style={{
            fontSize: TEXT_SIZE,
            fontWeight: 600,
            color: TEXT,
            background: TRACK,
            padding: '0.0625rem 0.4375rem',
            borderRadius: 999,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {chip(row, i)}
        </span>
      )}
      {showConversion && i > 0 && !narrow && (
        <span
          data-funnel-note=""
          style={{ fontSize: TEXT_SIZE, color: MUTED, minWidth: 0, ...textStyle }}
        >
          {note(row)}
        </span>
      )}
    </>
  );

  const flowSvg = (i: number, style: CSSProperties) => (
    <svg
      aria-hidden
      data-funnel-flow=""
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      style={{ display: 'block', ...style }}
    >
      <polygon
        points={flowPoints(rows[i - 1].share, rows[i].share)}
        fill={flowColor(i - 1)}
        fillOpacity={FLOW_OPACITY}
      />
    </svg>
  );

  const barBox = (i: number): CSSProperties => ({
    width: `${rows[i].share * 100}%`,
    minWidth: rows[i].value > 0 ? 3 : 0,
    height: bar,
    borderRadius: 6,
    background: color(i),
    // The same ring for the pointer and the keyboard, in the text color: an
    // accent ring would vanish on a bar that is the accent.
    outline: tip?.index === i ? `2px solid ${TEXT}` : 'none',
    outlineOffset: 1,
  });

  const stage = (row: FunnelRow, i: number): ReactNode => {
    const common = {
      'data-funnel-stage': '',
      'data-index': i,
      tabIndex: i === tabbable ? 0 : -1,
      'aria-label': nameOf(row, i),
      onFocus: (event: FocusEvent<HTMLElement>) => focusIn(i, event),
      onMouseEnter: (event: MouseEvent<HTMLElement>) => setHover(tipFor(i, event.currentTarget)),
      onMouseLeave: () => setHover(undefined),
    };
    if (narrow) {
      return (
        <li
          key={i}
          {...common}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gridTemplateRows: '1fr auto',
            columnGap: '0.75rem',
            outline: 'none',
          }}
        >
          {i > 0 && flowSvg(i, { gridRow: 1, gridColumn: '1 / -1', width: '100%', height: '100%' })}
          <span
            aria-hidden
            style={{
              gridRow: 1,
              gridColumn: 1,
              alignSelf: 'end',
              display: 'flex',
              minWidth: 0,
              padding: `${i > 0 ? flow : '0'} 0 0.25rem`,
            }}
          >
            {label(row, { color: TEXT })}
          </span>
          <span
            aria-hidden
            style={{
              gridRow: 1,
              gridColumn: 2,
              alignSelf: 'end',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              padding: `${i > 0 ? flow : '0'} 0 0.25rem`,
            }}
          >
            {figures(row, i)}
          </span>
          <div
            aria-hidden
            style={{ gridRow: 2, gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}
          >
            <div data-funnel-bar="" style={barBox(i)} />
          </div>
        </li>
      );
    }
    return (
      <li
        key={i}
        {...common}
        style={{
          display: 'grid',
          gridColumn: '1 / -1',
          gridTemplateColumns: 'subgrid',
          outline: 'none',
        }}
      >
        <span
          aria-hidden
          style={{
            gridColumn: 1,
            alignSelf: 'end',
            height: bar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minWidth: 0,
          }}
        >
          {label(row)}
        </span>
        <div
          aria-hidden
          style={{
            gridColumn: 2,
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            minHeight: i === 0 ? bar : `calc(${bar} + ${flow})`,
            minWidth: 0,
          }}
        >
          {i > 0 &&
            flowSvg(i, {
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: `calc(100% - ${bar})`,
            })}
          <div data-funnel-bar="" style={barBox(i)} />
        </div>
        <span
          aria-hidden
          style={{
            gridColumn: 3,
            alignSelf: 'end',
            height: bar,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: 0,
          }}
        >
          {figures(row, i)}
        </span>
      </li>
    );
  };

  return (
    <div
      ref={frameRef}
      style={{
        position: 'relative',
        width: width ?? '100%',
        height,
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <ul
        ref={list}
        role="list"
        aria-label={name}
        onKeyDown={move}
        onBlur={focusOut}
        style={{
          display: 'grid',
          gridTemplateColumns: narrow
            ? 'minmax(0, 1fr)'
            : 'fit-content(30%) minmax(0, 1fr) fit-content(45%)',
          gridTemplateRows: `auto repeat(${rows.length - 1}, minmax(min-content, 1fr))`,
          columnGap: '1rem',
          width: '100%',
          height: height === undefined ? undefined : '100%',
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {rows.map(stage)}
      </ul>
      {tip && tipRow && tipStyle && (
        <div data-funnel-tooltip="" aria-hidden style={tipStyle}>
          <TooltipCard
            title={tipRow.label}
            rows={[
              { name: 'Value', value: formatValue(tipRow.value), color: color(tip.index) },
              ...(showConversion && tip.index > 0
                ? [
                    {
                      name: 'Of previous stage',
                      value: formatRate(tipRow.fromPrevious),
                      color: color(tip.index),
                    },
                    {
                      name: `Of ${first.label}`,
                      value: formatRate(tipRow.fromFirst),
                      color: color(tip.index),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}
    </div>
  );
};
