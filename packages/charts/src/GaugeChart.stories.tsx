import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { GradientRadial } from './GradientRadial';
import { RadialBarChart } from './RadialBarChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';
import { useChartTheme } from './theme';
import {
  expectColorsFromTokens,
  opaqueColor,
  resolveColor,
  themeColor,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
} from './storybook-helpers';

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
  title: 'Charts/Gauges',
  component: SemiCircleGauge,
  subcomponents: { GradientRadial, StrokedGauge },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when `component` is set and the props have
  // required fields. The stories render their own gauges and ignore them.
  args: { value: 67, label: 'Load' },
} satisfies Meta<typeof SemiCircleGauge>;

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

// The recipe for threshold zones: the gauge takes one color, so the host picks
// it from the value with the theme's status colors.
const ThresholdGauge = ({ value }: { value: number }) => {
  const { success, statusWarn, statusCrit } = useChartTheme();
  const color = value >= 90 ? statusCrit : value >= 70 ? statusWarn : success;
  return <SemiCircleGauge value={value} label="CPU" color={color} />;
};

/**
 * Threshold zones are not a prop: `color` takes one color, picked from the
 * value. Here green under 70, amber from 70 and red from 90, read from the
 * theme as `useChartTheme()`'s `success`, `statusWarn` and `statusCrit`.
 */
export const SemiCircleStatusColors: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="web-01">
        <ThresholdGauge value={42} />
      </Card>
      <Card title="web-02">
        <ThresholdGauge value={78} />
      </Card>
      <Card title="db-01">
        <ThresholdGauge value={94} />
      </Card>
    </div>
  ),
};

/**
 * `color` is on every gauge: the arc of `StrokedGauge`, and the color
 * `GradientRadial` starts from before it fades to the theme's success color.
 */
export const GaugeColors: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="SemiCircleGauge">
        <SemiCircleGauge value={78} label="CPU" color="#f59e0b" />
      </Card>
      <Card title="StrokedGauge">
        <StrokedGauge value={94} label="Disk" color="#ef4444" />
      </Card>
      <Card title="GradientRadial">
        <GradientRadial value={64} label="Health" color="#8b5cf6" />
      </Card>
    </div>
  ),
};

/**
 * `showRange` writes `min` and `max`, formatted by `formatValue`, under the ends
 * of the arc of `SemiCircleGauge`. `height` is the most it takes: the arc is as
 * wide as its box allows, so a narrow card gets a shorter gauge.
 */
export const SemiCircleRange: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Power draw">
        <SemiCircleGauge value={1450} max={2000} label="PDU 3" formatValue={watts} showRange />
      </Card>
      <Card title="Inlet temperature">
        <SemiCircleGauge
          value={27}
          min={10}
          max={45}
          label="Rack A12"
          formatValue={celsius}
          showRange
        />
      </Card>
      <Card title="Load average">
        <SemiCircleGauge value={67} showRange />
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

const themeMutedText = () =>
  resolveColor(
    getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
  );

const expectNameLabelsMuted = (root: HTMLElement) => {
  const labels = [...root.querySelectorAll('.apexcharts-datalabel-label')];
  expect(labels.length).toBe(3);
  for (const label of labels) {
    expect(resolveColor(label.getAttribute('fill') ?? '')).toBe(themeMutedText());
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

/** The recipe colors each gauge from its value, with the theme's status colors. */
export const ThresholdColorsComeFromTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: SemiCircleStatusColors.render,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const strokes = [...canvasElement.querySelectorAll('.apexcharts-radialbar-area[j]')].map(
        (el) => opaqueColor(el.getAttribute('stroke') ?? '')
      );
      expect(strokes).toEqual([
        themeColor('--color-success-500'),
        themeColor('--color-status-warn'),
        themeColor('--color-status-crit'),
      ]);
    });
  },
};

