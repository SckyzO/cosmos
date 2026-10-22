import { expect, waitFor } from 'storybook/test';

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
const resolveColor = (color: string) => {
  colorContext.fillStyle = '#000';
  colorContext.fillStyle = color;
  return colorContext.fillStyle;
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
