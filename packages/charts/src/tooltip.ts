import { escapeHtml } from './escape';

/** One tooltip line: a label and its formatted value. */
export type TooltipRow = [label: string, value: string];

export type TooltipContent = {
  /** First line, in the tooltip title style (a category, a point's name). */
  title?: string;
  /** The series: its name after a dot in its color. */
  series?: { name: string; color: string };
  rows: TooltipRow[];
};

const line = (content: string) =>
  `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex">${content}</div>`;

/**
 * Markup for a `tooltip.custom` callback, built from ApexCharts' own tooltip
 * classes so it looks like the built-in tooltips. ApexCharts writes it with
 * innerHTML: every string is escaped here, so callers pass raw data.
 */
export const tooltipHtml = ({ title, series, rows }: TooltipContent): string =>
  (title === undefined ? '' : `<div class="apexcharts-tooltip-title">${escapeHtml(title)}</div>`) +
  (series === undefined
    ? ''
    : line(
        `<span class="apexcharts-tooltip-marker" style="background-color:${escapeHtml(series.color)};border-radius:50%"></span>` +
          `<span class="apexcharts-tooltip-text-y-label">${escapeHtml(series.name)}</span>`
      )) +
  rows
    .map(([label, value]) =>
      line(
        `<span class="apexcharts-tooltip-text-y-label">${escapeHtml(label)}:</span>` +
          `<span class="apexcharts-tooltip-text-y-value">${escapeHtml(value)}</span>`
      )
    )
    .join('');
