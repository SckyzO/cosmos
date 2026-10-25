import type { ApexOptions } from 'apexcharts';
import { escapeHtml } from './escape';
import type { ChartLegendPosition } from './types';

type LegendParams = {
  show?: boolean;
  position: ChartLegendPosition;
  /** The text color. Left out, the legend takes the chart's `foreColor`. */
  color?: string;
  /** Pin the legend to the right edge of a row (`top`, `bottom`). Left out, ApexCharts centers it. */
  alignRight?: boolean;
};

/**
 * The legend of every wrapper that has one, so they look alike: round swatches
 * of one size and one spacing. ApexCharts outlines the swatches in white by
 * default, a bright ring in the dark themes; `strokeWidth: 0` removes it. The
 * items are HTML and escaped: ApexCharts writes them with innerHTML.
 */
export const chartLegend = ({
  show,
  position,
  color,
  alignRight = true,
}: LegendParams): NonNullable<ApexOptions['legend']> => ({
  ...(show === undefined ? {} : { show }),
  position,
  ...(alignRight ? { horizontalAlign: 'right' as const } : {}),
  ...(color ? { labels: { colors: color } } : {}),
  markers: { size: 5, strokeWidth: 0 },
  itemMargin: { horizontal: 5, vertical: 4 },
  formatter: escapeHtml,
});
