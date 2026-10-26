import { usePlotArea } from 'recharts';
import { MUTED, TEXT } from './colors';

/**
 * The value, and under it a smaller label, drawn as SVG text in the middle of
 * the plot area of a polar chart. The plot area is what the legend leaves, so
 * the text stays in the middle of the rings on any `legendPosition`. Plain
 * text: markup in `value` or `label` shows as written.
 */
export const CenterText = ({
  value,
  label,
  valueSize = 'var(--text-2xl, 1.5rem)',
}: {
  value: string;
  label?: string;
  /** A CSS font size, from the text tokens. */
  valueSize?: string;
}) => {
  const area = usePlotArea();
  if (!area) return null;
  const cx = area.x + area.width / 2;
  const cy = area.y + area.height / 2;
  return (
    <text
      data-chart-center=""
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      pointerEvents="none"
    >
      <tspan
        x={cx}
        dy={label ? '-0.35em' : 0}
        fill={TEXT}
        fontWeight={700}
        style={{ fontSize: valueSize }}
      >
        {value}
      </tspan>
      {label && (
        <tspan x={cx} dy="1.9em" fill={MUTED} style={{ fontSize: 'var(--text-xs, 0.75rem)' }}>
          {label}
        </tspan>
      )}
    </text>
  );
};

/** A value as a percentage, the default `formatValue` of the radial charts. */
export const percent = (value: number) => `${value}%`;

/** The value clamped to `min`–`max`: a gauge's arc stops at an end, its text still gives the value. */
export const clampTo = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** The name a gauge is read by: `name` (the host's `ariaLabel`, else the label) and the formatted value. */
export const gaugeName = (name: string, formatted: string) => `${name}: ${formatted}`;
