import ApexCharts from 'apexcharts/core';
import { useState, type ReactNode } from 'react';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';

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
const switchTheme = (theme: string) => {
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
