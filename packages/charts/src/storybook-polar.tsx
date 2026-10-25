import { expect, userEvent, waitFor } from 'storybook/test';
import { closeTooltip, surface, tooltipCard } from './storybook-recharts';
import type { ChartLegendPosition } from './types';

// Helpers for the stories of the polar charts drawn with Recharts (donut,
// radial bars, gauges, radar), next to the ones in `storybook-recharts.tsx`.

const SIDES: ChartLegendPosition[] = ['top', 'right', 'bottom', 'left'];

/**
 * Play function for a story rendering a wrapper in `LegendSides`: each legend
 * sits on its side of the polygon found by `plot` (a selector), outside of it.
 */
export const expectLegendsAround =
  (plot: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    for (const side of SIDES) {
      const chart = canvasElement.querySelector(`[data-side="${side}"]`);
      await waitFor(() => {
        const legend = chart?.querySelector('.recharts-legend-wrapper');
        const drawn = chart?.querySelector(plot);
        expect(legend?.querySelector('button'), side).toBeTruthy();
        expect(drawn, side).toBeTruthy();
        const l = (legend as Element).getBoundingClientRect();
        const p = (drawn as Element).getBoundingClientRect();
        const outside = {
          top: l.bottom <= p.top + 1,
          bottom: l.top >= p.bottom - 1,
          left: l.right <= p.left + 1,
          right: l.left >= p.right - 1,
        };
        expect(
          outside[side],
          `${side}: legend ${JSON.stringify(l)}, plot ${JSON.stringify(p)}`
        ).toBe(true);
      });
    }
  };

/** The value and the label drawn in the middle of a polar chart (`CenterText`), or `null` if there is none. */
export const centerText = (root: HTMLElement) => {
  const text = root.querySelector('[data-chart-center]');
  if (!text) return null;
  const [value, label] = [...text.querySelectorAll('tspan')].map((el) => el.textContent);
  return { value, label: label ?? '' };
};

/**
 * Like `expectAccessibleChart` with `keyboard`, for a chart whose legend comes
 * first in the tab order: Tab walks past the legend buttons to the chart,
 * which announces its first point (on focus, or on the first `next` key when
 * `announcesOnFocus` is off), and `next` (default →) another.
 */
export const expectKeyboardWalk =
  ({
    next = '{ArrowRight}',
    announcesOnFocus = true,
  }: { next?: string; announcesOnFocus?: boolean } = {}) =>
  async ({ canvasElement, args }: { canvasElement: HTMLElement; args: { ariaLabel?: string } }) => {
    const svg = () => surface(canvasElement) as SVGSVGElement;
    await waitFor(() => expect(svg()).toHaveAttribute('aria-label', args.ariaLabel));
    await expect(svg()).toHaveAttribute('role', 'application');
    for (let i = 0; i < 12 && document.activeElement !== svg(); i++) await userEvent.tab();
    await expect(svg()).toHaveFocus();
    // A pie reads its first slice on the first arrow key, not on focus.
    if (!announcesOnFocus) await userEvent.keyboard(next);
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
