import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect, waitFor } from 'storybook/test';
import { TRACK } from './core/colors';
import { GradientRadial } from './GradientRadial';
import { RadialBarChart } from './RadialBarChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';
import {
  centerText,
  expectColorInThemes,
  resolveColor,
  surface,
  switchTheme,
  themeColor,
} from './storybook-recharts';

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

/**
 * `warnAt` and `critAt` color the arc by status, in the units of the value:
 * the theme's success color below `warnAt`, amber from it, red from `critAt`.
 * Without them the arc keeps one color, so a gauge where higher is better does
 * not turn red; `color` replaces either.
 */
export const SemiCircleStatusColors: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="web-01">
        <SemiCircleGauge value={42} label="CPU" warnAt={70} critAt={90} />
      </Card>
      <Card title="web-02">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} />
      </Card>
      <Card title="db-01">
        <SemiCircleGauge value={94} label="CPU" warnAt={70} critAt={90} />
      </Card>
    </div>
  ),
};

/** `warnAt` and `critAt` are in the units of the value: here, a temperature that is fine to 60 °C. */
export const SemiCircleCustomThresholds: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      {[48, 66, 83].map((temperature) => (
        <Card key={temperature} title={`GPU ${temperature} °C`}>
          <SemiCircleGauge
            value={temperature}
            label="Core"
            warnAt={60}
            critAt={80}
            formatValue={celsius}
          />
        </Card>
      ))}
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

/**
 * `target` marks a goal on the arc, on the same scale as the value: here 80%
 * of a load that is at 67%. The target is read after the value in the name of
 * the gauge.
 */
export const SemiCircleTarget: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Load">
        <SemiCircleGauge value={67} label="Load" target={80} />
      </Card>
      <Card title="Power draw">
        <SemiCircleGauge
          value={1450}
          max={2000}
          label="PDU 3"
          formatValue={watts}
          target={1800}
          showRange
        />
      </Card>
      <Card title="Inlet temperature">
        <SemiCircleGauge
          value={27}
          min={10}
          max={45}
          label="Rack A12"
          formatValue={celsius}
          target={22}
          warnAt={30}
          critAt={38}
          showRange
        />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-chart-target]')).toHaveLength(3)
    );
    const names = [...canvasElement.querySelectorAll('svg.recharts-surface')].map((svg) =>
      svg.getAttribute('aria-label')
    );
    await expect(names).toEqual([
      'Load: 67%, target 80%',
      'PDU 3: 1450 W, target 1800 W',
      'Rack A12: 27 °C, target 22 °C',
    ]);
  },
};

// The angle of the target mark, in degrees counted from the right end of the arc
// (0 on the right, 90 straight up, 180 on the left), from the direction of the line.
const targetAngle = (root: HTMLElement) => {
  const line = root.querySelector('[data-chart-target] line:last-child') as SVGLineElement;
  const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((a) => Number(line.getAttribute(a)));
  return (Math.atan2(y1 - y2, x2 - x1) * 180) / Math.PI;
};

/** The mark stands at the angle of its place in the range: 80% is 36° from the right end. */
export const SemiCircleTargetAngle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-case="percent" data-angle="36">
        <SemiCircleGauge value={67} target={80} />
      </div>
      <div data-case="range" data-angle="90">
        <SemiCircleGauge value={20} min={10} max={50} target={30} formatValue={celsius} />
      </div>
      <div data-case="third" data-angle="120">
        <SemiCircleGauge value={20} max={300} target={100} formatValue={watts} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-chart-target]')).toHaveLength(3)
    );
    for (const gauge of canvasElement.querySelectorAll<HTMLElement>('[data-angle]')) {
      await waitFor(() =>
        expect(targetAngle(gauge), gauge.dataset.case).toBeCloseTo(Number(gauge.dataset.angle), 0)
      );
    }
  },
};

/** A target out of the range stops at an end of the arc, as the arc of a value does. */
export const SemiCircleTargetOutOfRange: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-case="above" data-angle="0">
        <SemiCircleGauge value={50} max={2000} target={2600} formatValue={watts} />
      </div>
      <div data-case="below" data-angle="180">
        <SemiCircleGauge value={700} min={500} max={2000} target={120} formatValue={watts} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-chart-target]')).toHaveLength(2)
    );
    for (const gauge of canvasElement.querySelectorAll<HTMLElement>('[data-angle]')) {
      await waitFor(() =>
        expect(targetAngle(gauge), gauge.dataset.case).toBeCloseTo(Number(gauge.dataset.angle), 0)
      );
    }
    // The name still gives the target as it is.
    await expect(
      surface(canvasElement.querySelector('[data-case="above"]') as HTMLElement)
    ).toHaveAttribute('aria-label', 'Gauge: 50 W, target 2600 W');
  },
};

