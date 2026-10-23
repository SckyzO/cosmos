import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { RadarChart } from './RadarChart';
import {
  HOSTILE,
  expectNoInjectedImage,
  hover,
  legendTexts,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
} from './storybook-helpers';

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
    await waitFor(() => {
      hover(canvasElement.querySelector(".apexcharts-marker[index='0'][j='0']") as Element);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
        `${HOSTILE}: `
      );
    });
    await expectNoInjectedImage(canvasElement);
  },
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
