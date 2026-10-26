import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RadarChart, type RadarChartProps } from './RadarChart';
import {
  closeTooltip,
  expectEmptyMessage,
  expectKeyboardWalk,
  expectLegendsAround,
  expectNoInjectedImage,
  HOSTILE,
  LegendSides,
  legendTexts,
  openTooltipAt,
  resolveColor,
  themeColor,
  tooltipCard,
} from './storybook-recharts';

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

// The text of the scale labels of the chart in `root`.
const scale = (root: Element) =>
  [...root.querySelectorAll('.recharts-polar-radius-axis-tick-value')].map((el) => el.textContent);

// The outline of each polygon, in series order.
const strokes = (root: Element) =>
  [...root.querySelectorAll<SVGElement>('.recharts-radar-polygon .recharts-polygon')].map((el) =>
    resolveColor(getComputedStyle(el).stroke)
  );

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [], categories: [] },
  play: expectEmptyMessage('No data'),
};

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
    const root = (id: string) => canvasElement.querySelector(`[data-testid="${id}"]`) as Element;
    await waitFor(() => expect(scale(root('shown'))).toContain('100%'));
    await expect([...scale(root('shown'))].sort()).toEqual(
      ['0%', '20%', '40%', '60%', '80%', '100%'].sort()
    );
    await expect(scale(root('hidden'))).toEqual([]);
  },
};

/** The polygons fill the height of a wide chart, less the room of the names and the legend. */
export const PlotFillsItsBox: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...CompareDatacenters.args },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const widths = [
        ...canvasElement.querySelectorAll('.recharts-polar-grid-concentric-polygon'),
      ].map((el) => el.getBoundingClientRect().width);
      expect(widths.length).toBeGreaterThan(0);
      // The outer polygon is a pentagon: its width is 1.9 times its radius.
      expect(Math.max(...widths)).toBeGreaterThan(235);
    });
  },
};

// Two radars side by side, the second with no series until it has mounted.
const SERIES = CompareDatacenters.args?.series ?? [];
const LateSeries = () => {
  const [late, setLate] = useState<RadarChartProps['series']>([]);
  useEffect(() => setLate(SERIES), []);
  return (
    <div className="grid grid-cols-2 gap-4">
      <div data-testid="from-start">
        <RadarChart {...CompareDatacenters.args} series={SERIES} />
      </div>
      <div data-testid="after-empty">
        <RadarChart {...CompareDatacenters.args} series={late} />
      </div>
    </div>
  );
};

/** A radar that mounts empty and then gets its series is sized like one that had them from the start. */
export const SizedAfterAnEmptyStart: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...CompareDatacenters.args },
  render: () => <LateSeries />,
  play: async ({ canvasElement }) => {
    const outer = (id: string) =>
      Math.max(
        0,
        ...[
          ...canvasElement.querySelectorAll(
            `[data-testid="${id}"] .recharts-polar-grid-concentric-polygon`
          ),
        ].map((el) => el.getBoundingClientRect().width)
      );
    await waitFor(() => {
      expect(outer('from-start')).toBeGreaterThan(0);
      expect(Math.abs(outer('after-empty') - outer('from-start'))).toBeLessThan(1);
    });
  },
};

/**
 * The legend and the tooltip are React text: series names and categories with
 * markup show as written, and nothing is injected.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      { name: HOSTILE, data: [3, 5, 2, 4] },
      { name: 'Normal', data: [4, 1, 6, 2] },
    ],
    categories: [HOSTILE, 'B', 'C', 'D'],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toEqual([HOSTILE, 'Normal']));
    await waitFor(() =>
      expect(canvasElement.querySelector('.recharts-polar-angle-axis')).not.toBeNull()
    );
    await expect(canvasElement.querySelector('.recharts-polar-angle-axis')).toHaveTextContent(
      HOSTILE
    );
    await expectNoInjectedImage(canvasElement);
    // The tooltip's title is the hovered axis, its first row the first series.
    await openTooltipAt(canvasElement, 0.5, 0.3);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')).toHaveTextContent(HOSTILE);
    await expect(card.querySelector('li')).toHaveTextContent(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement);
  },
};

/** `formatValue` formats the tooltip values. */
export const FormatValueFormatsTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    await openTooltipAt(canvasElement, 0.5, 0.3);
    await expect(tooltipCard(canvasElement)).toHaveTextContent('72%');
    await closeTooltip(canvasElement);
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
    const tokens = [
      '--color-brand-500',
      '--color-chart-2',
      '--color-chart-3',
      '--color-chart-4',
      '--color-chart-5',
    ];
    await waitFor(() => expect(strokes(canvasElement)).toEqual(tokens.map(themeColor)));
  },
};

/** Each polygon takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(strokes(canvasElement)).toEqual(['#f59e0b', '#8b5cf6'].map(resolveColor))
    );
  },
};

/** A click on a legend entry hides its polygon; another brings it back. */
export const LegendTogglesSeries: Story = {
  tags: ['!autodocs'],
  args: CompareDatacenters.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const polygons = () => canvasElement.querySelectorAll('.recharts-radar-polygon').length;
    await waitFor(() => expect(polygons()).toBe(3));
    const entry = canvas.getByRole('button', { name: 'DC2 Frankfurt' });
    await userEvent.click(entry);
    await waitFor(() => expect(polygons()).toBe(2));
    await expect(entry).toHaveAttribute('aria-pressed', 'false');
    await expect(legendTexts(canvasElement)).toEqual(['DC1 Paris', 'DC2 Frankfurt', 'DC3 London']);
    await userEvent.click(entry);
    await waitFor(() => expect(polygons()).toBe(3));
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
  play: expectLegendsAround('.recharts-polar-grid'),
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its axes. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...SingleSeries.args, ariaLabel: 'DC1 Paris scores' },
  play: expectKeyboardWalk(),
};
