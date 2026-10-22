import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreemapChart } from './TreemapChart';
import { expect, waitFor } from 'storybook/test';
import { contrastRatio, expectTooltipFollowsTheme } from './storybook-helpers';

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Treemap',
  component: TreemapChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof TreemapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** Tile area follows `y`; every tile takes the next palette color. */
export const Distributed: Story = {
  args: {
    series: [
      {
        data: [
          { x: 'DC1', y: 218 },
          { x: 'DC2', y: 152 },
          { x: 'DC3', y: 96 },
          { x: 'edge-east', y: 64 },
          { x: 'edge-west', y: 48 },
          { x: 'lab', y: 22 },
        ],
      },
    ],
  },
};

/** One series per group: the tiles of a series stay together. */
export const MultipleSeries: Story = {
  args: {
    series: [
      {
        name: 'Paris',
        data: [
          { x: 'compute', y: 120 },
          { x: 'storage', y: 64 },
          { x: 'gpu', y: 38 },
        ],
      },
      {
        name: 'Frankfurt',
        data: [
          { x: 'compute', y: 92 },
          { x: 'storage', y: 51 },
          { x: 'network', y: 17 },
        ],
      },
    ],
  },
};

/** The tooltip follows the Cosmos theme: dark in the dark themes, light in the others. */
export const TooltipFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: {
    series: [
      {
        data: [
          { x: 'DC1', y: 218 },
          { x: 'DC2', y: 152 },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await expectTooltipFollowsTheme(canvasElement, () =>
      canvasElement.querySelector('.apexcharts-treemap-rect')
    );
  },
};

/** Each tile label reads on its tile: white on the green or amber was under 3:1. */
export const LabelsReadOnTiles: Story = {
  tags: ['!dev', '!autodocs'],
  args: Distributed.args,
  play: async ({ canvasElement }) => {
    const labelled = () =>
      [...canvasElement.querySelectorAll('.apexcharts-treemap-rect')].flatMap((rect) => {
        const label = rect.nextElementSibling?.querySelector('text');
        const fill = rect.getAttribute('fill');
        const text = label?.getAttribute('fill');
        return fill && text ? [{ fill, text }] : [];
      });
    await waitFor(() => expect(labelled().length).toBeGreaterThanOrEqual(5));
    for (const { fill, text } of labelled()) {
      expect(contrastRatio(text, fill)).toBeGreaterThanOrEqual(4.5);
    }
  },
};