/** `color` colors the arc of every gauge; the gradient starts from it. */
export const ColorSetsTheArc: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-testid="semicircle">
        <SemiCircleGauge value={78} label="CPU" color="#f59e0b" />
      </div>
      <div data-testid="stroked">
        <StrokedGauge value={94} label="Disk" color="#ef4444" />
      </div>
      <div data-testid="gradient">
        <GradientRadial value={64} label="Health" color="#8b5cf6" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const arc = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"] .apexcharts-radialbar-area[j]`);
    const stroke = (id: string) => () => arc(id)?.getAttribute('stroke');
    await waitFor(() => {
      expect(opaqueColor(stroke('semicircle')() ?? '')).toBe(resolveColor('#f59e0b'));
      expect(opaqueColor(stroke('stroked')() ?? '')).toBe(resolveColor('#ef4444'));
    });
    // The gradient: its first stop is the color, its last the theme's success.
    await waitFor(() => {
      const id = /url\(#(.+)\)/.exec(stroke('gradient')() ?? '')?.[1];
      const stops = [...canvasElement.querySelectorAll(`[id="${id}"] stop`)];
      expect(stops.length).toBeGreaterThan(1);
      expect(opaqueColor(stops[0].getAttribute('stop-color') ?? '')).toBe(resolveColor('#8b5cf6'));
    });
  },
};

/**
 * The value and the label sit inside the hollow of the arc, which takes the
 * box: no empty half under it. `showRange` labels sit under the arc's ends.
 */
export const SemiCircleFitsItsBox: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-80" data-testid="gauge">
      <SemiCircleGauge value={1450} max={2000} label="PDU 3" formatValue={watts} showRange />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gauge = canvasElement.querySelector('[data-testid="gauge"]')!;
    await waitFor(() => {
      const box = gauge.firstElementChild!.getBoundingClientRect();
      const track = gauge.querySelector('.apexcharts-radialbar-track path');
      const value = gauge.querySelector('.apexcharts-datalabel-value')?.getBoundingClientRect();
      const label = gauge.querySelector('.apexcharts-datalabel-label')?.getBoundingClientRect();
      expect(track && value && label).toBeTruthy();
      if (!track || !value || !label) return;
      const arc = track.getBoundingClientRect();
      const ring = parseFloat(track.getAttribute('stroke-width') ?? '0');
      // The arc's base, and the top of the inner edge of its ring.
      const base = arc.bottom;
      const hollowTop = arc.top + ring / 2;
      expect(value.top).toBeGreaterThan(hollowTop);
      expect(label.bottom).toBeLessThanOrEqual(base);
      expect(value.bottom).toBeLessThanOrEqual(label.top + 2);
      // The arc starts at the top of the box and the labels fit under it.
      expect(arc.top - ring / 2).toBeLessThanOrEqual(box.top + 2);
      expect(box.bottom - base).toBeLessThanOrEqual(24);
    });
    await expect(within(gauge as HTMLElement).getByText('0 W')).toBeVisible();
    await expect(within(gauge as HTMLElement).getByText('2000 W')).toBeVisible();
  },
};

/** The range labels are off by default, and follow `min`, `max` and `formatValue`. */
export const SemiCircleRangeIsOptIn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="plain">
        <SemiCircleGauge value={67} label="Load" />
      </div>
      <div data-testid="ranged">
        <SemiCircleGauge
          value={27}
          min={10}
          max={45}
          label="Rack A12"
          formatValue={celsius}
          showRange
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = (id: string) =>
      within(canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!);
    await waitFor(() => expect(root('plain').getByText('Load')).toBeVisible());
    await expect(root('plain').queryByText('0%')).toBeNull();
    await expect(root('plain').queryByText('100%')).toBeNull();
    await expect(root('ranged').getByText('10 °C')).toBeVisible();
    await expect(root('ranged').getByText('45 °C')).toBeVisible();
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

/** `GradientRadial` fades from the accent to the theme's success color. */
export const GradientFadesToSuccess: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GradientRadial value={84} label="Health" />,
  play: async ({ canvasElement }) => {
    // The arc is stroked with a gradient: its first and last colors.
    const stops = () => {
      const arc = canvasElement.querySelector('.apexcharts-radialbar-area[j]');
      const id = /url\(#(.+)\)/.exec(arc?.getAttribute('stroke') ?? '')?.[1];
      return [...canvasElement.querySelectorAll(`[id="${id}"] stop`)]
        .map((el) => el.getAttribute('stop-color'))
        .filter((_, index, all) => index === 0 || index === all.length - 1);
    };
    await expectColorsFromTokens(
      stops,
      ['--color-brand-500', '--color-success-500'],
      '--color-success-500'
    );
  },
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
