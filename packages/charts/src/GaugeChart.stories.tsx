import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect, waitFor } from 'storybook/test';
import { TRACK } from './core/colors';
import { GradientRadial } from './GradientRadial';
import { RadialBarChart } from './RadialBarChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';
import {
  alphaOf,
  centerText,
  expectColorInThemes,
  NarrowBox,
  opaqueColor,
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
};

export const SemiCircleTargetChecks: Story = {
  ...SemiCircleTarget,
  tags: ['!dev', '!autodocs'],
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

/**
 * `showNeedle` makes the gauge a dial: no arc for the value, a needle on a hub at the center of
 * the half circle pointing at it on the scale of `min`–`max`, and the value and its label under
 * the hub, where the needle never crosses them. The track is the plain one, or the zones with
 * `showZones`.
 */
export const SemiCircleNeedle: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Load">
        <SemiCircleGauge value={34} label="Load" showNeedle />
      </Card>
      <Card title="Power draw">
        <SemiCircleGauge
          value={1450}
          max={2000}
          label="PDU 3"
          formatValue={watts}
          showNeedle
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
          showNeedle
          target={22}
        />
      </Card>
    </div>
  ),
};

// The needle of the gauge in `root`: where it points, in degrees counted from the right end of
// the arc (0 on the right, 90 straight up, 180 on the left), read from its tip, the corner
// farthest from the hub; and the hub it pivots on.
const readNeedle = (root: Element) => {
  const needle = root.querySelector('[data-chart-needle]') as Element;
  const hub = needle.querySelector('circle') as SVGCircleElement;
  const [cx, cy, r] = ['cx', 'cy', 'r'].map((name) => Number(hub.getAttribute(name)));
  const corners = (needle.querySelector('polygon')?.getAttribute('points') ?? '')
    .split(' ')
    .map((point) => point.split(',').map(Number));
  const [x, y] = corners.reduce((far, point) =>
    Math.hypot(point[0] - cx, point[1] - cy) > Math.hypot(far[0] - cx, far[1] - cy) ? point : far
  );
  return {
    // The arc opens upward: an angle below zero is the sign of a tip exactly on the base line.
    angle: Math.abs((Math.atan2(cy - y, x - cx) * 180) / Math.PI),
    hub: { cx, cy, r },
    tip: { x, y },
  };
};

// Asserts the dial of the gauge in `root` is built right: its hub is the center of the track,
// the needle's tip is on the track, and the value and its label are under the hub, clear of the
// needle and of the box's edges.
const expectDialClearOfTheText = (root: Element) => {
  const { hub, tip } = readNeedle(root);
  const track = trackOf(root) as SVGGeometryElement;
  const { x, y, width, height } = track.getBBox();
  expect(hub.cx, 'the hub is halfway across the track').toBeCloseTo(x + width / 2, 0);
  expect(hub.cy, 'the hub is on the base of the track').toBeCloseTo(y + height, 0);
  // A pixel up: a needle at an end of the arc points along the base line, the edge of the track.
  expect(track.isPointInFill(new DOMPoint(tip.x, tip.y - 1)), 'the tip is on the track').toBe(true);
  const needle = (root.querySelector('[data-chart-needle]') as Element).getBoundingClientRect();
  const svg = (surface(root as HTMLElement) as Element).getBoundingClientRect();
  const hubBox = (
    root.querySelector('[data-chart-needle] circle') as Element
  ).getBoundingClientRect();
  const texts = [...root.querySelectorAll('[data-chart-center] tspan')];
  expect(texts.length).toBeGreaterThan(0);
  for (const text of texts) {
    const box = text.getBoundingClientRect();
    const name = text.textContent ?? '';
    const apart =
      needle.right <= box.left ||
      box.right <= needle.left ||
      needle.bottom <= box.top ||
      box.bottom <= needle.top;
    expect(apart, `${name} is under the needle`).toBe(true);
    expect(box.top, `${name} is under the hub`).toBeGreaterThanOrEqual(hubBox.bottom);
    expect(box.bottom, `${name} is cut by the bottom of the gauge`).toBeLessThanOrEqual(
      svg.bottom + 1
    );
    expect(box.left, `${name} is cut by the left of the gauge`).toBeGreaterThanOrEqual(
      svg.left - 1
    );
    expect(box.right, `${name} is cut by the right of the gauge`).toBeLessThanOrEqual(
      svg.right + 1
    );
  }
};

