import { useCallback, useState, type ReactNode } from 'react';
import type { LegendPayload, LegendProps } from 'recharts';
import type { ChartLegendPosition } from '../types';
import { MUTED, TEXT } from './colors';
import { TEXT_SIZE } from './axes';

/**
 * The series a click on the legend hid, and the toggle. A hidden series is
 * passed to its graphical item as `hide`, so the axes fit what is left.
 */
export const useHiddenSeries = () => {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const toggle = useCallback((key: string) => {
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);
  return { hidden, toggle };
};

type ChartLegendProps = {
  /** Given by Recharts: one entry per series, in the order the series are drawn. */
  payload?: readonly LegendPayload[];
  /** The keys of the hidden series. */
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
  /** Items in a column (`left`, `right`) or a row (`top`, `bottom`). */
  column?: boolean;
  /**
   * A figure written after the name of the entry at `index`: a value and its
   * share. In a column the figures sit at the right edge, aligned on their
   * last digit; in a row they follow the name.
   */
  detail?: (index: number) => { value: string; share: string };
};

/**
 * The legend of every chart: a round chip and the series name in the muted
 * text color, one button per series. A click (or Enter, Space) hides the series
 * and shows it again; the button says which in `aria-pressed`. Pass it as
 * `<Legend content={…} itemSorter={null} />`: Recharts sorts the items by name
 * unless told not to, and the series keep their order.
 */
export const ChartLegend = ({ payload, hidden, onToggle, column, detail }: ChartLegendProps) => (
  <ul
    style={{
      display: 'flex',
      flexDirection: column ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: column ? '0.375rem' : '0.25rem 1rem',
      margin: 0,
      padding: 0,
      listStyle: 'none',
      fontSize: TEXT_SIZE,
      color: MUTED,
    }}
  >
    {payload?.map((entry, index) => {
      const key = String(entry.dataKey);
      const figures = detail?.(index);
      const off = hidden.has(key);
      return (
        <li key={key}>
          <button
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(key)}
            className="focus-visible:focus-indicator"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.125rem 0.25rem',
              font: 'inherit',
              color: 'inherit',
              background: 'none',
              border: 0,
              borderRadius: '0.25rem',
              cursor: 'pointer',
              textDecoration: off ? 'line-through' : undefined,
              // The figures of a column reach its right edge, which aligns them.
              ...(figures && column ? { display: 'flex', width: '100%', gap: '0.75rem' } : {}),
            }}
          >
            <span
              aria-hidden
              style={{
                width: '0.625rem',
                height: '0.625rem',
                borderRadius: '50%',
                background: entry.color,
                // Text keeps its color: dimming it would fail the contrast check.
                opacity: off ? 0.35 : 1,
              }}
            />
            {figures ? (
              <>
                <span style={column ? { flex: 1, textAlign: 'start' } : undefined}>
                  {entry.value as ReactNode}
                </span>
                <span
                  style={{
                    color: TEXT,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'end',
                  }}
                >
                  {figures.value}
                </span>
                <span
                  style={{
                    minWidth: column ? '3.5ch' : undefined,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'end',
                  }}
                >
                  {figures.share}
                </span>
              </>
            ) : (
              (entry.value as ReactNode)
            )}
          </button>
        </li>
      );
    })}
  </ul>
);

const GAP = '1rem';

/**
 * The props of the `<Legend>` of a chart: on `position`, the chips and names
 * of `ChartLegend`, in series order, a `GAP` away from the plot.
 */
export const legendProps = (
  position: ChartLegendPosition,
  { hidden, toggle }: ReturnType<typeof useHiddenSeries>
): LegendProps => ({
  position,
  itemSorter: null,
  wrapperStyle: {
    top: { width: '100%', paddingBottom: GAP },
    bottom: { width: '100%', paddingTop: GAP },
    left: { paddingRight: GAP },
    right: { paddingLeft: GAP },
  }[position],
  content: (
    <ChartLegend
      hidden={hidden}
      onToggle={toggle}
      column={position === 'left' || position === 'right'}
    />
  ),
});
