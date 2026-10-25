import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { RadarChart } from './RadarChart';
import {
  HOSTILE,
  closeTooltip,
  expectNoInjectedImage,
  hover,
  legendTexts,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  expectPaletteFromTheme,
  LegendSides,
  expectLegendsOnTheirSide,
} from './storybook-helpers';

const percent = (v: number) => `${v}%`;
const SCORES = ['Latency', 'Uptime', 'Capacity', 'Cost', 'Security'];
const RESOURCES = ['CPU', 'Memory', 'Storage', 'Network', 'Power', 'Cooling'];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Radar',
  component: RadarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** One series: no legend, the name shows in the tooltip. */
export const SingleSeries: Story = {
  args: {
    categories: SCORES,
    max: 100,
    series: [{ name: 'DC1 Paris', data: [82, 99, 64, 58, 91] }],
  },
};

/** Scores out of 100: `max` pins the scale, so the polygons compare. */
export const CompareDatacenters: Story = {
  args: {
    categories: SCORES,
    max: 100,
    series: [
      { name: 'DC1 Paris', data: [82, 99, 64, 58, 91] },
      { name: 'DC2 Frankfurt', data: [74, 97, 88, 70, 85] },
      { name: 'DC3 London', data: [90, 95, 52, 81, 78] },
    ],
  },
};

/** `formatValue` formats the scale and the tooltip. */
export const FormattedValues: Story = {
  args: {
    categories: RESOURCES,
    max: 100,
    formatValue: (v) => `${v}%`,
    series: [
      { name: 'cluster-prod', data: [72, 64, 81, 38, 69, 57] },
      { name: 'cluster-staging', data: [31, 45, 52, 12, 28, 24] },
    ],
  },
};

/** `showScale` writes the scale on the polygons; `formatValue` formats it. Off by default. */
export const WithScale: Story = {
  args: {
    categories: RESOURCES,
    max: 100,
    showScale: true,
    formatValue: (v) => `${v}%`,
    series: [{ name: 'cluster-prod', data: [72, 64, 81, 38, 69, 57] }],
  },
};

export const CustomColors: Story = {
  args: {
    categories: SCORES,
    max: 100,
    colors: ['#f59e0b', '#8b5cf6'],
    series: [
      { name: 'Edge East', data: [94, 92, 41, 67, 72] },
      { name: 'Edge West', data: [88, 96, 58, 61, 80] },
    ],
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The scale labels are off by default, and `showScale` brings them back. */
export const ScaleIsOptIn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...CompareDatacenters.args },
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="hidden">
        <RadarChart {...args} />
      </div>
      <div data-testid="shown">
        <RadarChart {...args} showScale formatValue={percent} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const scale = (id: string) =>
      [...canvasElement.querySelectorAll(`[data-testid="${id}"] .apexcharts-yaxis text`)].map(
        (el) => el.textContent
      );
    await waitFor(() => expect(scale('shown')).toContain('100%'));
    await expect(scale('shown')).toEqual(['100%', '80%', '60%', '40%', '20%', '0%']);
    await expect(scale('hidden')).toEqual([]);
  },
};

/** The polygons fill the height of a wide chart, less the room of the names and the legend. */
export const PlotFillsItsBox: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...CompareDatacenters.args },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const widths = [...canvasElement.querySelectorAll('.apexcharts-radar-series polygon')].map(
        (el) => el.getBoundingClientRect().width
      );
      expect(widths.length).toBeGreaterThan(0);
      // The outer polygon is a pentagon: its width is 1.9 times its radius.
      expect(Math.max(...widths)).toBeGreaterThan(235);
    });
  },
};

/** The legend and the tooltip are HTML: series names and categories show as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    series: [
      { name: HOSTILE, data: [3, 5, 2, 4] },
      { name: 'Normal', data: [4, 1, 6, 2] },
    ],
    categories: [HOSTILE, 'B', 'C', 'D'],
  },
  play: async ({ canvasElement }) => {
    // The legend renders on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement)).toHaveLength(2));
    await expect(legendTexts(canvasElement)).toEqual([HOSTILE, 'Normal']);
    await expectNoInjectedImage(canvasElement);

    // The tooltip renders on hover of a marker: its axis is the title, its
    // series the label.
    const marker = () => canvasElement.querySelector(".apexcharts-marker[index='0'][j='0']");
    await waitFor(() => {
      hover(marker() as Element);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
        `${HOSTILE}: `
      );
    });
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement, marker);
  },
};

/** The polygons take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: ['a', 'b', 'c', 'd', 'e'].map((name) => ({ name, data: [3, 5, 4] })),
  },
  play: async ({ canvasElement }) => {
    await expectPaletteFromTheme(() =>
      [...canvasElement.querySelectorAll('.apexcharts-radar[fill="none"]')].map((el) =>
        el.getAttribute('stroke')
      )
    );
  },
};

/** `legendPosition` puts the legend on each side of the plot. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: [
      { name: 'a', data: [3, 5, 4] },
      { name: 'b', data: [4, 2, 5] },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <RadarChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...SingleSeries.args, formatValue: (v) => `${v}%` },
  render: (args) => (
    <Rerender>{(grown) => <RadarChart {...freshCopy(args)} height={grown ? 400 : 320} />}</Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...SingleSeries.args, ariaLabel: 'DC1 Paris scores' },
  play: expectAccessibleChart({ keyboard: true }),
};
