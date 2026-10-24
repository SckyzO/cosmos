import type ApexCharts from 'apexcharts';
import { useEffect, useRef, type ComponentProps } from 'react';
import 'apexcharts/features/keyboard';
import ReactApexChart from 'react-apexcharts/core';
import { mergeOptions } from './mergeOptions';
import { useChartTheme } from './theme';
import type { ChartAccessibility, ChartEmptyProps, ChartRawOptions } from './types';

// ApexCharts draws the tooltip title at 55% of the light tooltip's text color,
// 4:1 on its white body. At 70% it reaches 6.6:1. The class keeps the rule to
// the tooltips of these charts; the dark tooltip already passes.
const TOOLTIP_CLASS = 'cosmos-chart-tooltip';
const TOOLTIP_CSS = `.apexcharts-tooltip.apexcharts-theme-light.${TOOLTIP_CLASS}{--apx-tt-color-muted:rgba(15,23,42,0.7)}`;

type ApexChartProps = ComponentProps<typeof ReactApexChart> &
  ChartAccessibility &
  ChartEmptyProps &
  ChartRawOptions & {
    /**
     * Tab reaches the chart and the arrow keys walk its points (default). Off,
     * the chart is an image out of the tab order: right for a single value.
     */
    keyboard?: boolean;
  };

/**
 * Gives each legend item of the chart in `container` the name its visible text
 * reads as: its `aria-label` starts with what the legend formatter returned
 * (escaped, see `ApexChart`), and the text of the item is that string parsed as
 * HTML. The rest of the label, the state and the key hint, is ApexCharts' own.
 */
const nameLegendItems = (container: Element) => {
  for (const item of container.querySelectorAll('.apexcharts-legend-series[aria-label]')) {
    const text = item.querySelector('.apexcharts-legend-text');
    const label = item.getAttribute('aria-label') ?? '';
    // ApexCharts keeps the formatted text on the element, URI-encoded.
    const formatted = decodeURIComponent(text?.getAttribute('data:default-text') ?? '');
    if (text?.textContent && formatted && label.startsWith(formatted)) {
      item.setAttribute('aria-label', text.textContent + label.slice(formatted.length));
    }
  }
};

/**
 * `ReactApexChart`, drawn again when a web font finishes loading or `<html>`
 * switches `data-font`. ApexCharts measures its labels when it draws: a font
 * that arrives after the first draw (fonts load lazily) left widths and
 * rotation computed for the old one. Equal options never redraw on their own,
 * since react-apexcharts compares them deeply.
 *
 * `ariaLabel` and `keyboard` set `chart.accessibility`. ApexCharts makes the
 * SVG an `application` whenever keyboard navigation is on in the options, even
 * without the keyboard feature that handles the keys: both go together here.
 *
 * ApexCharts names each legend item from the text its legend formatter returned.
 * The wrappers escape it for innerHTML, so a screen reader would read `R&amp;D`,
 * and a name with markup does not contain the text the item shows (axe
 * `label-content-name-mismatch`): `nameLegendItems` names the items from that
 * text instead, as ApexCharts itself does when an item is toggled.
 *
 * `emptyMessage` is the `noData` text ApexCharts draws, as SVG text, when there
 * is no series or only empty ones.
 *
 * The tooltip takes a class that darkens its title in the light themes, from a
 * style React hoists into `<head>` once for every chart.
 *
 * `apexOptions` is merged over all of it last, so it can override anything the
 * wrapper or this component set. `mergeOptions` copies it: ApexCharts writes to
 * the options it gets, which would otherwise change the consumer's object.
 */
export const ApexChart = ({
  ariaLabel,
  keyboard = true,
  emptyMessage = 'No data',
  apexOptions,
  options,
  ...props
}: ApexChartProps) => {
  const chartRef = useRef<ApexCharts | null>(null);
  const { textMuted } = useChartTheme();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const redraw = () => chartRef.current?.updateOptions({}, false, false);
    const observer = new MutationObserver(redraw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-font'],
    });
    document.fonts?.addEventListener('loadingdone', redraw);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', redraw);
    };
  }, []);

  useEffect(() => {
    // `el`, the element the chart draws in, is not in ApexCharts' typings.
    const container = (chartRef.current as { el?: HTMLElement } | null)?.el;
    if (!container) return;
    // ApexCharts builds the legend again on every update.
    const observer = new MutationObserver(() => nameLegendItems(container));
    observer.observe(container, { childList: true, subtree: true });
    nameLegendItems(container);
    return () => observer.disconnect();
  }, []);

  const own = {
    ...options,
    chart: {
      ...options?.chart,
      accessibility: { description: ariaLabel, keyboard: { enabled: keyboard } },
    },
    tooltip: { ...options?.tooltip, cssClass: TOOLTIP_CLASS },
    noData: { text: emptyMessage, style: { color: textMuted } },
  };
  const merged = apexOptions ? mergeOptions(own, apexOptions) : own;

  return (
    <>
      <style href="cosmos-chart-tooltip" precedence="cosmos-charts">
        {TOOLTIP_CSS}
      </style>
      <ReactApexChart {...props} options={merged} chartRef={chartRef} />
    </>
  );
};