export const SemiCircleNeedleChecks: Story = {
  ...SemiCircleNeedle,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-chart-needle]')).toHaveLength(3)
    );
    // 34% of the arc, 72.5% of 0-2000, 17 of 35 on 10-45.
    const angles = [118.8, 49.5, 92.57];
    const gauges = [...canvasElement.querySelectorAll('svg.recharts-surface')];
    for (const [i, expected] of angles.entries()) {
      await waitFor(() => expect(readNeedle(gauges[i]).angle).toBeCloseTo(expected, 0));
    }
  },
};

/** The needle points where the arc ends: at its start for a value below `min`, at its end past `max`. */
export const SemiCircleNeedleStopsAtTheEnds: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-case="above" data-angle="0">
        <SemiCircleGauge value={2600} max={2000} formatValue={watts} showNeedle />
      </div>
      <div data-case="below" data-angle="180">
        <SemiCircleGauge value={120} min={500} max={2000} formatValue={watts} showNeedle />
      </div>
      <div data-case="middle" data-angle="90">
        <SemiCircleGauge value={30} min={10} max={50} formatValue={celsius} showNeedle />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-chart-needle]')).toHaveLength(3)
    );
    for (const gauge of canvasElement.querySelectorAll<HTMLElement>('[data-angle]')) {
      await waitFor(() =>
        expect(readNeedle(gauge).angle, gauge.dataset.case).toBeCloseTo(
          Number(gauge.dataset.angle),
          0
        )
      );
    }
  },
};

const NEEDLE_VALUES = [0, 5, 25, 50, 75, 95, 100];

/**
 * The needle pivots on a hub at the center of the arc and reaches the track, and the value and
 * its label sit under the hub: whatever the value it points at, from one end of the arc to the
 * other, and whatever the width of the box, down to 160px with a long value and the range.
 */
export const SemiCircleNeedleIsClearOfTheText: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-4">
      {NEEDLE_VALUES.map((value) => (
        <div className="w-80" key={`wide-${value}`} data-testid="gauge">
          <SemiCircleGauge value={value} label="Load" showNeedle />
        </div>
      ))}
      {NEEDLE_VALUES.map((value) => (
        <div className="w-40" key={`narrow-${value}`} data-testid="gauge">
          <SemiCircleGauge
            value={value * 20}
            max={2000}
            label="PDU 3"
            formatValue={watts}
            showNeedle
            showRange
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gauges = [...canvasElement.querySelectorAll<HTMLElement>('[data-testid="gauge"]')];
    await waitFor(() =>
      expect(gauges.filter((root) => root.querySelector('[data-chart-needle]'))).toHaveLength(
        gauges.length
      )
    );
    for (const root of gauges) await waitFor(() => expectDialClearOfTheText(root));
  },
};

/** A dial has no arc for the value, only its track, and the same name as the gauge without the needle. */
export const SemiCircleNeedleDrawsNoArc: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-case="plain">
        <SemiCircleGauge value={67} label="Load" showNeedle />
      </div>
      <div data-case="zones">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} showZones showNeedle />
      </div>
      <div data-case="dial">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} target={80} showNeedle />
      </div>
      <div data-case="plain-name">
        <SemiCircleGauge value={67} label="Load" />
      </div>
      <div data-case="zones-name">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} showZones />
      </div>
      <div data-case="dial-name">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} target={80} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gauge = (name: string) => canvasElement.querySelector(`[data-case="${name}"]`) as Element;
    // The gauges without the needle have drawn their arcs, so the absence below means something.
    await waitFor(() => {
      for (const name of ['plain-name', 'zones-name', 'dial-name']) {
        expect(arcOf(gauge(name)), name).not.toBeNull();
      }
    });
    for (const name of ['plain', 'zones', 'dial']) {
      await waitFor(() => expect(gauge(name).querySelector('[data-chart-needle]')).not.toBeNull());
      await expect(arcOf(gauge(name)), `${name} has no arc`).toBeNull();
      await expect(trackOf(gauge(name)), `${name} has its track`).not.toBeNull();
      // The name is what it is without the needle.
      await expect(surface(gauge(name) as HTMLElement)?.getAttribute('aria-label')).toBe(
        surface(gauge(`${name}-name`) as HTMLElement)?.getAttribute('aria-label')
      );
    }
    // Zones with `showZones`, the plain track without it, whatever the thresholds.
    await expect(zonesOf(gauge('zones'))).toEqual(['ok', 'warn', 'crit']);
    await expect(zonesOf(gauge('dial'))).toEqual([]);
    // The target is drawn as it is without the needle.
    await expect(gauge('dial').querySelectorAll('[data-chart-target]')).toHaveLength(1);
  },
};

