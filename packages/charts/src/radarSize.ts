import type { ChartLegendPosition } from './types';

// Recharts draws the axis names outside the outer polygon and does not make
// room for them, so the radius is sized from the smaller side of the plot less
// the room the names need (12px text): above and below the polygons, and beside
// them.
const NAME_BAND = 44;
const NAME_GAP = 14;
const NAME_CHAR = 6.5;
// What a legend takes from the plot, on the side it sits on.
const LEGEND_ROW = 40;
const LEGEND_COLUMN = 120;
const MIN_SIZE = 40;

type RadarSizeParams = {
  /** The height and width of the chart, in pixels. */
  height: number;
  width: number;
  categories: readonly string[];
  /** The side the legend sits on, if it is drawn. */
  legend?: ChartLegendPosition;
};

/**
 * The radius, in pixels, of the outer polygon of a radar: the largest one that
 * leaves room for the axis names around it in a chart of this size.
 */
export const radarSize = ({ height, width, categories, legend }: RadarSizeParams): number => {
  const widest = Math.max(0, ...categories.map((name) => name.length)) * NAME_CHAR;
  const vertical = height - NAME_BAND - (legend === 'top' || legend === 'bottom' ? LEGEND_ROW : 0);
  const horizontal =
    width - 2 * (widest + NAME_GAP) - (legend === 'left' || legend === 'right' ? LEGEND_COLUMN : 0);
  return Math.max(MIN_SIZE, Math.floor(Math.min(vertical, horizontal) / 2));
};
