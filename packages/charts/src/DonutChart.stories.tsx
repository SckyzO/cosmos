import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DonutChart } from './DonutChart';
import {
  HOSTILE,
  LegendSides,
  expectNoInjectedImage,
  resolveColor,
  switchTheme,
  themeColor,
} from './storybook-helpers';
import { centerText, expectKeyboardWalk, expectLegendsAround } from './storybook-polar';
import { closeTooltip, expectEmptyMessage, legendTexts, tooltipCard } from './storybook-recharts';

const SEVERITIES = ['CRIT', 'WARN', 'OK', 'INFO', 'UNK'];
const REGIONS = ['eu-west', 'eu-central', 'us-east', 'us-west', 'ap-south'];
const REQUESTS_BY_RANGE = {
  'Last hour': [4200, 3100, 2800, 1500, 900],
  'Last 24 h': [96000, 81000, 74000, 42000, 21000],
};
type Range = keyof typeof REQUESTS_BY_RANGE;
const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const gib = (v: number) => `${v} GiB`;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Donut',
  component: DonutChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** The center shows the total; the legend sits below. */
export const BottomLegend: Story = {
  args: { series: [44, 23, 18, 9, 6], labels: SEVERITIES },
};

/** `legendPosition="right"` moves the legend beside the donut. */
export const RightLegend: Story = {
  args: { series: [44, 23, 18, 9, 6], labels: SEVERITIES, legendPosition: 'right' },
};

export const TwoSlices: Story = {
  args: { series: [732, 268], labels: ['Used (GiB)', 'Free (GiB)'] },
};

/** `colors` overrides the palette, here with the status colors. */
export const CustomColors: Story = {
  args: { series: [71, 21, 8], labels: ['OK', 'WARN', 'CRIT'], colors: STATUS_COLORS },
};

/** `formatValue` formats the total, the value of the hovered slice and the tooltip. */
export const FormattedValues: Story = {
  args: { series: [732, 268], labels: ['Used', 'Free'], formatValue: gib },
};

/** New `series` animate the slices to their new size. */
export const UpdatingSeries: Story = {
  args: { series: REQUESTS_BY_RANGE['Last hour'], labels: REGIONS },
  render: (args) => {
    const [range, setRange] = useState<Range>('Last hour');
    return (
      <div>
        <div className="mb-3 flex gap-2">
          {(Object.keys(REQUESTS_BY_RANGE) as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === range}
              onClick={() => setRange(r)}
              className="aria-pressed:border-brand-500 aria-pressed:text-brand-600 dark:aria-pressed:border-brand-500 dark:aria-pressed:text-brand-400 rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              {r}
            </button>
          ))}
        </div>
        <DonutChart {...args} series={REQUESTS_BY_RANGE[range]} />
      </div>
    );
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], labels: [] },
  play: expectEmptyMessage('No data'),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The slices, in order: the path of each pie sector.
const slices = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGPathElement>('.recharts-pie-sector path'),
];