/**
 * A dial takes the height it is given: by default 180px, which makes room under the arc for the
 * value; `height` is still the most it takes, and the arc as wide as the box allows within it.
 */
export const SemiCircleNeedleFitsItsHeight: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-start gap-4">
      <div className="w-80" data-testid="default">
        <SemiCircleGauge value={67} label="Load" showNeedle />
      </div>
      <div className="w-80" data-testid="short">
        <SemiCircleGauge value={67} label="Load" showNeedle height={120} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const size = (id: string) => {
      const root = canvasElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;
      return {
        height: (surface(root) as Element).getBoundingClientRect().height,
        arc: (trackOf(root) as SVGGraphicsElement).getBBox().width,
      };
    };
    await waitFor(() => {
      expect(size('default').height).toBeLessThanOrEqual(180);
      expect(size('default').height).toBeGreaterThan(150);
      expect(size('short').height).toBeLessThanOrEqual(120);
      // The arc is as wide as the height allows: the default one is wider than the short one.
      expect(size('default').arc).toBeGreaterThan(size('short').arc);
      expect(size('default').arc).toBeGreaterThan(180);
    });
  },
};

/** The needle and its hub are in the text color of the theme, over a halo in the card's color, in each of the four themes. */
export const SemiCircleNeedleFollowsTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SemiCircleGauge value={67} label="Load" showNeedle />,
  play: async ({ canvasElement }) => {
    const part = (layer: 'shape' | 'halo', selector: string) =>
      canvasElement.querySelector(
        `[data-chart-needle] [data-${layer}] ${selector}`
      ) as SVGElement | null;
    await waitFor(() => expect(part('shape', 'polygon') && part('shape', 'circle')).not.toBeNull());
    const themes = ['', 'sand', 'dark', 'deep-blue'];
    const tokens = (token: string) => Object.fromEntries(themes.map((theme) => [theme, token]));
    for (const selector of ['polygon', 'circle']) {
      await expectColorInThemes(
        () => getComputedStyle(part('shape', selector) as Element).fill,
        tokens('--color-text-primary')
      );
      await expectColorInThemes(
        () => getComputedStyle(part('halo', selector) as Element).stroke,
        tokens('--color-bg-panel')
      );
    }
  },
};

/**
 * `showZones` draws the zones `warnAt` and `critAt` cut on the track, under the arc: the theme's
 * success color up to `warnAt`, the warning color to `critAt`, the critical color after it, in
 * lighter tints so the arc still reads. With one threshold it draws the zones on its two sides.
 */
export const SemiCircleZones: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="web-01">
        <SemiCircleGauge value={42} label="CPU" warnAt={70} critAt={90} showZones />
      </Card>
      <Card title="web-02">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} showZones />
      </Card>
      <Card title="db-01">
        <SemiCircleGauge value={94} label="CPU" warnAt={70} critAt={90} showZones />
      </Card>
    </div>
  ),
};

/** The zones and the needle together, with the scale, in the units of the value. */
export const SemiCircleZonesAndNeedle: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Inlet temperature">
        <SemiCircleGauge
          value={27}
          min={10}
          max={45}
          label="Rack A12"
          formatValue={celsius}
          warnAt={30}
          critAt={38}
          showZones
          showNeedle
          showRange
        />
      </Card>
      <Card title="Power draw">
        <SemiCircleGauge
          value={1450}
          max={2000}
          label="PDU 3"
          formatValue={watts}
          warnAt={1500}
          critAt={1800}
          target={1200}
          showZones
          showNeedle
          showRange
        />
      </Card>
      <Card title="Disk">
        <SemiCircleGauge value={91} label="Disk" critAt={85} showZones showNeedle />
      </Card>
    </div>
  ),
};

/** The same gauge in a box 375px wide, the width of a phone. */
export const SemiCircleZonesAndNeedleNarrow: Story = {
  render: () => (
    <NarrowBox>
      <SemiCircleGauge
        value={1450}
        max={2000}
        label="PDU 3"
        formatValue={watts}
        warnAt={1500}
        critAt={1800}
        showZones
        showNeedle
        showRange
      />
    </NarrowBox>
  ),
};

