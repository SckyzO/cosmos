import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { DonutChart, DonutRightLegend } from './DonutChart';
import {
  HOSTILE,
  expectNoInjectedImage,
  expectTextFollowsTheme,
  legendTexts,
} from './storybook-helpers';

const SEVERITIES = ['CRIT', 'WARN', 'OK', 'INFO', 'UNK'];
const REGIONS = ['eu-west', 'eu-central', 'us-east', 'us-west', 'ap-south'];
const REQUESTS_BY_RANGE = {
  'Last hour': [4200, 3100, 2800, 1500, 900],
  'Last 24 h': [96000, 81000, 74000, 42000, 21000],
};
type Range = keyof typeof REQUESTS_BY_RANGE;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Donut',
  component: DonutChart,
  subcomponents: { DonutRightLegend },
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

/** `rightLegend` (or `DonutRightLegend`) moves the legend beside the donut. */
export const RightLegend: Story = {
  args: { series: [44, 23, 18, 9, 6], labels: SEVERITIES, rightLegend: true },
};

export const TwoSlices: Story = {
  args: { series: [732, 268], labels: ['Used (GiB)', 'Free (GiB)'] },
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

// ── Interaction tests ────────────────────────────────────────────────────────

/** The legend is HTML: the labels show as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: { series: [40, 60], labels: [HOSTILE, 'Normal'] },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the label must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);
  },
};

/** The legend and the center value use the theme text color and follow theme changes. */
export const TextFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { series: [44, 23, 18], labels: ['CRIT', 'WARN', 'OK'] },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement).length).toBe(3));
    await expectTextFollowsTheme(canvasElement, 'sand');
  },
};
