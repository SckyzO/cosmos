import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BoxPlotChart } from './BoxPlotChart';
import { HOSTILE, expectNoInjectedImage, hover, legendTexts } from './storybook-helpers';

const SERVICES = ['api-gateway', 'auth', 'catalog', 'checkout', 'search', 'payment'];
const DCS = ['DC1 Paris', 'DC2 Frankfurt', 'DC3 London', 'DC4 Tokyo'];

const ms = (v: number) => `${v} ms`;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Box Plot',
  component: BoxPlotChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof BoxPlotChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * Response-time distribution per service over the last hour. Each box is a
 * `[min, q1, median, q3, max]` summary; `formatValue` formats the value axis
 * and the tooltip.
 */
export const ResponseTimes: Story = {
  args: {
    categories: SERVICES,
    series: [
      {
        name: 'Response time',
        data: [
          [8, 14, 19, 27, 64],
          [12, 22, 31, 44, 118],
          [18, 29, 36, 52, 96],
          [41, 63, 82, 121, 287],
          [24, 38, 51, 78, 212],
          [55, 84, 103, 148, 341],
        ],
      },
    ],
    formatValue: ms,
  },
};

/** `orientation="horizontal"` lays the boxes out rightward, the value axis at the bottom. */
export const Horizontal: Story = {
  args: { ...ResponseTimes.args, orientation: 'horizontal' },
};

/** Two series or more sit side by side in each category, with a legend. */
export const BeforeAfterDeploy: Story = {
  args: {
    categories: SERVICES.slice(0, 4),
    series: [
      {
        name: 'v2.14 (before)',
        data: [
          [8, 14, 19, 27, 64],
          [12, 22, 31, 44, 118],
          [18, 29, 36, 52, 96],
          [41, 63, 82, 121, 287],
        ],
      },
      {
        name: 'v2.15 (after)',
        data: [
          [7, 12, 16, 22, 51],
          [11, 19, 26, 37, 84],
          [21, 34, 45, 66, 139],
          [33, 48, 61, 89, 196],
        ],
      },
    ],
    formatValue: ms,
  },
};

/** Rack inlet temperatures per datacenter, in a fixed `colors` override. */
export const CustomColors: Story = {
  args: {
    categories: DCS,
    series: [
      {
        name: 'Inlet temperature',
        data: [
          [18.2, 20.1, 21.4, 22.6, 25.9],
          [17.5, 19.2, 20.3, 21.8, 24.1],
          [19.1, 21.6, 23.2, 24.9, 29.4],
          [16.8, 18.4, 19.7, 21.1, 23.5],
        ],
      },
    ],
    colors: ['#f59e0b'],
    orientation: 'horizontal',
    formatValue: (v) => `${v} °C`,
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The legend and the tooltip are HTML: series names and categories show as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    categories: [HOSTILE, 'B'],
    series: [
      {
        name: HOSTILE,
        data: [
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6],
        ],
      },
      {
        name: 'Normal',
        data: [
          [3, 4, 5, 6, 7],
          [1, 3, 5, 7, 9],
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    // Tooltips render on hover: the category as title, then the series.
    await waitFor(
      () => {
        hover(canvasElement.querySelector('.apexcharts-boxPlot-area') as Element);
        expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
        expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
          HOSTILE
        );
      },
      { timeout: 3000 }
    );
    await expectNoInjectedImage(canvasElement);
  },
};
