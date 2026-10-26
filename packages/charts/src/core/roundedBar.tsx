import type { BarShapeProps } from 'recharts';

/** The side of the plot a bar grows from: `horizontal` is a column chart, `vertical` a chart of horizontal bars (Recharts' own words for `layout`). */
export type BarLayout = 'horizontal' | 'vertical';

// A rectangle with its own radius at each corner: top-left, top-right,
// bottom-right, bottom-left.
const roundedRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  [tl, tr, br, bl]: [number, number, number, number]
) =>
  `M${x + tl},${y}H${x + w - tr}a${tr},${tr} 0 0 1 ${tr},${tr}V${y + h - br}` +
  `a${br},${br} 0 0 1 ${-br},${br}H${x + bl}a${bl},${bl} 0 0 1 ${-bl},${-bl}` +
  `V${y + tl}a${tl},${tl} 0 0 1 ${tl},${-tl}Z`;

type RoundedBarOptions = {
  layout: BarLayout;
  /** The corner radius of the outer end, in px. */
  radius: number;
  /** The key of the series in the data rows, to read the sign of the value. */
  dataKey: string;
  /**
   * Whether this bar is the outer end of its stack in `row`. A bar outside a
   * stack, or the last of it on its side of the axis, is. Default: always.
   */
  isOuter?: (row: Record<string, unknown>) => boolean;
};

/**
 * The `shape` of a `Bar` that rounds the end away from the axis only: the top
 * of a column, the right of a horizontal bar, and the other end when the value
 * is negative. In a stack only the outermost segment on each side is rounded,
 * so the stack reads as one bar. The radius shrinks to fit a short bar.
 */
export const roundedBarShape =
  ({ layout, radius, dataKey, isOuter }: RoundedBarOptions) =>
  (props: BarShapeProps) => {
    const { x, y, width, height, fill } = props;
    const row = (props.payload ?? {}) as Record<string, unknown>;
    // The rectangle has a negative size when the value is below zero.
    const left = Math.min(x, x + width);
    const top = Math.min(y, y + height);
    const w = Math.abs(width);
    const h = Math.abs(height);
    if (!(w > 0) || !(h > 0)) return null;
    const negative = Number(row[dataKey]) < 0;
    const r = !isOuter || isOuter(row) ? Math.min(radius, w / 2, h / 2) : 0;
    const corners: [number, number, number, number] =
      layout === 'horizontal'
        ? negative
          ? [0, 0, r, r]
          : [r, r, 0, 0]
        : negative
          ? [r, 0, 0, r]
          : [0, r, r, 0];
    return <path d={roundedRect(left, top, w, h, corners)} fill={fill} />;
  };

/**
 * For a stack, whether the series `key` is the last one drawn on its side of
 * the axis in a row, among the `keys` of the series that are shown.
 */
export const isOuterInStack =
  (keys: readonly string[], key: string) => (row: Record<string, unknown>) => {
    const value = Number(row[key]);
    return !keys
      .slice(keys.indexOf(key) + 1)
      .some((other) => Number(row[other]) !== 0 && Number(row[other]) * value > 0);
  };
