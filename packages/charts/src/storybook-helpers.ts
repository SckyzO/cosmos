import { expect, waitFor } from 'storybook/test';

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

/**
 * Asserts the legend texts and the center values use the theme text color,
 * then switches `<html>` to the `theme` class ('' for light) and asserts they
 * follow it.
 */
export const expectTextFollowsTheme = async (root: HTMLElement, theme: string) => {
  await waitFor(() => expectThemeText(root));
  const { classList } = document.documentElement;
  const previous = [...classList];
  classList.remove(...previous);
  if (theme) classList.add(theme);
  try {
    await waitFor(() => expectThemeText(root));
  } finally {
    classList.remove(...classList);
    classList.add(...previous);
  }
};