const zonesOf = (root: Element) =>
  [...root.querySelectorAll('[data-chart-zones] [data-zone]')].map((el) =>
    el.getAttribute('data-zone')
  );

// The zone the point at `share` of the track, in the middle of its thickness, falls in.
const zoneAt = (gauge: Element, share: number) => {
  const { x, y, width, height } = (trackOf(gauge) as SVGGraphicsElement).getBBox();
  const radius = width / 2;
  const angle = Math.PI * (1 - share);
  // 3 px inside the outer edge: inside the track at any size (it is 8 px thick or more).
  const point = new DOMPoint(
    x + radius + (radius - 3) * Math.cos(angle),
    y + height - (radius - 3) * Math.sin(angle)
  );
  const zone = [...gauge.querySelectorAll<SVGPathElement>('[data-zone] path')].find((path) =>
    path.isPointInFill(point)
  );
  return zone?.parentElement?.getAttribute('data-zone');
};

export const SemiCircleZonesChecks: Story = {
  ...SemiCircleZones,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-chart-zones]')).toHaveLength(3)
    );
    for (const gauge of canvasElement.querySelectorAll('svg.recharts-surface')) {
      await expect(zonesOf(gauge)).toEqual(['ok', 'warn', 'crit']);
      // Success to 70% of the arc, warning to 90%, critical after it.
      await waitFor(() => {
        const at = (share: number) => zoneAt(gauge, share);
        expect([0.05, 0.69, 0.71, 0.89, 0.91, 0.95].map(at)).toEqual([
          'ok',
          'ok',
          'warn',
          'warn',
          'crit',
          'crit',
        ]);
      });
    }
  },
};

/** The zones sit on the track, under the arc, and are cut to the track's rounded ends. */
export const SemiCircleZonesSitOnTheTrack: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-80" data-testid="gauge">
      <SemiCircleGauge value={50} label="CPU" warnAt={70} critAt={90} showZones />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="gauge"]') as HTMLElement;
    await waitFor(() => {
      expect(root.querySelector('[data-chart-zones]')).not.toBeNull();
      expect(arcOf(root)).not.toBeNull();
    });
    const track = trackOf(root) as SVGGraphicsElement;
    const zones = root.querySelector('[data-chart-zones]') as Element;
    const arc = arcOf(root) as Element;
    // Over the track, under the arc.
    await expect(
      track.compareDocumentPosition(zones) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await expect(
      zones.compareDocumentPosition(arc) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    // The clip is the track's own shape: the zones end in the same rounded caps.
    const clipped = zones.querySelector('[clip-path]') as Element;
    const id = /url\(["']?#(.+?)["']?\)/.exec(clipped.getAttribute('clip-path') ?? '')?.[1];
    const clip = root.querySelector(`[id="${id}"] path`) as SVGGraphicsElement;
    const [a, b] = [track.getBBox(), clip.getBBox()];
    for (const edge of ['x', 'y', 'width', 'height'] as const) {
      await expect(b[edge], edge).toBeCloseTo(a[edge], 0);
    }
    // The zones themselves reach past both ends of the track, which the clip cuts to its caps.
    const covered = [...zones.querySelectorAll('[data-zone] path')].map((path) =>
      (path as SVGGraphicsElement).getBBox()
    );
    await expect(Math.min(...covered.map((box) => box.x))).toBeLessThanOrEqual(a.x);
    await expect(Math.max(...covered.map((box) => box.x + box.width))).toBeGreaterThanOrEqual(
      a.x + a.width
    );
  },
};

/** One threshold gives two zones; without any, `showZones` draws none. */
export const SemiCircleZonesFollowTheThresholds: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-case="crit">
        <SemiCircleGauge value={50} critAt={90} showZones />
      </div>
      <div data-case="warn">
        <SemiCircleGauge value={50} warnAt={60} showZones />
      </div>
      <div data-case="none">
        <SemiCircleGauge value={50} showZones />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gauge = (name: string) => canvasElement.querySelector(`[data-case="${name}"]`) as Element;
    await waitFor(() => expect(trackOf(gauge('none'))).not.toBeNull());
    await expect(zonesOf(gauge('crit'))).toEqual(['ok', 'crit']);
    await expect(zonesOf(gauge('warn'))).toEqual(['ok', 'warn']);
    await expect(zonesOf(gauge('none'))).toEqual([]);
    await expect(gauge('none').querySelector('[data-chart-zones]')).toBeNull();
  },
};

