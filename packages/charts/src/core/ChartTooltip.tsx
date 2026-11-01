import type { CSSProperties, ReactNode } from 'react';
import type { TooltipContentProps } from 'recharts';
import { BORDER, MUTED, PANEL, TEXT } from './colors';

const card: CSSProperties = {
  minWidth: '9rem',
  padding: '0.625rem 0.75rem',
  fontSize: 'var(--text-xs, 0.75rem)',
  color: TEXT,
  background: PANEL,
  border: `1px solid ${BORDER}`,
  borderRadius: 'var(--radius-xl, 0.75rem)',
  boxShadow: 'var(--shadow-theme-md, 0 4px 8px -2px rgb(16 24 40 / 10%))',
};

/** A tooltip row: a chip, a name, a value. */
export type TooltipRow = { name: string; value: ReactNode; color: string };

/**
 * The tooltip card of every chart. A polite live region, as Recharts
 * recommends for a custom tooltip, so a screen reader announces the point the
 * keyboard or the pointer is on. Every part is React text: markup in a name or
 * a value shows as written.
 */
export const TooltipCard = ({ title, rows }: { title?: ReactNode; rows: TooltipRow[] }) => (
  <div role="status" aria-live="polite" style={card}>
    {title !== undefined && title !== '' && (
      // A card with a title and no row (a marker with no value) has nothing under it to make room for.
      <p style={{ margin: rows.length > 0 ? '0 0 0.375rem' : 0, fontWeight: 600 }}>{title}</p>
    )}
    {rows.length > 0 && (
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {rows.map((row, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: '0.625rem',
                height: '0.625rem',
                borderRadius: '50%',
                background: row.color,
              }}
            />
            <span style={{ color: MUTED }}>{row.name}</span>
            <span
              style={{
                marginLeft: 'auto',
                paddingLeft: '1rem',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

type ChartTooltipProps = Partial<TooltipContentProps> & {
  /** Formats each value (default `String`). */
  format?: (value: number) => string;
  /** Leave out the title (the category), for a chart that has no axis to read it from. */
  hideTitle?: boolean;
  /** The color of a row's chip from its value and the index of the point, when a bar has a color of its own. `undefined` keeps the series color. */
  colorOf?: (value: number, index: number) => string | undefined;
};

/** `<Tooltip content={<ChartTooltip />} />`: the card for the series at the point under the cursor. */
export const ChartTooltip = ({
  active,
  payload,
  label,
  format = String,
  hideTitle,
  colorOf,
  activeIndex,
}: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const rows = payload.map((item) => ({
    name: String(item.name),
    value: format(Number(item.value)),
    color:
      colorOf?.(Number(item.value), Number(activeIndex)) ??
      String(item.color ?? item.payload?.fill ?? item.fill),
  }));
  return <TooltipCard title={hideTitle ? undefined : label} rows={rows} />;
};
