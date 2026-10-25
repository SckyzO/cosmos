/**
 * The text size setting (`data-text-size` on `<html>`, see @sckyzo/cosmos-theme)
 * scales every `--text-*` token by `--cosmos-text-scale`: 0.9375, 1.125, 1.25,
 * and unset at the normal size. The chart text is SVG and HTML that ApexCharts
 * sizes in pixels, so the charts read that scale and multiply their sizes by it.
 */

/** The scale in `raw`, the value of `--cosmos-text-scale`: 1 when it is unset or not a positive number. */
export const parseTextScale = (raw: string): number => {
  const scale = Number.parseFloat(raw);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};

/** `px` at `scale`, as the CSS length ApexCharts takes (`11px` at 1.125 is `12.38px`). */
export const scaledPx = (px: number, scale: number): string =>
  `${Number((px * scale).toFixed(2))}px`;

// The chart text at the normal size: `text-2xs` for the axis labels, `text-xs`
// for the axis titles, the legend and the tooltip.
export const AXIS_LABEL_PX = 11;
export const CHART_TEXT_PX = 12;