/** The target is part of the name of the gauge, after the value; `ariaLabel` still replaces the label. */
export const SemiCircleTargetJoinsTheName: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SemiCircleGauge value={67} label="Load" ariaLabel="Cluster load" target={80} />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(surface(canvasElement)).toHaveAttribute('aria-label', 'Cluster load: 67%, target 80%')
    );
    await expect(surface(canvasElement)).toHaveAttribute('role', 'img');
  },
};

/** Without `target`, nothing is drawn on the arc and the name is as before. */
export const SemiCircleHasNoTargetByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SemiCircleGauge value={67} label="Load" />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(surface(canvasElement)).toHaveAttribute('aria-label', 'Load: 67%'));
    await expect(canvasElement.querySelector('[data-chart-target]')).toBeNull();
  },
};

/** The mark is in the text color of the theme, over a halo in the card's color, in each of the four themes. */
export const SemiCircleTargetFollowsTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SemiCircleGauge value={67} label="Load" target={80} />,
  play: async ({ canvasElement }) => {
    const mark = () =>
      canvasElement.querySelector('[data-chart-target] line:last-child') as SVGLineElement | null;
    await waitFor(() => expect(mark()).not.toBeNull());
    await expectColorInThemes(() => mark() && getComputedStyle(mark() as Element).stroke, {
      '': '--color-text-primary',
      sand: '--color-text-primary',
      dark: '--color-text-primary',
      'deep-blue': '--color-text-primary',
    });
  },
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

// The tests below run on each gauge.
type GaugeProps = {
  value: number;
  label?: string;
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
};
type GaugeComponent = ComponentType<GaugeProps>;

const GAUGES: Record<string, GaugeComponent> = { GradientRadial, SemiCircleGauge, StrokedGauge };

