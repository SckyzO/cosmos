import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { GradientRadial } from './GradientRadial';
import { RadialBarChart } from './RadialBarChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';
import {
  expectTextFollowsTheme,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
} from './storybook-helpers';

const RING_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const points = (v: number) => `${v} pts`;
const celsius = (v: number) => `${v} °C`;
const watts = (v: number) => `${v} W`;
const apdex = (v: number) => v.toFixed(2);
const POWER = { value: 1450, max: 2000, label: 'PDU 3', formatValue: watts };

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
      {title}
    </p>
    {children}
  </div>
);

const meta = {
  title: 'Charts/Radial & Gauges',
  component: RadialBarChart,
  subcomponents: { GradientRadial, SemiCircleGauge, StrokedGauge },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when `component` is set and the props have
  // required fields. The gauge stories render their own component and ignore
  // them.
  args: { series: [78, 62, 88, 41], labels: ['CPU', 'Mem', 'Disk', 'Net'] },
} satisfies Meta<typeof RadialBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** The four radial wrappers side by side. */
export const Overview: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card title="RadialBarChart">
        <RadialBarChart series={[78, 62, 88, 41]} labels={['CPU', 'Mem', 'Disk', 'Net']} />
      </Card>
      <Card title="GradientRadial">
        <GradientRadial value={84} label="Health" />
      </Card>
      <Card title="SemiCircleGauge">
        <SemiCircleGauge value={67} label="Load" />
      </Card>
      <Card title="StrokedGauge">
        <StrokedGauge value={92} label="Uptime" />
      </Card>
    </div>
  ),
};

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

/** `GradientRadial` fades from the accent to green along the arc. */
export const Gradient: Story = {
  render: () => (
    <Card title="Cluster health">
      <GradientRadial value={84} label="Health" />
    </Card>
  ),
};

/** `SemiCircleGauge` draws a half circle, in the accent by default. */
export const SemiCircle: Story = {
  render: () => (
    <Card title="Load average">
      <SemiCircleGauge value={67} label="Load" />
    </Card>
  ),
};

/** `color` maps a gauge to a status. */
export const SemiCircleStatusColors: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="web-01">
        <SemiCircleGauge value={42} label="CPU" color="#10b981" />
      </Card>
      <Card title="web-02">
        <SemiCircleGauge value={78} label="CPU" color="#f59e0b" />
      </Card>
      <Card title="db-01">
        <SemiCircleGauge value={94} label="CPU" color="#ef4444" />
      </Card>
    </div>
  ),
};

/** `StrokedGauge` splits the arc into dashes with round caps. */
export const Stroked: Story = {
  render: () => (
    <Card title="Monthly uptime">
      <StrokedGauge value={92} label="Uptime" />
    </Card>
  ),
};

/**
 * `min` and `max` set the range of a gauge (default 0–100), and `formatValue`
 * its center value (default `67%`). A value outside the range stops the arc at
 * that end; the center still shows it.
 */
export const CustomRange: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Inlet temperature">
        <SemiCircleGauge value={27} min={10} max={45} label="Rack A12" formatValue={celsius} />
      </Card>
      <Card title="Power draw">
        <StrokedGauge value={1450} max={2000} label="PDU 3" formatValue={watts} />
      </Card>
      <Card title="Apdex">
        <GradientRadial value={0.87} max={1} label="checkout" formatValue={apdex} />
      </Card>
    </div>
  ),
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

// A CSS color as a canvas normalizes it, so '#fff' and 'rgb(255, 255, 255)' compare equal.
const normalizeColor = (color: string) => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = '#000';
  context.fillStyle = color;
  return context.fillStyle;
};

const themeMutedText = () =>
  normalizeColor(
    getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
  );

const expectNameLabelsMuted = (root: HTMLElement) => {
  const labels = [...root.querySelectorAll('.apexcharts-datalabel-label')];
  expect(labels.length).toBe(3);
  for (const label of labels) {
    expect(normalizeColor(label.getAttribute('fill') ?? '')).toBe(themeMutedText());
  }
};

/**
 * The series name under the center value uses the theme's muted text color,
 * not the series color (brand-500 text fails contrast), in light and dark themes.
 */
export const NameLabelsUseMutedText: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <GradientRadial value={84} label="Health" />
      <SemiCircleGauge value={67} label="Load" />
      <StrokedGauge value={92} label="Uptime" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expectNameLabelsMuted(canvasElement));
    const { classList } = document.documentElement;
    const previous = [...classList];
    classList.remove(...previous);
    classList.add('dark');
    try {
      await waitFor(() => expectNameLabelsMuted(canvasElement));
    } finally {
      classList.remove(...classList);
      classList.add(...previous);
    }
  },
};