/** The zones are tints of the theme's status colors, translucent so the track shows through, in each theme. */
export const SemiCircleZonesFollowTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => <SemiCircleGauge value={50} label="CPU" warnAt={70} critAt={90} showZones />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(zonesOf(canvasElement)).toEqual(['ok', 'warn', 'crit']));
    const fills = () =>
      [...canvasElement.querySelectorAll('[data-zone] path')].map(
        (path) => getComputedStyle(path).fill
      );
    for (const theme of ['dark', '', 'sand', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        await expect(fills().map(opaqueColor), theme || 'light').toEqual(
          ['--color-success-500', '--color-status-warn', '--color-status-crit'].map(themeColor)
        );
        for (const fill of fills()) {
          await expect(alphaOf(fill), theme || 'light').toBeGreaterThan(0);
          await expect(alphaOf(fill), theme || 'light').toBeLessThan(0.6);
        }
      } finally {
        restore();
      }
    }
  },
};

/**
 * The zones are in the name of the gauge, after the value and the target, so they are not
 * known by color alone; `ariaLabel` still replaces the label.
 */
export const SemiCircleZonesJoinTheName: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <div data-case="both">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} target={80} showZones />
      </div>
      <div data-case="crit">
        <SemiCircleGauge value={78} ariaLabel="Cluster load" critAt={90} showZones />
      </div>
      <div data-case="plain">
        <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const name = (id: string) =>
      surface(canvasElement.querySelector(`[data-case="${id}"]`) as HTMLElement);
    await waitFor(() =>
      expect(name('both')).toHaveAttribute(
        'aria-label',
        'CPU: 78%, target 80%, warning from 70%, critical from 90%'
      )
    );
    await expect(name('crit')).toHaveAttribute(
      'aria-label',
      'Cluster load: 78%, critical from 90%'
    );
    // Without `showZones` the name is what it was.
    await expect(name('plain')).toHaveAttribute('aria-label', 'CPU: 78%');
  },
};

/** A gauge draws no needle and no zones unless asked: its thresholds still color the arc. */
export const SemiCircleNeedleAndZonesAreOptIn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <SemiCircleGauge value={67} label="Load" />
      <SemiCircleGauge value={78} label="CPU" warnAt={70} critAt={90} />
      <SemiCircleGauge value={67} label="Load" target={80} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.recharts-radial-bar-sector')).toHaveLength(3)
    );
    await expect(canvasElement.querySelector('[data-chart-needle]')).toBeNull();
    await expect(canvasElement.querySelector('[data-chart-zones]')).toBeNull();
    // The value keeps the bare look.
    for (const text of canvasElement.querySelectorAll('[data-chart-center] tspan')) {
      await expect(getComputedStyle(text).stroke).toBe('none');
    }
  },
};

/** In a narrow box the dial, the zones and the range labels stay inside it, and the needle is clear of the text. */
export const SemiCircleNeedleAndZonesFitANarrowBox: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-40" data-testid="box">
      <SemiCircleGauge
        value={1450}
        max={2000}
        label="PDU 3"
        formatValue={watts}
        warnAt={1500}
        critAt={1800}
        showZones
        showNeedle
        showRange
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-testid="box"]') as HTMLElement;
    await waitFor(() => {
      expect(box.querySelector('[data-chart-needle]')).not.toBeNull();
      expect(box.querySelector('[data-chart-zones]')).not.toBeNull();
    });
    const limit = box.getBoundingClientRect();
    for (const part of box.querySelectorAll(
      '[data-chart-needle], [data-chart-zones], [data-chart-range]'
    )) {
      const rect = part.getBoundingClientRect();
      await expect(rect.left, part.getAttribute('data-chart-range') ?? '').toBeGreaterThanOrEqual(
        limit.left - 1
      );
      await expect(rect.right).toBeLessThanOrEqual(limit.right + 1);
    }
    // A box of 160 px makes a gauge of 80 px of radius: the value, long as it is, is still
    // under the hub and clear of the needle and of the range labels.
    await waitFor(() => expectDialClearOfTheText(box));
    const ends = [...box.querySelectorAll('[data-chart-range]')].map((el) =>
      el.getBoundingClientRect()
    );
    const value = (
      box.querySelector('[data-chart-center] tspan') as Element
    ).getBoundingClientRect();
    for (const end of ends) {
      await expect(
        end.bottom <= value.top || end.right <= value.left || value.right <= end.left
      ).toBe(true);
    }
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
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
