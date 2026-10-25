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

/**
 * Moves the pointer over the plot, at `xRatio` and `yRatio` of the chart's
 * size, until the tooltip shows: a polar chart picks the point from the angle
 * of the pointer around its center.
 */
export const openTooltipAt = (root: HTMLElement, xRatio: number, yRatio: number) =>
  waitFor(() => {
    const svg = surface(root) as SVGSVGElement;
    const { left, top, width, height } = svg.getBoundingClientRect();
    svg.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: left + width * xRatio,
        clientY: top + height * yRatio,
      })
    );
    expect(tooltipCard(root)).not.toBeNull();
  });

const RING_SECTOR = '.recharts-radial-bar-sector';

/** The arc of each ring of a `RadialBarChart`, in series order. */
export const ringSectors = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGPathElement>(RING_SECTOR),
];

/**
 * Puts the pointer on ring `index` of those named `names` (the first is the
 * outer one), to the right of the center, until its tooltip and the center
 * name it: the ring reports the hover to the center, the chart's own pointer
 * tracking opens the tooltip.
 * `inner` is the share of the radius the rings leave empty in the middle.
 */
export const hoverRing = (root: HTMLElement, index: number, names: string[], inner = 0.4) =>
  waitFor(async () => {
    const svg = surface(root) as SVGSVGElement;
    const { left, top, width, height } = svg.getBoundingClientRect();
    const radius = Math.min(width, height) / 2;
    const at = radius - ((index + 0.5) * radius * (1 - inner)) / names.length;
    const sector = ringSectors(root)[index];
    expect(sector).toBeTruthy();
    await userEvent.hover(sector);
    svg.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: left + width / 2 + at,
        clientY: top + height / 2,
      })
    );
    expect(tooltipCard(root)).toHaveTextContent(names[index]);
    expect(centerText(root)?.label).toBe(names[index]);
  });

/** Takes the pointer off ring `index` and waits until the tooltip is gone. */
export const leaveRing = (root: HTMLElement, index: number) => {
  ringSectors(root)[index]?.dispatchEvent(
    new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })
  );
  return closeTooltip(root);
};
