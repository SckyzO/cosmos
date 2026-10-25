import ApexCharts from 'apexcharts/core';
import { useState, type ReactNode } from 'react';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';
import type { ChartLegendPosition } from './types';

/**
 * Loads the woff2 of an `@font-face` rule already on the page (`sourceFamily`)
 * under a new `family` name, after the chart rendered with the fallback: a web
 * font arriving late.
 */
export const loadLateFont = async (family: string, sourceFamily: string) => {
  const rule = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .find(
      (r): r is CSSFontFaceRule =>
        r instanceof CSSFontFaceRule &&
        r.style.getPropertyValue('font-family').replace(/['"]/g, '') === sourceFamily
    );
  if (!rule) throw new Error(`No @font-face for ${sourceFamily}`);
  const url = /url\(["']?([^"')]+\.woff2)/.exec(rule.style.getPropertyValue('src'))?.[1];
  if (!url) throw new Error(`No woff2 source for ${sourceFamily}`);
  const face = new FontFace(family, `url(${url})`);
  document.fonts.add(face);
  await face.load();
};

/**
 * The x-axis layout ApexCharts computed from its text measurements: label
 * positions and rotation, and the plot area left for them. The browser redraws
 * glyphs in a new font by itself; these attributes change only when ApexCharts
 * measures again.
 */
export const xAxisLayout = (root: HTMLElement) =>
  JSON.stringify([
    root.querySelector('.apexcharts-inner')?.getAttribute('transform'),
    [...root.querySelectorAll('.apexcharts-xaxis-label')].map((el) =>
      ['x', 'y', 'transform'].map((a) => el.getAttribute(a))
    ),
  ]);

// Series names, categories and labels are data, not markup. ApexCharts writes
// legends and tooltips with innerHTML, so the wrappers escape what goes there.
// Each wrapper's HtmlInLabelsRendersAsText story feeds it this string.
export const HOSTILE = '<img src=x onerror="window.__cosmosChartInjected=1">';

export const expectNoInjectedImage = async (root: HTMLElement) => {
  await expect(root.querySelector('img')).toBeNull();
  await expect(
    (window as { __cosmosChartInjected?: number }).__cosmosChartInjected
  ).toBeUndefined();
};

export const legendTexts = (root: HTMLElement) =>
  [...root.querySelectorAll('.apexcharts-legend-text')].map((el) => el.textContent);

// ApexCharts picks the hovered point from the pointer coordinates.
export const hover = (el: Element, xRatio = 0.5) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: left + width * xRatio,
      clientY: top + height / 2,
    })
  );
};

// A CSS color as a canvas normalizes it, so '#fff' and 'rgb(255, 255, 255)'
// compare equal. Not a probe element: waitFor reruns its callback on every DOM
// mutation, and adding one would loop forever.
const colorContext = document.createElement('canvas').getContext('2d')!;
export const resolveColor = (color: string) => {
  colorContext.fillStyle = '#000';
  colorContext.fillStyle = color;
  return colorContext.fillStyle;
};

/** A theme custom property on `<html>` (`--color-success-500`), as a resolved color. */
export const themeColor = (token: string) =>
  resolveColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim());

/**
 * `color` resolved, without its alpha: ApexCharts draws a hex color at its fill
 * opacity, as `rgba(…, 0.85)`.
 */
export const opaqueColor = (color: string) => {
  const rgba = /^rgba\((\d+), (\d+), (\d+), [\d.]+\)$/.exec(resolveColor(color));
  return rgba ? resolveColor(`rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`) : resolveColor(color);
};

