import { expect, waitFor } from 'storybook/test';
import { resolveColor, switchTheme, themeColor } from './storybook-helpers';

// Helpers for the stories of the cartesian charts on Recharts (bars, boxes,
// scatter points, ranges), next to the ones in `storybook-recharts.tsx`, which
// read the stroke of a line or an area.

/** The shapes of each bar series in `root`, series first. */
export const barShapes = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-bar')].map((series) => [
    ...series.querySelectorAll<SVGElement>('.recharts-bar-rectangle path'),
  ]);

/** The fill of the first bar of each series, in series order. */
export const barFills = (root: HTMLElement) =>
  barShapes(root).map((shapes) => (shapes[0] ? getComputedStyle(shapes[0]).fill : ''));

/**
 * Asserts a theme switch repaints the chart in `root` with no observer and no
 * redraw: the computed color of a tick label is the theme's muted text color
 * and follows `<html>`'s class, and `firstSeries()` (the color of the first
 * series as drawn) is the accent of the `data-accent` `<html>` is given.
 */
export const expectRepaintsWithThemeOf = async (root: HTMLElement, firstSeries: () => string) => {
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
    // A bar has no shape until its entrance animation gives it a size.
    await waitFor(() => expect(resolveColor(firstSeries())).toBe(themeColor('--color-brand-500')));
    await expect(resolveColor(firstSeries())).toBe(resolveColor('#038378'));
  } finally {
    if (previous === null) html.removeAttribute('data-accent');
    else html.setAttribute('data-accent', previous);
  }
};
