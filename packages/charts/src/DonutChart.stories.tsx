import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { DonutChart } from './DonutChart';
import {
  HOSTILE,
  expectNoInjectedImage,
  expectTextFollowsTheme,
  expectTooltipFollowsTheme,
  hover,
  legendTexts,
  resolveColor,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  expectPaletteFromTheme,
  LegendSides,
  expectLegendsOnTheirSide,
  expectMessageOnly,
  expectColorInThemes,
  expectLegendMarkersUnstroked,
} from './storybook-helpers';

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
  play: expectMessageOnly('No data'),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The legend is HTML: the labels show as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [40, 60], labels: [HOSTILE, 'Normal'] },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the label must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);
  },
};

/** Each slice takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    const fills = () =>
      [...canvasElement.querySelectorAll('.apexcharts-pie-area')].map((el) =>
        resolveColor(el.getAttribute('fill') ?? '')
      );
    await waitFor(() => expect(fills()).toEqual(STATUS_COLORS));
  },
};

/** `formatValue` formats the total, the value of the hovered slice and the tooltip value. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    const center = () => canvasElement.querySelector('.apexcharts-datalabel-value')?.textContent;
    await waitFor(() => expect(center()).toBe('1000 GiB'));
    const slice = () => canvasElement.querySelector('.apexcharts-pie-area') as Element;
    await waitFor(() => {
      slice().dispatchEvent(new MouseEvent('mouseenter'));
      expect(center()).toBe('732 GiB');
    });
    await waitFor(() => {
      hover(slice());
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-value')?.textContent).toBe(
        '732 GiB'
      );
    });
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

/** The tooltip follows the Cosmos theme: dark in the dark themes, light in the others. */
export const TooltipFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { series: [44, 23, 18], labels: ['CRIT', 'WARN', 'OK'] },
  play: async ({ canvasElement }) => {
    await expectTooltipFollowsTheme(canvasElement, () =>
      canvasElement.querySelector('.apexcharts-pie-area')
    );
  },
};

/** The gap between slices is the card's color in every theme, never ApexCharts' white. */
export const SliceGapsMatchTheSurface: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { series: [5, 3, 2], labels: ['a', 'b', 'c'] },
  play: ({ canvasElement }) =>
    expectColorInThemes(
      () => canvasElement.querySelector('.apexcharts-pie-area')?.getAttribute('stroke'),
      {
        dark: '--color-gray-900',
        'deep-blue': '--color-gray-900',
        '': '--color-white',
        sand: '--color-white',
      }
    ),
};

/** The legend swatches have no outline: ApexCharts' white ring glares in the dark themes. */
export const LegendSwatchesHaveNoOutline: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { series: [5, 3, 2], labels: ['a', 'b', 'c'] },
  play: ({ canvasElement }) => expectLegendMarkersUnstroked(canvasElement),
};

/** The slices take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [5, 4, 3, 2, 1], labels: ['a', 'b', 'c', 'd', 'e'] },
  play: async ({ canvasElement }) => {
    await expectPaletteFromTheme(() =>
      [...canvasElement.querySelectorAll('.apexcharts-pie-area')].map((el) =>
        el.getAttribute('fill')
      )
    );
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
  play: expectLegendsOnTheirSide,
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...BottomLegend.args, colors: STATUS_COLORS, formatValue: gib },
  render: (args) => (
    <Rerender>{(grown) => <DonutChart {...freshCopy(args)} height={grown ? 400 : 320} />}</Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...BottomLegend.args, ariaLabel: 'Alerts by severity' },
  play: expectAccessibleChart({ keyboard: true }),
};
