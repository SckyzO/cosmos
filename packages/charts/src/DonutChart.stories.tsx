import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DonutChart } from './DonutChart';
import {
  centerText,
  closeTooltip,
  expectEmptyMessage,
  expectFitsNarrowBox,
  expectKeyboardWalk,
  expectLegendsAround,
  expectNoInjectedImage,
  HOSTILE,
  LegendSides,
  legendTexts,
  NarrowBox,
  resolveColor,
  switchTheme,
  themeColor,
  tooltipCard,
} from './storybook-recharts';

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

/** `variant="pie"` fills the disc: no hole, no center text. */
export const Pie: Story = {
  args: { series: [44, 23, 18, 9, 6], labels: SEVERITIES, variant: 'pie' },
};

export const PieChecks: Story = {
  ...Pie,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(slices(canvasElement)).toHaveLength(5));
    await waitFor(() => {
      // Nothing is written over the pie, and the middle of it is a slice.
      expect(centerText(canvasElement)).toBeNull();
      const pie = (canvasElement.querySelector('.recharts-pie') as Element).getBoundingClientRect();
      const middle = [-6, 6].flatMap((dx) =>
        [-6, 6].map((dy) =>
          document.elementFromPoint(pie.x + pie.width / 2 + dx, pie.y + pie.height / 2 + dy)
        )
      );
      expect(middle.filter((el) => el?.closest('.recharts-pie-sector'))).not.toHaveLength(0);
    });
  },
};

/** A donut has a hole: the middle of it is no slice. */
export const DonutHasAHole: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [44, 23, 18, 9, 6], labels: SEVERITIES },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(slices(canvasElement)).toHaveLength(5));
    // The pie can still be taking its size when its slices exist: read its middle until it has.
    await waitFor(() => {
      const pie = (canvasElement.querySelector('.recharts-pie') as Element).getBoundingClientRect();
      const middle = document.elementFromPoint(pie.x + pie.width / 2, pie.y + pie.height / 2);
      expect(middle !== null && canvasElement.contains(middle), 'the middle is in the chart').toBe(
        true
      );
      expect(middle?.closest('.recharts-pie-sector')).toBeNull();
    });
  },
};

/** A pie still tells its slices in the tooltip and the legend, and the legend still hides a slice. */
export const PieKeepsItsLegendAndTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [30, 20, 50], labels: ['a', 'b', 'c'], variant: 'pie' },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(slices(canvasElement)).toHaveLength(3));
    await hoverSlice(canvasElement, 2, '50');
    await userEvent.unhover(slices(canvasElement)[2]);
    await closeTooltip(canvasElement);
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'b' }));
    await waitFor(() =>
      expect(within(canvasElement).getByRole('button', { name: 'b' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    );
    await expect(canvasElement.querySelector('[data-chart-center]')).toBeNull();
  },
};

/** `centerLabel` and `centerValue` replace "Total" and the sum; a hovered slice still shows its own. */
export const CenterText: Story = {
  args: {
    series: [732, 268],
    labels: ['Used', 'Free'],
    formatValue: gib,
    centerValue: '1 TB',
    centerLabel: 'Capacity',
  },
};

export const CenterTextChecks: Story = {
  ...CenterText,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(centerText(canvasElement)).toEqual({ value: '1 TB', label: 'Capacity' })
    );
    await waitFor(() => expect(slices(canvasElement)).toHaveLength(2));
    await hoverSlice(canvasElement, 0, '732 GiB');
    await waitFor(() =>
      expect(centerText(canvasElement)).toEqual({ value: '732 GiB', label: 'Used' })
    );
    await userEvent.unhover(slices(canvasElement)[0]);
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('1 TB'));
    await closeTooltip(canvasElement);
  },
};

/** Each of the two replaces its own half; an empty `centerLabel` draws no label. */
export const CenterTextOverridesOneHalf: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [10, 30], labels: ['a', 'b'] },
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-case="value">
        <DonutChart {...args} centerValue="40 items" />
      </div>
      <div data-case="label">
        <DonutChart {...args} centerLabel="Open" />
      </div>
      <div data-case="none">
        <DonutChart {...args} centerLabel="" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const center = (name: string) =>
      centerText(canvasElement.querySelector(`[data-case="${name}"]`) as HTMLElement);
    await waitFor(() => {
      expect(center('value')).toEqual({ value: '40 items', label: 'Total' });
      expect(center('label')).toEqual({ value: '40', label: 'Open' });
      expect(center('none')).toEqual({ value: '40', label: '' });
    });
  },
};

/**
 * `legendValues` writes each slice's value and its share of the total in the
 * legend. The shares are whole percents that add up to 100.
 */
export const LegendValues: Story = {
  args: {
    series: [44, 23, 18, 9, 6],
    labels: SEVERITIES,
    legendValues: true,
    formatValue: (v) => `${v} alerts`,
  },
};

export const LegendValuesChecks: Story = {
  ...LegendValues,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(legendFigures(canvasElement)).toEqual([
        { name: 'CRIT', value: '44 alerts', share: '44%' },
        { name: 'WARN', value: '23 alerts', share: '23%' },
        { name: 'OK', value: '18 alerts', share: '18%' },
        { name: 'INFO', value: '9 alerts', share: '9%' },
        { name: 'UNK', value: '6 alerts', share: '6%' },
      ])
    );
  },
};

