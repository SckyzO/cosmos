import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferenceLine } from 'recharts';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BoxPlotChart } from './BoxPlotChart';
import { HOSTILE, LegendSides, expectNoInjectedImage, resolveColor } from './storybook-helpers';
import {
  axisTitles,
  closeTooltip,
  expectAccessibleChart,
  expectEmptyMessage,
  expectLegendsOnTheirSide,
  legendTexts,
  openTooltip,
  surface,
  tooltipCard,
} from './storybook-recharts';
import { barFills, expectRepaintsWithThemeOf } from './storybook-cartesian';

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

/**
 * `xTitle` and `yTitle` name the axes as drawn: a horizontal chart puts its
 * values under `xTitle`.
 */
export const AxisTitles: Story = {
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="vertical">
        <BoxPlotChart {...args} xTitle="Service" yTitle="Response time (ms)" />
      </div>
      <div data-testid="horizontal">
        <BoxPlotChart
          {...args}
          orientation="horizontal"
          xTitle="Response time (ms)"
          yTitle="Service"
        />
      </div>
    </div>
  ),
  args: { ...ResponseTimes.args, formatValue: undefined },
  play: async ({ canvasElement }) => {
    const chart = (id: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    await waitFor(() => {
      expect(axisTitles(chart('vertical'))).toEqual({
        x: ['Service'],
        y: ['Response time (ms)'],
      });
      expect(axisTitles(chart('horizontal'))).toEqual({
        x: ['Response time (ms)'],
        y: ['Service'],
      });
    });
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], categories: [] },
  play: expectEmptyMessage('No data'),
};

/**
 * `children` takes Recharts elements, drawn inside the chart: here a
 * `ReferenceLine` for a latency budget, in the units of the values.
 */
export const ReferenceLineInChildren: Story = {
  args: {
    ...ResponseTimes.args,
    children: (
      <ReferenceLine
        y={100}
        stroke="var(--color-status-crit)"
        strokeDasharray="6 4"
        label={{
          value: 'Budget 100 ms',
          position: 'insideTopLeft',
          fill: 'var(--color-text-muted)',
        }}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.recharts-reference-line line')).not.toBeNull();
      expect(canvasElement.textContent).toContain('Budget 100 ms');
    });
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * The legend and the tooltip are React text: a series name, a category or an
 * axis title with markup shows as written, and nothing is injected.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    xTitle: HOSTILE,
    yTitle: HOSTILE,
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
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await expectNoInjectedImage(canvasElement);
    await waitFor(() => expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE] }));
    await openTooltip(canvasElement, 0.3);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')).toHaveTextContent(HOSTILE);
    await expect(card.querySelector('li')).toHaveTextContent(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement);
  },
};

// The five numbers of the first service of `ResponseTimes`, [8, 14, 19, 27, 64].
const geometry = (root: HTMLElement) => {
  const series = root.querySelector('.recharts-bar-rectangle');
  const box = series?.querySelector('rect')?.getBoundingClientRect();
  const lines = [...(series?.querySelectorAll('line') ?? [])].map((el) =>
    el.getBoundingClientRect()
  );
  return { box, lines };
};

/** The box spans the quartiles, the median sits inside it and the whiskers reach the extremes. */
export const BoxIsDrawnAtScale: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="vertical">
        <BoxPlotChart {...args} />
      </div>
      <div data-testid="horizontal">
        <BoxPlotChart {...args} orientation="horizontal" />
      </div>
    </div>
  ),
  args: ResponseTimes.args,
  play: async ({ canvasElement }) => {
    const chart = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    await waitFor(() => {
      for (const id of ['vertical', 'horizontal']) {
        const { box, lines } = geometry(chart(id));
        expect(box, id).toBeDefined();
        // lines: lower whisker, upper whisker, two caps, median.
        expect(lines, id).toHaveLength(5);
        const tall = id === 'vertical';
        const along = (r: DOMRect) =>
          tall ? { start: r.top, end: r.bottom } : { start: r.left, end: r.right };
        const [lower, upper, , , median] = lines.map(along);
        const q = along(box as DOMRect);
        const whiskers = tall ? lower.end - upper.start : upper.end - lower.start;
        // [8, 14, 19, 27, 64]: the box is 13 of the 56 between the whiskers.
        expect((q.end - q.start) / Math.abs(whiskers)).toBeCloseTo(13 / 56, 1);
        // The median is 5 of the 13 from the first quartile.
        const fromQ1 = tall ? q.end - median.start : median.start - q.start;
        expect(fromQ1 / (q.end - q.start)).toBeCloseTo(5 / 13, 1);
      }
    });
  },
};

