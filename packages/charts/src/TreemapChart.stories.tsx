import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreemapChart } from './TreemapChart';

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