/** The shares add up to 100 even when each rounds the other way. */
export const LegendSharesAddUpTo100: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [1, 1, 1], labels: ['a', 'b', 'c'], legendValues: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const shares = legendFigures(canvasElement).map((entry) => parseInt(entry.share, 10));
      expect(shares).toEqual([34, 33, 33]);
      expect(shares.reduce((sum, share) => sum + share, 0)).toBe(100);
    });
  },
};

/** Hiding a slice keeps its figures and the others' shares: they are the series', not the visible ones'. */
export const LegendFiguresSurviveHidingASlice: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [30, 20, 50], labels: ['a', 'b', 'c'], legendValues: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendFigures(canvasElement)).toHaveLength(3));
    const before = legendFigures(canvasElement);
    await userEvent.click(within(canvasElement).getAllByRole('button', { name: /^b/ })[0]);
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('80'));
    await expect(legendFigures(canvasElement)).toEqual(before);
    await userEvent.click(within(canvasElement).getAllByRole('button', { name: /^b/ })[0]);
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('100'));
  },
};

/** In a column the figures reach the right edge of the legend, so the values and the shares line up. */
export const LegendValuesAlignInAColumn: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [4400, 230, 18, 9, 6],
    labels: ['Long service name', 'B', 'C', 'D', 'E'],
    legendValues: true,
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <DonutChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: async ({ canvasElement }) => {
    const rightEdges = (side: string, cell: 1 | 2) =>
      [
        ...canvasElement.querySelectorAll(`[data-side="${side}"] .recharts-legend-wrapper button`),
      ].map((button) => button.querySelectorAll('span')[cell + 1].getBoundingClientRect().right);
    await waitFor(() => {
      for (const side of ['left', 'right']) {
        for (const cell of [1, 2] as const) {
          const edges = rightEdges(side, cell);
          expect(edges, side).toHaveLength(5);
          // Same right edge for the five values, and for the five shares.
          expect(Math.max(...edges) - Math.min(...edges), `${side} ${cell}`).toBeLessThan(1);
        }
      }
      // On the top and the bottom the figures follow the name instead.
      for (const side of ['top', 'bottom']) {
        const names = [
          ...canvasElement.querySelectorAll(
            `[data-side="${side}"] .recharts-legend-wrapper button`
          ),
        ].map((b) => b.textContent);
        expect(names[0], side).toContain('Long service name');
        expect(names[0], side).toContain('%');
      }
    });
  },
};

/** The legend figures are plain text, in each side: markup in a label or a formatted value shows as written. */
export const HtmlInLegendValuesRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [40, 60],
    labels: [HOSTILE, 'Normal'],
    legendValues: true,
    formatValue: (v) => `${HOSTILE}${v}`,
    centerLabel: HOSTILE,
    centerValue: HOSTILE,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(legendFigures(canvasElement)).toEqual([
        { name: HOSTILE, value: `${HOSTILE}40`, share: '40%' },
        { name: 'Normal', value: `${HOSTILE}60`, share: '60%' },
      ])
    );
    await waitFor(() =>
      expect(centerText(canvasElement)).toEqual({ value: HOSTILE, label: HOSTILE })
    );
    await expectNoInjectedImage(canvasElement);
  },
};

/** The legend with figures does not widen the page on a narrow screen. */
export const LegendValuesFitNarrowBox: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [44, 23, 18, 9, 6],
    labels: ['Production cluster', 'Staging cluster', 'Development', 'Sandbox', 'Unknown'],
    legendValues: true,
    legendPosition: 'left',
    width: 900,
  },
  render: (args) => (
    <NarrowBox>
      <DonutChart {...args} />
    </NarrowBox>
  ),
  play: expectFitsNarrowBox,
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], labels: [] },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: expectEmptyMessage('No data'),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The slices, in order: the path of each pie sector.
const slices = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGPathElement>('.recharts-pie-sector path'),
];

// The legend entries as name, value and share, for a legend written with `legendValues`.
const legendFigures = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-legend-wrapper button')].map((button) => {
    const [name, value, share] = [...button.querySelectorAll('span')].slice(1);
    return { name: name?.textContent, value: value?.textContent, share: share?.textContent };
  });

/**
 * Hovers slice `index` until the tooltip shows `text`. While the slices draw
 * in, Recharts keys each one by its angles, so a frame replaces the hovered
 * node and its mouseenter is lost: leave and enter again until it holds.
 */
const hoverSlice = (root: HTMLElement, index: number, text: string) =>
  waitFor(async () => {
    await userEvent.unhover(slices(root)[index]);
    await userEvent.hover(slices(root)[index]);
    expect(tooltipCard(root)).toHaveTextContent(text);
  });

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
    await hoverSlice(canvasElement, 0, HOSTILE);
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
    await hoverSlice(canvasElement, 0, '732 GiB');
    await waitFor(() =>
      expect(centerText(canvasElement)).toEqual({ value: '732 GiB', label: 'Used' })
    );
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
  tags: ['!dev', '!autodocs'],
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