const luminanceOf = (color: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(resolveColor(color).slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG contrast ratio between two opaque CSS colors. */
export const contrastRatio = (a: string, b: string) => {
  const [light, dark] = [luminanceOf(a), luminanceOf(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

/** The theme's primary text color (`--color-text-primary` on `<html>`). */
const themeTextColor = () =>
  resolveColor(
    getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim()
  );

/** The colors of the legend texts and the center values, resolved. */
const chartTextColors = (root: HTMLElement) => [
  ...[...root.querySelectorAll<HTMLElement>('.apexcharts-legend-text')].map((el) =>
    resolveColor(el.style.color)
  ),
  ...[...root.querySelectorAll('.apexcharts-datalabel-value')].map((el) =>
    resolveColor(el.getAttribute('fill') ?? '')
  ),
];

const expectThemeText = (root: HTMLElement) => {
  const colors = chartTextColors(root);
  expect(colors.length).toBeGreaterThan(0);
  for (const color of colors) expect(color).toBe(themeTextColor());
};

/** Switches `<html>` to the `theme` class ('' for light); returns the undo. */
export const switchTheme = (theme: string) => {
  const { classList } = document.documentElement;
  const previous = [...classList];
  classList.remove(...previous);
  if (theme) classList.add(theme);
  return () => {
    classList.remove(...classList);
    classList.add(...previous);
  };
};

/**
 * Asserts the legend texts and the center values use the theme text color,
 * then switches `<html>` to the `theme` class ('' for light) and asserts they
 * follow it.
 */
export const expectTextFollowsTheme = async (root: HTMLElement, theme: string) => {
  await waitFor(() => expectThemeText(root));
  const restore = switchTheme(theme);
  try {
    await waitFor(() => expectThemeText(root));
  } finally {
    restore();
  }
};

/** A color for a token redefined on `<html>`, unlike any theme color. */
const REDEFINED = '#7c3aed';

/**
 * Asserts the colors `drawn()` finds are `expected`, in order: a theme custom
 * property (`--color-success-500`) or a color of its own. Then redefines the
 * `redefined` property on `<html>` and switches to the sand theme, which the
 * charts read again, and asserts its color follows.
 */
export const expectColorsFromTokens = async (
  drawn: () => (string | null | undefined)[],
  expected: string[],
  redefined: string
) => {
  const resolved = () => drawn().map((color) => opaqueColor(color ?? ''));
  const color = (value: string) =>
    value.startsWith('--') ? themeColor(value) : resolveColor(value);
  await waitFor(() => expect(resolved()).toEqual(expected.map(color)));
  const { style } = document.documentElement;
  style.setProperty(redefined, REDEFINED);
  const restore = switchTheme('sand');
  try {
    await waitFor(() =>
      expect(resolved()[expected.indexOf(redefined)]).toBe(resolveColor(REDEFINED))
    );
  } finally {
    restore();
    style.removeProperty(redefined);
  }
};

/** The default series colors, in order: the accent token, then hues the theme has no token for. */
const PALETTE = [
  '--color-brand-500',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#f97316',
  '#14b8a6',
  '#84cc16',
];

/**
 * Asserts the series colors `drawn()` finds are the first of the default
 * palette of the theme, one per series, then that a redefined accent reaches
 * the chart.
 */
export const expectPaletteFromTheme = async (drawn: () => (string | null | undefined)[]) => {
  await waitFor(() => expect(drawn().length).toBeGreaterThan(0));
  await expectColorsFromTokens(drawn, PALETTE.slice(0, drawn().length), '--color-brand-500');
};

/**
 * Asserts `drawn()` is the color of `tokens[theme]` after switching `<html>` to
 * each of the themes in turn ('' for light).
 */
export const expectColorInThemes = async (
  drawn: () => string | null | undefined,
  tokens: Record<string, string>
) => {
  for (const [theme, token] of Object.entries(tokens)) {
    const restore = switchTheme(theme);
    try {
      await waitFor(() => {
        expect(drawn()).toBeTruthy();
        expect(opaqueColor(drawn() as string), theme || 'light').toBe(themeColor(token));
      });
    } finally {
      restore();
    }
  }
};

/**
 * Hovers `target()` until the tooltip shows with the `expected` ApexCharts
 * theme class. `target` is called again on every try: a theme change redraws
 * the chart.
 */
const expectTooltipTheme = (root: HTMLElement, target: () => Element | null, expected: string) =>
  waitFor(() => {
    const el = target();
    expect(el).not.toBeNull();
    hover(el as Element);
    const tooltip = root.querySelector('.apexcharts-tooltip');
    expect(tooltip?.classList.contains(`apexcharts-theme-${expected}`)).toBe(true);
  });

/**
 * Ends the hover on `hovered`, the element a play function hovered (a bar, a
 * marker or a cell listens for the pointer on its own), and on the chart, then
 * waits until no tooltip is active. A play function that opened a tooltip ends
 * with this, like every other story: axe runs after it, and a tooltip caught
 * mid-fade has no visible text, so it fails aria-tooltip-name at random; a
 * screenshot catches it open or closed depending on a redraw.
 */
export const closeTooltip = (root: HTMLElement, hovered: () => Element | null) =>
  waitFor(() => {
    for (const el of [hovered(), root.querySelector('.apexcharts-svg')]) {
      el?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
      el?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    }
    expect(root.querySelector('.apexcharts-tooltip.apexcharts-active')).toBeNull();
  });

/**
 * Asserts the tooltip is dark in a dark theme (the story's global), then
 * switches `<html>` to the light theme and asserts it turns light.
 */
export const expectTooltipFollowsTheme = async (
  root: HTMLElement,
  target: () => Element | null
) => {
  await expectTooltipTheme(root, target, 'dark');
  const restore = switchTheme('');
  try {
    await expectTooltipTheme(root, target, 'light');
  } finally {
    restore();
  }
  await closeTooltip(root, target);
};

/** Copies arrays and plain objects, keeps functions: equal props, new identities. */
export const freshCopy = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map(freshCopy) as T;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, freshCopy(v)])) as T;
  }
  return value;
};

