import { expect, userEvent, waitFor } from 'storybook/test';
import type { ChartLegendPosition } from './types';
import { hover, resolveColor, switchTheme, themeColor } from './storybook-helpers';

// Helpers for the stories of the charts drawn with Recharts. The ones in
// `storybook-helpers.tsx` read the ApexCharts DOM (`.apexcharts-*`); the
// engine-agnostic ones there (`hover`, `switchTheme`, `resolveColor`,
// `themeColor`, `HOSTILE`, `LegendSides`) are used by both.

/** The chart's SVG. */
export const surface = (root: HTMLElement) =>
  root.querySelector<SVGSVGElement>('svg.recharts-surface');

/** The names on the legend of the chart in `root`, in order. */
export const legendTexts = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-legend-wrapper button')].map((el) => el.textContent);

/** The tooltip card, or `null` while no point is active. */
export const tooltipCard = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('.recharts-tooltip-wrapper [role="status"]');

/** Moves the pointer over the plot, at `xRatio` of the chart's width. */
export const hoverPlot = (root: HTMLElement, xRatio = 0.5) => {
  const svg = surface(root);
  expect(svg).not.toBeNull();
  hover(svg as Element, xRatio);
};

/** Hovers until the tooltip shows (the chart may still be laying out). */
export const openTooltip = (root: HTMLElement, xRatio = 0.5) =>
  waitFor(() => {
    hoverPlot(root, xRatio);
    expect(tooltipCard(root)).not.toBeNull();
  });

/**
 * Ends the hover and waits until no tooltip is active. A play function that
 * opened a tooltip ends with this, like every other story: axe runs after it.
 */
export const closeTooltip = (root: HTMLElement) =>
  waitFor(() => {
    const svg = surface(root);
    for (const el of [svg, svg?.parentElement]) {
      el?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      el?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    }
    expect(tooltipCard(root)).toBeNull();
  });

/** The series lines of the chart: the stroke of each area or line curve, in series order. */
export const seriesStrokes = (root: HTMLElement) =>
  [...root.querySelectorAll<SVGPathElement>('.recharts-area-curve, .recharts-line-curve')].map(
    (el) => getComputedStyle(el).stroke
  );

/** The tick labels of the axis `axis` (`xAxis`, `yAxis`). */
export const tickTexts = (root: HTMLElement, axis: 'xAxis' | 'yAxis') =>
  [
    ...root.querySelectorAll(`.recharts-${axis}-tick-labels .recharts-cartesian-axis-tick-value`),
  ].map((el) => el.textContent);

/** The axis titles in `root`: the x one under the plot, and the y one, which Recharts rotates, beside it. */
export const axisTitles = (root: HTMLElement) => {
  const titles = [...root.querySelectorAll('.recharts-label')];
  const text = (rotated: boolean) =>
    titles.filter((el) => el.hasAttribute('transform') === rotated).map((el) => el.textContent);
  return { x: text(false), y: text(true) };
};

/** Play function for a story with no data: the chart draws `text` in place of the plot, and nothing else. */
export const expectEmptyMessage =
  (text: string) =>
  ({ canvasElement }: { canvasElement: HTMLElement }) =>
    waitFor(() => {
      const empty = canvasElement.querySelector('[data-chart-empty]');
      expect(empty?.textContent).toBe(text);
      expect(canvasElement.querySelector('svg')).toBeNull();
    });

/**
 * Play function for a story passing `ariaLabel`: screen readers read it as the
 * chart's name. With `keyboard`, Tab reaches the chart, which announces the
 * first point in its tooltip, and `next` (default →) announces another;
 * without, the chart is an image, out of the tab order.
 */
export const expectAccessibleChart =
  ({ keyboard, next = '{ArrowRight}' }: { keyboard: boolean; next?: string }) =>
  async ({ canvasElement, args }: { canvasElement: HTMLElement; args: { ariaLabel?: string } }) => {
    const svg = () => surface(canvasElement);
    await waitFor(() => expect(svg()).toHaveAttribute('aria-label', args.ariaLabel));
    if (!keyboard) {
      await expect(svg()).toHaveAttribute('role', 'img');
      await expect(canvasElement.querySelector('[tabindex]:not([tabindex="-1"])')).toBeNull();
      return;
    }
    await expect(svg()).toHaveAttribute('role', 'application');
    await userEvent.tab();
    await expect(svg()).toHaveFocus();
    await waitFor(() => expect(tooltipCard(canvasElement)?.textContent).toBeTruthy());
    const first = tooltipCard(canvasElement)?.textContent;
    await userEvent.keyboard(next);
    await waitFor(() => {
      expect(tooltipCard(canvasElement)?.textContent).toBeTruthy();
      expect(tooltipCard(canvasElement)?.textContent).not.toBe(first);
    });
    await userEvent.tab();
    await closeTooltip(canvasElement);
  };

/**
 * Play function for a chart with its categories on the vertical axis (a
 * horizontal `BarChart`, `RangeBarChart`, `BoxPlotChart`): Tab reaches the
 * chart, which announces `categories[0]`, then ArrowDown and ArrowRight go to
 * the next category and ArrowUp and ArrowLeft to the previous one, and the ends
 * stay put. The tooltip names the category it is on.
 */