/** The tooltip lists the five numbers, formatted, from the maximum down to the minimum. */
export const TooltipListsTheFiveNumbers: Story = {
  tags: ['!dev', '!autodocs'],
  args: ResponseTimes.args,
  play: async ({ canvasElement }) => {
    await openTooltip(canvasElement, 0.12);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')).toHaveTextContent('api-gateway');
    await expect([...card.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Max64 ms',
      'Q327 ms',
      'Median19 ms',
      'Q114 ms',
      'Min8 ms',
    ]);
    await closeTooltip(canvasElement);
  },
};

/** With several series the tooltip heads each block with the series name. */
export const TooltipHeadsEachSeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: BeforeAfterDeploy.args,
  play: async ({ canvasElement }) => {
    await openTooltip(canvasElement, 0.15);
    const rows = [...(tooltipCard(canvasElement)?.querySelectorAll('li') ?? [])].map(
      (li) => li.textContent
    );
    await expect(rows).toHaveLength(12);
    await expect(rows[0]).toBe('v2.14 (before)');
    await expect(rows[6]).toBe('v2.15 (after)');
    await closeTooltip(canvasElement);
  },
};

/** A click on a legend entry hides its boxes and shows them again. */
export const LegendTogglesSeries: Story = {
  tags: ['!autodocs'],
  args: BeforeAfterDeploy.args,
  play: async ({ canvasElement }) => {
    const boxes = () => canvasElement.querySelectorAll('.recharts-bar-rectangle rect').length;
    await waitFor(() => expect(boxes()).toBe(8));
    const after = within(canvasElement).getByRole('button', { name: 'v2.15 (after)' });
    await userEvent.click(after);
    await waitFor(() => expect(boxes()).toBe(4));
    await expect(after).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(after);
    await waitFor(() => expect(boxes()).toBe(8));
  },
};

/** The boxes take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A'],
    series: ['a', 'b', 'c', 'd', 'e'].map((name) => ({ name, data: [[1, 2, 3, 4, 5]] })),
  },
  play: async ({ canvasElement }) => {
    const tokens = [
      '--color-brand-500',
      '--color-chart-2',
      '--color-chart-3',
      '--color-chart-4',
      '--color-chart-5',
    ];
    const css = (token: string) =>
      resolveColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
    await waitFor(() => expect(barFills(canvasElement).map(resolveColor)).toEqual(tokens.map(css)));
  },
};

/** `colors` overrides the palette, one color per series. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(barFills(canvasElement).map(resolveColor)).toEqual([resolveColor('#f59e0b')])
    );
  },
};

/** A theme or accent switch on `<html>` repaints the chart with no observer and no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: ResponseTimes.args,
  play: ({ canvasElement }) =>
    expectRepaintsWithThemeOf(canvasElement, () => barFills(canvasElement)[0]),
};

/** `legendPosition` puts the legend on each side of the plot. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B'],
    series: [
      {
        name: 'a',
        data: [
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6],
        ],
      },
      {
        name: 'b',
        data: [
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6],
        ],
      },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <BoxPlotChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ResponseTimes.args, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375 }}>
      <BoxPlotChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(surface(canvasElement)).not.toBeNull());
    await waitFor(() => {
      expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
      expect(surface(canvasElement)?.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    });
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its boxes. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ResponseTimes.args, ariaLabel: 'Response times per service' },
  play: expectAccessibleChart({ keyboard: true }),
};