const GaugeGrid = ({
  children,
}: {
  children: (name: string, Gauge: GaugeComponent) => React.ReactNode;
}) => (
  <div className="grid gap-4 md:grid-cols-3">
    {Object.entries(GAUGES).map(([name, Gauge]) => (
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
    for (const name of Object.keys(GAUGES)) {
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
    for (const name of Object.keys(GAUGES)) {
      await waitFor(() => expect(trackOf(gauge(canvasElement, name))).not.toBeNull());
      for (const theme of ['dark', '', 'sand', 'deep-blue']) {
        const restore = switchTheme(theme);
        try {
          const track = trackOf(gauge(canvasElement, name)) as Element;
          const style = getComputedStyle(track);
          // A sector is filled; the dashed track is stroked.
          await expect(style.fill === 'none' ? style.stroke : style.fill).toBe(expected());
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

const rangeLabels = (root: Element) =>
  [...root.querySelectorAll('[data-chart-range]')].map((el) => el.textContent);

/** With `warnAt` and `critAt` the arc is green, then amber and red, in the theme's status colors. */
export const SemiCircleStatusColorsComeFromTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: SemiCircleStatusColors.render,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const arcs = [...canvasElement.querySelectorAll('.recharts-radial-bar-sector')].map((el) =>
        resolveColor(getComputedStyle(el).fill)
      );
      expect(arcs).toEqual([
        themeColor('--color-success-500'),
        themeColor('--color-status-warn'),
        themeColor('--color-status-crit'),
      ]);
    });
  },
};

/** The arc keeps the accent without thresholds; either threshold switches to status colors, and `color` replaces them. */
export const SemiCircleThresholdProps: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <SemiCircleGauge value={95} />
      <SemiCircleGauge value={95} critAt={90} />
      <SemiCircleGauge value={55} warnAt={50} critAt={80} />
      <SemiCircleGauge value={85} warnAt={50} critAt={80} />
      <SemiCircleGauge value={30} warnAt={20} critAt={90} />
      <SemiCircleGauge value={95} color="#8b5cf6" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const arcs = [...canvasElement.querySelectorAll('.recharts-radial-bar-sector')].map((el) =>
        resolveColor(getComputedStyle(el).fill)
      );
      expect(arcs).toEqual([
        themeColor('--color-brand-500'),
        themeColor('--color-status-crit'),
        themeColor('--color-status-warn'),
        themeColor('--color-status-crit'),
        themeColor('--color-status-warn'),
        resolveColor('#8b5cf6'),
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
    const root = canvasElement.querySelector('[data-testid="gauge"]') as HTMLElement;
    await waitFor(() => {
      const box = (root.firstElementChild as Element).getBoundingClientRect();
      const track = trackOf(root)?.getBoundingClientRect();
      const [value, label] = [...root.querySelectorAll('[data-chart-center] tspan')].map((el) =>
        el.getBoundingClientRect()
      );
      const ends = [...root.querySelectorAll('[data-chart-range]')].map((el) =>
        el.getBoundingClientRect()
      );
      expect(track && value && label && ends.length === 2).toBeTruthy();
      if (!track || !value || !label) return;
      // The arc starts at the top of the box, and its base is the middle of the text's row.
      expect(Math.abs(track.top - box.top)).toBeLessThanOrEqual(2);
      expect(track.width).toBeLessThanOrEqual(box.width);
      // The value is in the hollow, above its label, which is above the base.
      expect(value.top).toBeGreaterThan(track.top + 20);
      expect(value.bottom).toBeLessThanOrEqual(label.top + 4);
      expect(label.bottom).toBeLessThanOrEqual(track.bottom);
      // The range labels sit under the two ends and fit in the box.
      for (const end of ends) {
        expect(end.top).toBeGreaterThanOrEqual(track.bottom - 8);
        expect(end.left).toBeGreaterThanOrEqual(box.left - 1);
        expect(end.right).toBeLessThanOrEqual(box.right + 1);
      }
      expect(box.bottom - track.bottom).toBeLessThanOrEqual(24);
    });
    await expect(rangeLabels(root)).toEqual(['0 W', '2000 W']);
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
      canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
    await waitFor(() => expect(centerText(root('plain'))?.label).toBe('Load'));
    await expect(rangeLabels(root('plain'))).toEqual([]);
    await waitFor(() => expect(rangeLabels(root('ranged'))).toEqual(['10 °C', '45 °C']));
  },
};

/** The gauge is as wide as its box allows, up to `height`: a narrow box gets a shorter gauge. */
export const SemiCircleHeightIsTheMost: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-start gap-4">
      <div className="w-32" data-testid="narrow">
        <SemiCircleGauge value={50} height={200} />
      </div>
      <div className="w-96" data-testid="wide">
        <SemiCircleGauge value={50} height={120} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const height = (id: string) =>
      (
        canvasElement.querySelector(`[data-testid="${id}"] svg.recharts-surface`) as Element
      ).getBoundingClientRect().height;
    await waitFor(() => {
      // A narrow box: half its width, plus the margin. A wide one: the `height`.
      expect(height('narrow')).toBeLessThan(80);
      expect(height('wide')).toBeLessThanOrEqual(120);
      expect(height('wide')).toBeGreaterThan(100);
    });
  },
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

// The shape of the value arc, which only its angle changes: its path, rounded
// so float noise between two scales doesn't show; `none` for an empty arc,
// which is not drawn.
const arcAngle = (el: HTMLElement) =>
  el
    .querySelector('.recharts-radial-bar-sector')
    ?.getAttribute('d')
    ?.replace(/-?\d+\.?\d*/g, (n) => Number(n).toFixed(1)) ?? 'none';

const centerValue = (el: HTMLElement) => centerText(el)?.value;

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

/** `color` colors the arc of the semicircle and of the stroked gauge; the gradient starts from it. */
export const ColorSetsTheArc: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="semicircle">
        <SemiCircleGauge value={78} label="CPU" color="#f59e0b" />
      </div>
      <div data-testid="stroked">
        <StrokedGauge value={94} label="Disk" color="#ef4444" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const arc = (id: string) =>
      arcOf(canvasElement.querySelector(`[data-testid="${id}"]`) as Element);
    await waitFor(() => {
      expect(resolveColor(getComputedStyle(arc('semicircle') as Element).fill)).toBe(
        resolveColor('#f59e0b')
      );
      expect(resolveColor(getComputedStyle(arc('stroked') as Element).stroke)).toBe(
        resolveColor('#ef4444')
      );
    });
  },
};

/** `StrokedGauge` splits the ring into round dashes, the arc lighting those of the track. */
export const StrokedArcIsDashed: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <StrokedGauge value={50} label="Uptime" />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      for (const path of [arcOf(canvasElement), trackOf(canvasElement)]) {
        expect(path).not.toBeNull();
        const style = getComputedStyle(path as Element);
        expect(style.strokeLinecap).toBe('round');
        expect(style.strokeDasharray).not.toBe('none');
      }
      // The arc and the track dash alike, so the dashes of the arc sit on the track's.
      expect(getComputedStyle(arcOf(canvasElement) as Element).strokeDasharray).toBe(
        getComputedStyle(trackOf(canvasElement) as Element).strokeDasharray
      );
    });
  },
};

/** An empty stroked gauge draws its track and no arc, not a stray cap. */
export const StrokedEmptyArcDrawsNothing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <StrokedGauge value={0} label="Uptime" />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(trackOf(canvasElement)).not.toBeNull());
    await expect(arcOf(canvasElement)).toBeNull();
  },
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
      <div data-label="Cluster load" data-value="67%">
        <SemiCircleGauge value={67} label="Load" ariaLabel="Cluster load" />
      </div>
      <div data-label="Monthly uptime" data-value="92%">
        <StrokedGauge value={92} label="Uptime" ariaLabel="Monthly uptime" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const gauge of canvasElement.querySelectorAll<HTMLElement>('[data-label]')) {
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