/**
 * A parent that re-renders: "Re-render" draws `children(false)` again, with the
 * story passing fresh copies of equal props; "Grow" draws `children(true)`,
 * where the story passes a new height.
 */
export const Rerender = ({ children }: { children: (grown: boolean) => ReactNode }) => {
  const [renders, setRenders] = useState(1);
  const [grown, setGrown] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setRenders((n) => n + 1)}>
        Re-render
      </button>
      <button type="button" onClick={() => setGrown(true)}>
        Grow
      </button>
      <output aria-label="Renders">{renders}</output>
      {children(grown)}
    </div>
  );
};

// React runs the chart's update effect after the commit: wait a frame past it.
const afterEffects = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));

/**
 * Play function for a story rendering a wrapper in `Rerender`. ApexCharts
 * compares functions in the options by identity: a formatter made during render
 * redrew the whole chart on every parent render. Equal props must not redraw,
 * and a new height still must, which shows the spies see the updates.
 */
export const expectNoRedrawOnRerender = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvasElement.querySelector('.apexcharts-svg')).not.toBeNull());
  const updateOptions = spyOn(ApexCharts.prototype, 'updateOptions');
  const updateSeries = spyOn(ApexCharts.prototype, 'updateSeries');
  // A web font finishing to load redraws with empty options (ApexChart): that
  // redraw is wanted, only calls with new options count.
  const newOptions = () =>
    updateOptions.mock.calls.filter(([options]) => Object.keys(options).length > 0);
  try {
    await userEvent.click(canvas.getByRole('button', { name: 'Re-render' }));
    await expect(canvas.getByRole('status', { name: 'Renders' })).toHaveTextContent('2');
    await afterEffects();
    await expect(newOptions()).toEqual([]);
    await expect(updateSeries).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'Grow' }));
    await waitFor(() => expect(newOptions()).not.toEqual([]));
  } finally {
    updateOptions.mockRestore();
    updateSeries.mockRestore();
  }
};

const LEGEND_SIDES: ChartLegendPosition[] = ['top', 'right', 'bottom', 'left'];

