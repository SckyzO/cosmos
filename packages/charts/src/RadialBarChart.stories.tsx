import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { GradientRadial } from './GradientRadial';
import { RadialBarChart } from './RadialBarChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';
import {
  expectColorInThemes,
  expectPaletteFromTheme,
  resolveColor,
  expectTextFollowsTheme,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  expectMessageOnly,
} from './storybook-helpers';

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
  play: expectMessageOnly('No data'),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** Every wrapper's center value uses the theme text color and follows theme changes. */
export const TextFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'deep-blue' },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <RadialBarChart series={[78, 62]} labels={['CPU', 'Mem']} />
      <GradientRadial value={84} label="Health" />
      <SemiCircleGauge value={67} label="Load" />
      <StrokedGauge value={92} label="Uptime" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.apexcharts-datalabel-value').length).toBe(4)
    );
    await expectTextFollowsTheme(canvasElement, '');
  },
};

/** Each ring takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    // The ring colors, resolved without any alpha.
    const strokes = () =>
      [...canvasElement.querySelectorAll('.apexcharts-radial-series path')].map((el) =>
        resolveColor(
          (el.getAttribute('stroke') ?? '').replace(/^rgba\((.*),\s*[\d.]+\)$/, 'rgb($1)')
        )
      );
    await waitFor(() => expect(strokes()).toEqual(RING_COLORS));
  },
};

/**
 * The arcs are drawn opaque: at ApexCharts' 0.85 default they looked duller
 * than their legend swatches and the colors of the page.
 */
export const ArcsAreOpaque: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <RadialBarChart series={[78, 62]} labels={['CPU', 'Mem']} colors={['#10b981', '#8b5cf6']} />
      <GradientRadial value={84} label="Health" color="#8b5cf6" />
      <SemiCircleGauge value={67} label="Load" color="#f59e0b" />
      <StrokedGauge value={92} label="Uptime" color="#ef4444" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const arcs = [...canvasElement.querySelectorAll('.apexcharts-radialbar-area[j]')];
      // Two rings, then one arc for each of the three gauges.
      expect(arcs.length).toBe(5);
      for (const arc of arcs) {
        const stroke = arc.getAttribute('stroke') ?? '';
        // The gradient is a url(); a plain color is rgba(…, alpha) at ApexCharts' fill opacity.
        if (stroke.startsWith('url')) continue;
        expect(resolveColor(stroke), stroke).not.toMatch(/^rgba\(.*, (?!1\))/);
      }
    });
  },
};

/**
 * The center leads with its value: big and bold, over a small label, for the
 * average and for a hovered ring alike.
 */
export const CenterValueLeadsItsLabel: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const size = (selector: string) => {
      const el = canvasElement.querySelector(selector);
      return {
        size: parseFloat(el?.getAttribute('font-size') ?? '0'),
        weight: el?.getAttribute('font-weight'),
      };
    };
    const expectValueOverLabel = () => {
      const value = size('.apexcharts-datalabel-value');
      const label = size('.apexcharts-datalabel-label');
      expect(label.size).toBeGreaterThan(0);
      expect(value.size).toBeGreaterThan(label.size);
      expect(value.weight).toBe('700');
    };
    await waitFor(() => {
      expect(canvasElement.querySelector('.apexcharts-datalabel-label')?.textContent).toBe('Avg');
      expectValueOverLabel();
    });
    await waitFor(() => {
      canvasElement
        .querySelector('.apexcharts-radial-series path')
        ?.dispatchEvent(new MouseEvent('mouseenter'));
      expect(canvasElement.querySelector('.apexcharts-datalabel-label')?.textContent).toBe('CPU');
      expectValueOverLabel();
    });
  },
};

/** `formatValue` formats the average and the value of the hovered ring. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    const value = () => canvasElement.querySelector('.apexcharts-datalabel-value')?.textContent;
    // The average of 92, 78, 64 and 85, rounded.
    await waitFor(() => expect(value()).toBe('80 pts'));
    await waitFor(() => {
      canvasElement
        .querySelector('.apexcharts-radial-series path')
        ?.dispatchEvent(new MouseEvent('mouseenter'));
      expect(value()).toBe('92 pts');
    });
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
    await expectPaletteFromTheme(() =>
      [...canvasElement.querySelectorAll('.apexcharts-radialbar-area[j]')].map((el) =>
        el.getAttribute('stroke')
      )
    );
  },
};

/** The empty part of every radial arc is the theme's grid gray. */
export const TrackFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="radialbar">
        <RadialBarChart series={[40, 60]} labels={['CPU', 'RAM']} />
      </div>
      <div data-testid="gradient">
        <GradientRadial value={84} label="Health" />
      </div>
      <div data-testid="semicircle">
        <SemiCircleGauge value={42} label="CPU" />
      </div>
      <div data-testid="stroked">
        <StrokedGauge value={92} label="Uptime" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const track = (id: string) => () =>
      canvasElement
        .querySelector(`[data-testid="${id}"] .apexcharts-radialbar-track path`)
        ?.getAttribute('stroke');
    for (const id of ['radialbar', 'gradient', 'semicircle', 'stroked']) {
      await expectColorInThemes(track(id), {
        dark: '--color-gray-800',
        '': '--color-gray-200',
        sand: '--color-gray-200',
        'deep-blue': '--color-gray-800',
      });
    }
  },
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { colors: RING_COLORS, formatValue: points },
  render: (args) => (
    <Rerender>
      {(grown) => <RadialBarChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/**
 * Screen readers read `ariaLabel` as the chart's name; Tab reaches the chart and
 * ↓ walks its rings, one per series.
 */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ariaLabel: 'Node usage' },
  play: expectAccessibleChart({ keyboard: true, next: '{ArrowDown}' }),
};