/**
 * The legend and the tooltip are React text: a label with markup shows as
 * written, and nothing is injected.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [40, 60], labels: [HOSTILE, 'Normal'] },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toEqual([HOSTILE, 'Normal']));
    await waitFor(() => expect(slices(canvasElement)).toHaveLength(2));
    await userEvent.hover(slices(canvasElement)[0]);
    await waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent(HOSTILE));
    // The center names the hovered slice.
    await expect(centerText(canvasElement)?.label).toBe(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(slices(canvasElement)[0]);
    await closeTooltip(canvasElement);
  },
};

/** Each slice takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(slices(canvasElement).map((el) => resolveColor(getComputedStyle(el).fill))).toEqual(
        STATUS_COLORS.map(resolveColor)
      )
    );
  },
};

/** `formatValue` formats the total, the value of the hovered slice and the tooltip value. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(centerText(canvasElement)).toEqual({ value: '1000 GiB', label: 'Total' })
    );
    await waitFor(() => expect(slices(canvasElement)).toHaveLength(2));
    await userEvent.hover(slices(canvasElement)[0]);
    await waitFor(() =>
      expect(centerText(canvasElement)).toEqual({ value: '732 GiB', label: 'Used' })
    );
    await waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent('732 GiB'));
    await userEvent.unhover(slices(canvasElement)[0]);
    await waitFor(() => expect(centerText(canvasElement)?.label).toBe('Total'));
    await closeTooltip(canvasElement);
  },
};

/** The legend, the center and the tooltip use the theme's colors and follow theme changes. */
export const TextFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { series: [44, 23, 18], labels: ['CRIT', 'WARN', 'OK'] },
  play: async ({ canvasElement }) => {
    const legendColor = () =>
      resolveColor(
        getComputedStyle(canvasElement.querySelector('.recharts-legend-wrapper button') as Element)
          .color
      );
    const centerColor = () =>
      resolveColor(
        getComputedStyle(canvasElement.querySelector('[data-chart-center] tspan') as Element).fill
      );
    await waitFor(() => expect(legendTexts(canvasElement)).toHaveLength(3));
    await expect(legendColor()).toBe(themeColor('--color-text-muted'));
    await expect(centerColor()).toBe(themeColor('--color-text-primary'));
    const dark = centerColor();
    const restore = switchTheme('');
    try {
      await expect(legendColor()).toBe(themeColor('--color-text-muted'));
      await expect(centerColor()).toBe(themeColor('--color-text-primary'));
      await expect(centerColor()).not.toBe(dark);
    } finally {
      restore();
    }
  },
};

/** The slices take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [5, 4, 3, 2, 1], labels: ['a', 'b', 'c', 'd', 'e'] },
  play: async ({ canvasElement }) => {
    const tokens = [
      '--color-brand-500',
      '--color-chart-2',
      '--color-chart-3',
      '--color-chart-4',
      '--color-chart-5',
    ];
    await waitFor(() =>
      expect(slices(canvasElement).map((el) => resolveColor(getComputedStyle(el).fill))).toEqual(
        tokens.map(themeColor)
      )
    );
  },
};

/** A click on a legend entry hides its slice and the total follows; another click brings it back. */
export const LegendTogglesSlices: Story = {
  tags: ['!autodocs'],
  args: { series: [30, 20, 50], labels: ['a', 'b', 'c'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const drawn = () => slices(canvasElement).filter((el) => el.getAttribute('d'));
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('100'));
    const entry = canvas.getByRole('button', { name: 'b' });
    await userEvent.click(entry);
    // The same button stays: focus is not lost.
    await expect(entry).toBeInTheDocument();
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('80'));
    await expect(entry).toHaveAttribute('aria-pressed', 'false');
    await expect(drawn().length).toBeLessThan(3);
    // The legend keeps the hidden entry and the order.
    await expect(legendTexts(canvasElement)).toEqual(['a', 'b', 'c']);
    entry.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('100'));
    await expect(entry).toHaveAttribute('aria-pressed', 'true');
  },
};

/** `legendPosition` puts the legend on each side of the plot. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [5, 3, 2], labels: ['a', 'b', 'c'] },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <DonutChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsAround('.recharts-pie'),
};

/** The center stays in the middle of the ring, whichever side the legend takes. */
export const CenterFollowsThePlot: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [5, 3, 2], labels: ['a', 'b', 'c'] },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <DonutChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const chart = canvasElement.querySelector(`[data-side="${side}"]`) as Element;
        const ring = chart.querySelector('.recharts-pie')?.getBoundingClientRect();
        const center = chart.querySelector('[data-chart-center] tspan')?.getBoundingClientRect();
        expect(ring && center, side).toBeTruthy();
        if (!ring || !center) return;
        expect(
          Math.abs(center.x + center.width / 2 - (ring.x + ring.width / 2)),
          side
        ).toBeLessThan(3);
        expect(
          Math.abs(center.y + center.height / 2 - (ring.y + ring.height / 2)),
          side
        ).toBeLessThan(ring.height / 4);
      }
    });
  },
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its slices. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...BottomLegend.args, ariaLabel: 'Alerts by severity' },
  play: expectKeyboardWalk({ announcesOnFocus: false }),
};