/** `children(side)` once per `legendPosition`, each chart in an element `data-side`. */
export const LegendSides = ({
  children,
}: {
  children: (side: ChartLegendPosition) => ReactNode;
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    {LEGEND_SIDES.map((side) => (
      <div key={side} data-side={side}>
        {children(side)}
      </div>
    ))}
  </div>
);

/**
 * Play function for a story rendering a wrapper in `LegendSides`: each legend
 * sits on its side of the plot, outside of it.
 */
export const expectLegendsOnTheirSide = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  for (const side of LEGEND_SIDES) {
    const chart = canvasElement.querySelector(`[data-side="${side}"]`);
    await waitFor(() => {
      const legend = chart?.querySelector('.apexcharts-legend');
      const plot = chart?.querySelector('.apexcharts-inner');
      expect(legend?.querySelector('.apexcharts-legend-series'), side).toBeTruthy();
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

/**
 * Play function for a story with no data: the chart draws `text` and nothing
 * else, no axis labels, grid lines or legend around it.
 */
export const expectMessageOnly =
  (text: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await expectNoData(text)({ canvasElement });
    await expectNoFrame(canvasElement);
    await expectMessageCentered(canvasElement);
  };

/** Asserts the message sits in the middle of the chart, not in a corner. */
const expectMessageCentered = (root: HTMLElement) =>
  waitFor(() => {
    const message = root.querySelector('.apexcharts-text-nodata')?.getBoundingClientRect();
    const chart = root.querySelector('.apexcharts-canvas')?.getBoundingClientRect();
    expect(message && chart).toBeTruthy();
    if (!message || !chart) return;
    const offset = (a: number, b: number, size: number) => Math.abs(a - b) / size;
    expect(
      offset(message.x + message.width / 2, chart.x + chart.width / 2, chart.width)
    ).toBeLessThan(0.1);
    expect(
      offset(message.y + message.height / 2, chart.y + chart.height / 2, chart.height)
    ).toBeLessThan(0.1);
  });

/** Asserts the chart in `root` draws no axis label, grid line, legend item or polygon grid. */
export const expectNoFrame = (root: HTMLElement) =>
  waitFor(() => {
    // ApexCharts keeps the parts it hides in the DOM under `display: none`.
    const shown = (selector: string) =>
      [...root.querySelectorAll(selector)].filter((el) => !el.closest('[style*="display: none"]'));
    expect(
      shown('.apexcharts-xaxis-label, .apexcharts-yaxis-label').map((el) => el.textContent)
    ).toEqual([]);
    expect(
      shown('.apexcharts-gridline, .apexcharts-yaxis-tick, .apexcharts-xaxis-tick')
    ).toHaveLength(0);
    expect(shown('.apexcharts-legend-series')).toHaveLength(0);
  });

/** Asserts every legend swatch of the chart in `root` has no outline. */
export const expectLegendMarkersUnstroked = (root: HTMLElement) =>
  waitFor(() => {
    const markers = [...root.querySelectorAll('.apexcharts-legend .apexcharts-marker')];
    expect(markers.length, root.dataset.chart).toBeGreaterThan(0);
    for (const marker of markers) expect(parseFloat(getComputedStyle(marker).strokeWidth)).toBe(0);
  });

/** Play function for a story with no data: the chart draws `text` in place of the plot. */
export const expectNoData =
  (text: string) =>
  ({ canvasElement }: { canvasElement: HTMLElement }) =>
    waitFor(() =>
      expect(canvasElement.querySelector('.apexcharts-text-nodata')?.textContent).toBe(text)
    );

/**
 * Play function for a story rendering a wrapper in `Rerender` with a function
 * made during render in its props: the new identity redraws the chart, which is
 * what the docs warn about.
 */
export const expectRedrawOnRerender = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvasElement.querySelector('.apexcharts-svg')).not.toBeNull());
  const updateOptions = spyOn(ApexCharts.prototype, 'updateOptions');
  try {
    await userEvent.click(canvas.getByRole('button', { name: 'Re-render' }));
    await waitFor(() =>
      expect(
        updateOptions.mock.calls.filter(([options]) => Object.keys(options).length > 0)
      ).not.toEqual([])
    );
  } finally {
    updateOptions.mockRestore();
  }
};

// What a screen reader hears for the focused point: the tooltip, a polite live
// region, or ApexCharts' status region on a chart without one (radial bars).
const announcement = (root: HTMLElement) =>
  (
    root.querySelector('.apexcharts-tooltip.apexcharts-active[aria-live]') ??
    root.querySelector('.apexcharts-sr-status')
  )?.textContent?.trim() ?? '';

/**
 * Play function for a story passing `ariaLabel`: screen readers read it as the
 * chart's name. With `keyboard`, Tab reaches the chart, which announces the
 * first point, and `next` (default →) announces another; without, the chart is
 * an image, out of the tab order.
 */
export const expectAccessibleChart =
  ({ keyboard, next = '{ArrowRight}' }: { keyboard: boolean; next?: string }) =>
  async ({ canvasElement, args }: { canvasElement: HTMLElement; args: { ariaLabel?: string } }) => {
    // Read again at each step: a redraw after mount replaces the SVG.
    const svg = () => canvasElement.querySelector('.apexcharts-svg');
    await waitFor(() => expect(svg()).toHaveAttribute('aria-label', args.ariaLabel));
    if (!keyboard) {
      await expect(svg()).toHaveAttribute('role', 'img');
      await expect(svg()).not.toHaveAttribute('tabindex');
      return;
    }
    await expect(svg()).toHaveAttribute('role', 'application');
    await userEvent.tab();
    await expect(svg()).toHaveFocus();
    await waitFor(() => expect(announcement(canvasElement)).not.toBe(''));
    const first = announcement(canvasElement);
    await userEvent.keyboard(next);
    await waitFor(() => {
      expect(announcement(canvasElement)).not.toBe('');
      expect(announcement(canvasElement)).not.toBe(first);
    });
  };

/**
 * The axis titles drawn in `root`: the x one, and the y ones from left to right.
 * ApexCharts keeps an empty title element where there is no title: skipped.
 */
export const axisTitles = (root: HTMLElement) => {
  const texts = (elements: Element[]) => elements.map((el) => el.textContent).filter(Boolean);
  return {
    x: texts([...root.querySelectorAll('.apexcharts-xaxis-title-text')]),
    y: texts(
      [...root.querySelectorAll('.apexcharts-yaxis-title-text')].sort(
        (a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left
      )
    ),
  };
};

/**
 * Play function for a story with axis titles: the chart in `root` draws `x`
 * under its plot, and `y` beside it, the first on the left and a second one on
 * the right.
 */
export const expectAxisTitles =
  ({ x, y }: { x: string; y: string[] }) =>
  ({ canvasElement }: { canvasElement: HTMLElement }) =>
    expectAxisTitlesIn(canvasElement, { x, y });

export const expectAxisTitlesIn = (root: HTMLElement, { x, y }: { x: string; y: string[] }) =>
  waitFor(() => {
    expect(axisTitles(root)).toEqual({ x: [x], y });
    const plot = root.querySelector('.apexcharts-grid')?.getBoundingClientRect();
    expect(plot).toBeTruthy();
    if (!plot) return;
    const box = (selector: string) =>
      [...root.querySelectorAll(selector)].map((el) => el.getBoundingClientRect());
    for (const title of box('.apexcharts-xaxis-title-text'))
      expect(title.top).toBeGreaterThan(plot.bottom - 1);
    const [left, right] = box('.apexcharts-yaxis-title-text').sort((a, b) => a.left - b.left);
    expect(left.right).toBeLessThan(plot.left + 1);
    if (y.length > 1) expect(right.left).toBeGreaterThan(plot.right - 1);
    // The title is inside the drawing, and the chart's container ends where the
    // drawing does: ApexCharts adds 15px under it by default (parentHeightOffset).
    const svg = root.querySelector('svg.apexcharts-svg')?.getBoundingClientRect();
    const container = root
      .querySelector('.apexcharts-canvas')
      ?.parentElement?.getBoundingClientRect();
    expect(svg).toBeTruthy();
    expect(container).toBeTruthy();
    if (!svg || !container) return;
    for (const title of box('.apexcharts-xaxis-title-text')) {
      expect(title.bottom).toBeLessThan(svg.bottom + 1);
    }
    expect(container.bottom - svg.bottom).toBeLessThan(1);
  });

// The font size, in px, of the first element matching `selector`: the SVG
// attribute ApexCharts writes, or the inline style of its HTML.
const fontSizeOf = (root: HTMLElement, selector: string) => {
  const el = root.querySelector<HTMLElement | SVGElement>(selector);
  return parseFloat(el?.getAttribute('font-size') ?? el?.style.fontSize ?? '');
};

/** The sizes of the chart text in `root`: axis labels, axis title, legend. */
const textSizes = (root: HTMLElement) => ({
  axis: fontSizeOf(root, '.apexcharts-xaxis-label'),
  title: fontSizeOf(root, '.apexcharts-xaxis-title-text'),
  legend: fontSizeOf(root, '.apexcharts-legend-text'),
});

/**
 * Asserts the chart text in `root` follows the text size setting: the axis
 * labels are `text-2xs` (11px), the axis title and the legend `text-xs`
 * (12px), and the same sizes scaled by 1.125 once `<html>` takes
 * `data-text-size="lg"`. The chart needs an x-axis title and a legend. With
 * `hovered`, the tooltip is checked too, shown over that element.
 */
export const expectTextFollowsTextSize = async (
  root: HTMLElement,
  hovered?: () => Element | null
) => {
  const tooltipSize = () => fontSizeOf(root, '.apexcharts-tooltip-title');
  const open = async () => {
    if (!hovered) return;
    await waitFor(() => {
      const el = hovered();
      expect(el).not.toBeNull();
      hover(el as Element, 0.05);
      expect(root.querySelector('.apexcharts-tooltip.apexcharts-active')).not.toBeNull();
    });
  };
  const html = document.documentElement;
  const previous = html.getAttribute('data-text-size');
  await waitFor(() => expect(textSizes(root)).toEqual({ axis: 11, title: 12, legend: 12 }));
  await open();
  if (hovered) expect(tooltipSize()).toBe(12);
  try {
    html.setAttribute('data-text-size', 'lg');
    await waitFor(() =>
      expect(textSizes(root)).toEqual({ axis: 12.38, title: 13.5, legend: 13.5 })
    );
    await open();
    if (hovered) await waitFor(() => expect(tooltipSize()).toBe(13.5));
  } finally {
    if (previous === null) html.removeAttribute('data-text-size');
    else html.setAttribute('data-text-size', previous);
    if (hovered) await closeTooltip(root, hovered);
  }
};
