import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { RadialBarChart } from './RadialBarChart';
import { HOSTILE, expectNoInjectedImage, resolveColor, themeColor } from './storybook-helpers';
import {
  centerText,
  expectKeyboardWalk,
  hoverRing,
  leaveRing,
  ringSectors,
} from './storybook-polar';
import { expectEmptyMessage, tooltipCard } from './storybook-recharts';

const RING_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const points = (v: number) => `${v} pts`;

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
      {title}
    </p>
    {children}
  </div>
);

const meta = {
  title: 'Charts/Radial Bar',
  component: RadialBarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when `component` is set and the props have
  // required fields.
  args: { series: [78, 62, 88, 41], labels: ['CPU', 'Mem', 'Disk', 'Net'] },
} satisfies Meta<typeof RadialBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** One track per series, values in percent; the center shows their average. */
export const MultipleSeries: Story = {
  render: (args) => (
    <Card title="Node usage">
      <RadialBarChart {...args} />
    </Card>
  ),
};

/** `colors` overrides the palette, one color per ring. */
export const CustomColors: Story = {
  args: { colors: RING_COLORS },
  render: (args) => (
    <Card title="Node usage">
      <RadialBarChart {...args} />
    </Card>
  ),
};

/**
 * `formatValue` replaces the percent in the ring values and the average. It
 * gets the series value, on the 0–100 scale of the rings.
 */
export const FormattedValues: Story = {
  args: {
    series: [92, 78, 64, 85],
    labels: ['Security', 'Reliability', 'Performance', 'Cost'],
    formatValue: points,
  },
  render: (args) => (
    <Card title="Audit scores">
      <RadialBarChart {...args} />
    </Card>
  ),
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], labels: [] },
  render: (args) => (
    <Card title="RadialBarChart">
      <RadialBarChart {...args} />
    </Card>
  ),
  play: expectEmptyMessage('No data'),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The sectors of the rings, in series order, and their fills.
const rings = ringSectors;
const ringFills = (root: HTMLElement) =>
  rings(root).map((el) => resolveColor(getComputedStyle(el).fill));

/** The first series is the outer ring: each ring sits inside the one before. */
export const FirstSeriesIsTheOuterRing: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const widths = rings(canvasElement).map((el) => el.getBoundingClientRect().width);
      expect(widths).toHaveLength(4);
      for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeLessThan(widths[i - 1]);
    });
  },
};

/** A value beyond the scale stops its arc at the end; the center and the tooltip give the value. */
export const RingsClampButShowTheValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [120, 40], labels: ['Over', 'Half'] },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(rings(canvasElement)).toHaveLength(2));
    await hoverRing(canvasElement, 0, ['Over', 'Half']);
    await waitFor(() =>
      expect(centerText(canvasElement)).toEqual({ value: '120%', label: 'Over' })
    );
    await waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent('120%'));
    await leaveRing(canvasElement, 0);
  },
};

/** The rings are React text in the tooltip: a label with markup shows as written. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: { series: [60, 40], labels: [HOSTILE, 'Normal'] },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(rings(canvasElement)).toHaveLength(2));
    await hoverRing(canvasElement, 0, [HOSTILE, 'Normal']);
    await waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent(HOSTILE));
    await expect(centerText(canvasElement)?.label).toBe(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await leaveRing(canvasElement, 0);
  },
};

/** Each ring takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(ringFills(canvasElement)).toEqual(RING_COLORS.map(resolveColor)));
  },
};

/**
 * The center leads with its value: big and bold, over a small label, for the
 * average and for a hovered ring alike.
 */
export const CenterValueLeadsItsLabel: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const sizes = () => {
      const [value, label] = [...canvasElement.querySelectorAll('[data-chart-center] tspan')].map(
        (el) => ({
          size: parseFloat(getComputedStyle(el).fontSize),
          weight: getComputedStyle(el).fontWeight,
        })
      );
      return { value, label };
    };
    const expectValueOverLabel = () => {
      const { value, label } = sizes();
      expect(label.size).toBeGreaterThan(0);
      expect(value.size).toBeGreaterThan(label.size);
      expect(value.weight).toBe('700');
    };
    await waitFor(() => {
      expect(centerText(canvasElement)?.label).toBe('Avg');
      expectValueOverLabel();
    });
    await hoverRing(canvasElement, 0, ['CPU', 'Mem', 'Disk', 'Net']);
    await waitFor(() => {
      expect(centerText(canvasElement)?.label).toBe('CPU');
      expectValueOverLabel();
    });
    await leaveRing(canvasElement, 0);
  },
};

/** `formatValue` formats the average, the value of the hovered ring and the tooltip. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    // The average of 92, 78, 64 and 85, rounded.
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('80 pts'));
    await hoverRing(canvasElement, 0, ['Security', 'Reliability', 'Performance', 'Cost']);
    await waitFor(() => expect(centerText(canvasElement)?.value).toBe('92 pts'));
    await waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent('92 pts'));
    await leaveRing(canvasElement, 0);
  },
};

/** The rings take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [92, 78, 64, 85, 40],
    labels: ['CPU', 'RAM', 'Disk', 'Net', 'GPU'],
  },
  play: async ({ canvasElement }) => {
    const tokens = [
      '--color-brand-500',
      '--color-chart-2',
      '--color-chart-3',
      '--color-chart-4',
      '--color-chart-5',
    ];
    await waitFor(() => expect(ringFills(canvasElement)).toEqual(tokens.map(themeColor)));
  },
};

/**
 * Screen readers read `ariaLabel` as the chart's name; Tab reaches the chart
 * and the arrow keys walk its rings, one per series.
 */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ariaLabel: 'Node usage' },
  play: expectKeyboardWalk({ announcesOnFocus: false }),
};