/** Each ring takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    // The ring colors without their opacity: ApexCharts draws them at 0.85.
    const strokes = () =>
      [...canvasElement.querySelectorAll('.apexcharts-radial-series path')].map((el) =>
        normalizeColor(
          (el.getAttribute('stroke') ?? '').replace(/^rgba\((.*),\s*[\d.]+\)$/, 'rgb($1)')
        )
      );
    await waitFor(() => expect(strokes()).toEqual(RING_COLORS));
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

/** `GradientRadial` draws its empty arc in the same track color as the other radial wrappers. */
export const GradientTrackMatchesOtherWrappers: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="reference">
        <StrokedGauge value={92} label="Uptime" />
      </div>
      <div data-testid="gradient">
        <GradientRadial value={84} label="Health" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trackColor = (id: string) =>
      canvasElement
        .querySelector(`[data-testid="${id}"] .apexcharts-radialbar-track path`)
        ?.getAttribute('stroke');
    await waitFor(() => expect(trackColor('reference')).toBeTruthy());
    await waitFor(() => expect(trackColor('gradient')).toBe(trackColor('reference')));
  },
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Overview.args, colors: RING_COLORS, formatValue: points },
  render: (args) => (
    <Rerender>
      {(grown) => <RadialBarChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** The gauges with a range and a formatter: equal props on a parent render do not redraw them. */
export const GaugesRerenderWithEqualPropsDoNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Rerender>
      {(grown) => (
        <div className="grid gap-4 md:grid-cols-3">
          <GradientRadial {...freshCopy(POWER)} height={grown ? 360 : 280} />
          <SemiCircleGauge {...freshCopy(POWER)} height={grown ? 260 : 200} />
          <StrokedGauge {...freshCopy(POWER)} height={grown ? 360 : 280} />
        </div>
      )}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

const GAUGES = { GradientRadial, SemiCircleGauge, StrokedGauge };

type GaugeProps = {
  value: number;
  label?: string;
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
};

/**
 * Each gauge twice: with `props`, and at `reference` on the default range,
 * in elements found by `gaugeIn(root, id, name, 'props' | 'reference')`.
 */
const GaugePairs = ({
  id,
  props,
  reference,
}: {
  id: string;
  props: GaugeProps;
  reference: number;
}) => (
  <div className="grid gap-4 md:grid-cols-3">
    {Object.entries(GAUGES).map(([name, Gauge]) => (
      <div key={name}>
        <div data-gauge={`${id}-${name}-props`}>
          <Gauge {...props} />
        </div>
        <div data-gauge={`${id}-${name}-reference`}>
          <Gauge value={reference} />
        </div>
      </div>
    ))}
  </div>
);

const gaugeIn = (root: HTMLElement, id: string, name: string, which: 'props' | 'reference') =>
  root.querySelector<HTMLElement>(`[data-gauge="${id}-${name}-${which}"]`)!;

// The angle ApexCharts computed for the value arc, set before the arc animates in.
const arcAngle = (el: HTMLElement) =>
  el.querySelector('.apexcharts-radial-series path')?.getAttribute('data:angle');

const centerValue = (el: HTMLElement) =>
  el.querySelector('.apexcharts-datalabel-value')?.textContent;

/** Asserts each gauge of a `GaugePairs` draws the arc of its reference and shows `label`. */
const expectSameArcs = async (
  root: HTMLElement,
  id: string,
  label: string,
  referenceLabel: string
) => {
  for (const name of Object.keys(GAUGES)) {
    const gauge = gaugeIn(root, id, name, 'props');
    const reference = gaugeIn(root, id, name, 'reference');
    await waitFor(() => {
      expect(arcAngle(reference)).toBeTruthy();
      expect(arcAngle(gauge)).toBe(arcAngle(reference));
      expect(centerValue(gauge)).toBe(label);
      expect(centerValue(reference)).toBe(referenceLabel);
    });
  }
};

/**
 * `min` and `max` scale the arc: 60 on 20–180 draws the arc of 25 on 0–100,
 * and the center shows `formatValue(60)`. Without them the center is a percent.
 */
export const GaugeRangeScalesTheArc: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <GaugePairs
      id="scaled"
      props={{ value: 60, min: 20, max: 180, formatValue: watts }}
      reference={25}
    />
  ),
  play: async ({ canvasElement }) => {
    await expectSameArcs(canvasElement, 'scaled', '60 W', '25%');
  },
};

/** A value above `max` draws the full arc, one below `min` none; the center shows the value. */
export const GaugeClampsOutOfRangeValues: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <GaugePairs id="above" props={{ ...POWER, value: 2600 }} reference={100} />
      <GaugePairs id="below" props={{ ...POWER, min: 500, value: 120 }} reference={0} />
    </>
  ),
  play: async ({ canvasElement }) => {
    await expectSameArcs(canvasElement, 'above', '2600 W', '100%');
    await expectSameArcs(canvasElement, 'below', '120 W', '0%');
  },
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

/** A gauge shows one value: screen readers read `ariaLabel`, and it stays out of the tab order. */
export const GaugesAreNamedImages: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-label="Health score">
        <GradientRadial value={84} label="Health" ariaLabel="Health score" />
      </div>
      <div data-label="Cluster load">
        <SemiCircleGauge value={67} label="Load" ariaLabel="Cluster load" />
      </div>
      <div data-label="Monthly uptime">
        <StrokedGauge value={92} label="Uptime" ariaLabel="Monthly uptime" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const gauge of canvasElement.querySelectorAll<HTMLElement>('[data-label]')) {
      await expectAccessibleChart({ keyboard: false })({
        canvasElement: gauge,
        args: { ariaLabel: gauge.dataset.label },
      });
    }
  },
};
