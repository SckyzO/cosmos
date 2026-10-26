import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { TRACK } from './core/colors';
import { GradientRadial } from './GradientRadial';
import { RadialBarChart } from './RadialBarChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';
import { useChartTheme } from './theme';
import {
  opaqueColor,
  resolveColor,
  switchTheme,
  themeColor,
  expectAccessibleChart,
} from './storybook-helpers';
import { centerText } from './storybook-polar';
import { surface } from './storybook-recharts';

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

// The gauges drawn with Recharts: the tests below run on each.
const RECHARTS_GAUGES = { GradientRadial };

const GaugeGrid = ({
  children,
}: {
  children: (name: string, Gauge: GaugeComponent) => React.ReactNode;
}) => (
  <div className="grid gap-4 md:grid-cols-3">
    {Object.entries(RECHARTS_GAUGES).map(([name, Gauge]) => (
      <div key={name} data-gauge={name}>
        {children(name, Gauge)}
      </div>
    ))}
  </div>
);

const gauge = (root: HTMLElement, name: string) =>
  root.querySelector(`[data-gauge="${name}"]`) as HTMLElement;
const arcOf = (root: Element) => root.querySelector('.recharts-radial-bar-sector');
const trackOf = (root: Element) => root.querySelector('.recharts-radial-bar-background-sector');

/** The center value is in the theme's text color, its label in the muted one, and both follow theme changes. */
export const TextFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'deep-blue' },
  render: () => <GaugeGrid>{(_, Gauge) => <Gauge value={84} label="Health" />}</GaugeGrid>,
  play: async ({ canvasElement }) => {
    const colors = (name: string) => {
      const [value, label] = [
        ...gauge(canvasElement, name).querySelectorAll('[data-chart-center] tspan'),
      ];
      return [value, label].map((el) => resolveColor(getComputedStyle(el).fill));
    };
    for (const name of Object.keys(RECHARTS_GAUGES)) {
      await waitFor(() => expect(centerText(gauge(canvasElement, name))?.value).toBe('84%'));
      for (const theme of ['deep-blue', '', 'sand', 'dark']) {
        const restore = switchTheme(theme);
        try {
          await expect(colors(name)).toEqual([
            themeColor('--color-text-primary'),
            themeColor('--color-text-muted'),
          ]);
        } finally {
          restore();
        }
      }
    }
  },
};

/** The empty part of every arc is the theme's track gray, in every theme. */
export const TrackFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => <GaugeGrid>{(_, Gauge) => <Gauge value={42} label="CPU" />}</GaugeGrid>,
  play: async ({ canvasElement }) => {
    // The track color, as the browser resolves it for an element.
    const expected = () => {
      const probe = document.createElement('span');
      probe.style.color = TRACK;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    for (const name of Object.keys(RECHARTS_GAUGES)) {
      await waitFor(() => expect(trackOf(gauge(canvasElement, name))).not.toBeNull());
      for (const theme of ['dark', '', 'sand', 'deep-blue']) {
        const restore = switchTheme(theme);
        try {
          const track = trackOf(gauge(canvasElement, name)) as Element;
          await expect(getComputedStyle(track).fill).toBe(expected());
        } finally {
          restore();
        }
      }
    }
  },
};

/** `GradientRadial` fades from the accent, or from `color`, to the theme's success color. */
export const GradientFadesToSuccess: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="default">
        <GradientRadial value={84} label="Health" />
      </div>
      <div data-testid="custom">
        <GradientRadial value={64} label="Health" color="#8b5cf6" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The arc is filled with a gradient: its first and last colors.
    const stops = (id: string) => {
      const root = canvasElement.querySelector(`[data-testid="${id}"]`) as Element;
      const ref = /url\(#(.+)\)/.exec(arcOf(root)?.getAttribute('fill') ?? '')?.[1];
      return [...root.querySelectorAll(`[id="${ref}"] stop`)].map((el) =>
        resolveColor(getComputedStyle(el).stopColor)
      );
    };
    await waitFor(() => {
      expect(stops('default')).toEqual([
        themeColor('--color-brand-500'),
        themeColor('--color-success-500'),
      ]);
      expect(stops('custom')).toEqual([resolveColor('#8b5cf6'), themeColor('--color-success-500')]);
    });
  },
};

const GAUGES = { GradientRadial, SemiCircleGauge, StrokedGauge };

type GaugeComponent = typeof GradientRadial;

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

// The shape of the value arc, which only its angle changes: a Recharts sector's
// path, rounded so float noise between two scales doesn't show; `none` for an
// empty arc, which Recharts doesn't draw.
const arcAngle = (el: HTMLElement) => {
  if (el.querySelector('.recharts-radial-bar-background-sector')) {
    return (
      el
        .querySelector('.recharts-radial-bar-sector')
        ?.getAttribute('d')
        ?.replace(/-?\d+\.?\d*/g, (n) => Number(n).toFixed(1)) ?? 'none'
    );
  }
  // The angle ApexCharts computed for the value arc, set before the arc animates in.
  return el.querySelector('.apexcharts-radial-series path')?.getAttribute('data:angle');
};

const centerValue = (el: HTMLElement) =>
  centerText(el)?.value ?? el.querySelector('.apexcharts-datalabel-value')?.textContent;

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
      <div data-label="Health score" data-value="84%">
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
      if (!surface(gauge)) {
        await expectAccessibleChart({ keyboard: false })({
          canvasElement: gauge,
          args: { ariaLabel: gauge.dataset.label },
        });
        continue;
      }
      // The name ends with the value: the text inside the image is hidden from screen readers.
      await waitFor(() =>
        expect(surface(gauge)).toHaveAttribute(
          'aria-label',
          `${gauge.dataset.label}: ${gauge.dataset.value}`
        )
      );
      await expect(surface(gauge)).toHaveAttribute('role', 'img');
      await expect(gauge.querySelector('[tabindex]:not([tabindex="-1"])')).toBeNull();
    }
  },
};