export const expectCategoryArrowKeys =
  (categories: string[]) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const svg = () => surface(canvasElement) as SVGSVGElement;
    await waitFor(() => expect(svg()).toHaveAttribute('role', 'application'));
    // A legend before the chart takes its Tab stops first.
    for (let i = 0; i < 12 && document.activeElement !== svg(); i++) await userEvent.tab();
    await expect(svg()).toHaveFocus();
    const on = (index: number) =>
      waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent(categories[index]));
    await on(0);
    // Up at the first category stays on it.
    await userEvent.keyboard('{ArrowUp}');
    await on(0);
    const walk: [key: string, index: number][] = [
      ['{ArrowDown}', 1],
      ['{ArrowDown}', 2],
      ['{ArrowUp}', 1],
      ['{ArrowRight}', 2],
      ['{ArrowLeft}', 1],
      ['{ArrowRight}', 2],
      ['{ArrowUp}', 1],
      ['{ArrowLeft}', 0],
    ];
    for (const [key, index] of walk) {
      await userEvent.keyboard(key);
      await on(index);
    }
    await userEvent.tab();
    await closeTooltip(canvasElement);
  };

const px = (el: Element | null | undefined) => parseFloat(el ? getComputedStyle(el).fontSize : '');

/** The sizes, in px, of the chart text in `root`: tick labels, axis title, legend. */
const textSizes = (root: HTMLElement) => ({
  tick: px(root.querySelector('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value')),
  title: px(root.querySelector('.recharts-label')),
  legend: px(root.querySelector('.recharts-legend-wrapper button')),
});

/**
 * Asserts the chart text in `root` follows the text size setting: the tick
 * labels, the axis title, the legend and the tooltip are 12px (`text-xs`), and
 * 13.5px once `<html>` takes `data-text-size="lg"`. The chart needs an x-axis
 * title and a legend.
 */
export const expectTextFollowsTextSize = async (root: HTMLElement) => {
  const html = document.documentElement;
  const previous = html.getAttribute('data-text-size');
  const tooltipSize = () => px(tooltipCard(root));
  await waitFor(() => expect(textSizes(root)).toEqual({ tick: 12, title: 12, legend: 12 }));
  await openTooltip(root, 0.05);
  expect(tooltipSize()).toBe(12);
  try {
    html.setAttribute('data-text-size', 'lg');
    await waitFor(() => expect(textSizes(root)).toEqual({ tick: 13.5, title: 13.5, legend: 13.5 }));
    await waitFor(() => expect(tooltipSize()).toBe(13.5));
  } finally {
    if (previous === null) html.removeAttribute('data-text-size');
    else html.setAttribute('data-text-size', previous);
    await closeTooltip(root);
  }
};

/**
 * Asserts a theme switch repaints the chart in `root` with no observer and no
 * redraw: the computed color of a tick label is the theme's muted text color,
 * and follows `<html>` as its class changes. Then the same for the accent: the
 * first series line takes `--color-brand-500` of the accent `<html>` is given.
 */
export const expectRepaintsWithTheme = async (root: HTMLElement) => {
  const tick = () =>
    root.querySelector('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value');
  const tickColor = () => resolveColor(getComputedStyle(tick() as Element).fill);
  await waitFor(() => expect(tick()).not.toBeNull());
  const initial = tickColor();
  await expect(initial).toBe(themeColor('--color-text-muted'));
  for (const theme of ['', 'sand', 'deep-blue']) {
    const restore = switchTheme(theme);
    try {
      // Read in the same task as the switch: nothing re-rendered in between.
      await expect(tickColor()).toBe(themeColor('--color-text-muted'));
    } finally {
      restore();
    }
  }
  const restoreLight = switchTheme('');
  try {
    await expect(tickColor()).not.toBe(initial);
  } finally {
    restoreLight();
  }
  const html = document.documentElement;
  const previous = html.getAttribute('data-accent');
  html.setAttribute('data-accent', 'teal');
  try {
    const first = () => resolveColor(seriesStrokes(root)[0]);
    await expect(first()).toBe(themeColor('--color-brand-500'));
    await expect(first()).toBe(resolveColor('#038378'));
  } finally {
    if (previous === null) html.removeAttribute('data-accent');
    else html.setAttribute('data-accent', previous);
  }
};

/** Asserts each legend of `LegendSides` sits on its side of the plot, outside of it. */
export const expectLegendsOnTheirSide = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const sides: ChartLegendPosition[] = ['top', 'right', 'bottom', 'left'];
  for (const side of sides) {
    const chart = canvasElement.querySelector(`[data-side="${side}"]`);
    await waitFor(() => {
      const legend = chart?.querySelector('.recharts-legend-wrapper');
      const plot = chart?.querySelector('.recharts-cartesian-grid');
      expect(legend?.querySelector('button'), side).toBeTruthy();
      expect(plot, side).toBeTruthy();
      const l = (legend as Element).getBoundingClientRect();
      const p = (plot as Element).getBoundingClientRect();
      const outside = {
        top: l.bottom <= p.top + 1,
        bottom: l.top >= p.bottom - 1,
        left: l.right <= p.left + 1,
        right: l.left >= p.right - 1,
      };
      expect(outside[side], `${side}: legend ${JSON.stringify(l)}, plot ${JSON.stringify(p)}`).toBe(
        true
      );
    });
  }
};
