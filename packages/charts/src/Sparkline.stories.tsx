import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Sparkline } from './Sparkline';
import {
  HOSTILE,
  closeTooltip,
  expectNoInjectedImage,
  hover,
  Rerender,
  expectAccessibleChart,
  expectNoRedrawOnRerender,
  freshCopy,
  expectNoData,
} from './storybook-helpers';

const REQUESTS = [10, 22, 18, 25, 30, 28, 35, 31, 29, 36, 32, 40];
const SERVICES = [
  {
    name: 'api-gateway',
    rate: '2.3k req/s',
    trend: [1900, 1960, 2010, 2050, 2120, 2160, 2210, 2240, 2280, 2300],
  },
  {
    name: 'auth-service',
    rate: '840 req/s',
    trend: [790, 800, 805, 812, 818, 825, 829, 834, 838, 840],
  },
  {
    name: 'checkout-service',
    rate: '312 req/s',
    trend: [280, 290, 305, 330, 352, 340, 326, 318, 314, 312],
    color: '#f59e0b',
  },
  {
    name: 'payment-service',
    rate: '96 req/s',
    trend: [160, 152, 147, 139, 128, 117, 109, 102, 98, 96],
    color: '#ef4444',
  },
];

const FLAT = [60, 62, 61, 63, 62, 64, 63, 62];
const NODES = [
  { name: 'node-01', cpu: [58, 61, 60, 63, 62, 64, 63, 62] },
  { name: 'node-02', cpu: [12, 15, 11, 14, 13, 12, 16, 14] },
  { name: 'node-03', cpu: [30, 52, 71, 88, 64, 41, 77, 93] },
];
const ms = (v: number) => `${v} ms`;
const percent = (v: number) => `${v}%`;

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
      {title}
    </p>
    {children}
  </div>
);

const meta = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { data: REQUESTS },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** No axes, no grid: the shape of the trend, in the accent by default. */
export const Area: Story = {
  render: (args) => (
    <Card title="Requests/s">
      <Sparkline {...args} />
    </Card>
  ),
};

export const Line: Story = {
  args: { variant: 'line', data: [120, 130, 110, 150, 160, 170, 165, 184, 176, 168, 181, 179] },
  render: (args) => (
    <Card title="Latency p95">
      <Sparkline {...args} />
    </Card>
  ),
};

/** `color` overrides the accent, for a metric with a status. */
export const CustomColor: Story = {
  args: { color: '#ef4444', data: [3, 5, 4, 8, 6, 9, 7, 11, 8, 12, 10, 14] },
  render: (args) => (
    <Card title="Errors/min">
      <Sparkline {...args} />
    </Card>
  ),
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { data: [] },
  render: (args) => (
    <Card title="Requests/s">
      <Sparkline {...args} />
    </Card>
  ),
  play: expectNoData('No data'),
};

/** `width` and `height` shrink a line sparkline into a table cell. */
export const InTable: Story = {
  render: () => (
    <Card title="Traffic by service">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
            <th className="pb-2 font-medium">Service</th>
            <th className="pb-2 font-medium">Rate</th>
            <th className="pb-2 font-medium">Last 10 min</th>
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((s) => (
            <tr key={s.name} className="border-t border-gray-100 dark:border-gray-800">
              <td className="py-2 font-mono text-xs text-gray-900 dark:text-white">{s.name}</td>
              <td className="py-2 text-gray-700 dark:text-gray-300">{s.rate}</td>
              <td className="py-2">
                <Sparkline data={s.trend} color={s.color} variant="line" width={120} height={32} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  ),
};

/**
 * `label` names the value in the tooltip and `formatValue` formats it: hover the
 * line to read `Latency p95: 181 ms`.
 */
export const TooltipLabelAndFormat: Story = {
  args: {
    variant: 'line',
    data: [120, 130, 110, 150, 160, 170, 165, 184, 176, 168, 181, 179],
    label: 'Latency p95',
    formatValue: ms,
  },
  render: (args) => (
    <Card title="Latency p95">
      <Sparkline {...args} />
    </Card>
  ),
};

/**
 * A sparkline fits its own data: a node at 60–63% reads as steep as one that
 * swings from 5 to 95%. `min` and `max` give the rows of a table one scale, so
 * they read against each other.
 */
export const InTableSharedScale: Story = {
  render: () => (
    <Card title="CPU by node">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
            <th className="pb-2 font-medium">Node</th>
            <th className="pb-2 font-medium">Fits its data</th>
            <th className="pb-2 font-medium">0–100%</th>
          </tr>
        </thead>
        <tbody>
          {NODES.map((node) => (
            <tr key={node.name} className="border-t border-gray-100 dark:border-gray-800">
              <td className="py-2 font-mono text-xs text-gray-900 dark:text-white">{node.name}</td>
              <td className="py-2">
                <Sparkline data={node.cpu} variant="line" width={120} height={32} />
              </td>
              <td className="py-2">
                <Sparkline
                  data={node.cpu}
                  variant="line"
                  width={120}
                  height={32}
                  min={0}
                  max={100}
                  label="CPU"
                  formatValue={percent}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  ),
};

/** The tooltip names the value with `label` and writes it with `formatValue`. */
export const TooltipShowsLabelAndFormattedValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...TooltipLabelAndFormat.args },
  render: (args) => <Sparkline {...args} />,
  play: async ({ canvasElement }) => {
    const svg = () => canvasElement.querySelector('.apexcharts-svg');
    await waitFor(() => {
      hover(svg() as Element, 0.99);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
        'Latency p95: '
      );
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-value')?.textContent).toBe(
        '179 ms'
      );
    });
    await closeTooltip(canvasElement, svg);
  },
};

/** The tooltip is HTML: the label shows as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: HOSTILE, variant: 'line' },
  render: (args) => <Sparkline {...args} />,
  play: async ({ canvasElement }) => {
    const svg = () => canvasElement.querySelector('.apexcharts-svg');
    await waitFor(() => {
      hover(svg() as Element, 0.5);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
        `${HOSTILE}: `
      );
    });
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement, svg);
  },
};

// The vertical extent of the line, as a share of the height of the chart.
const lineSpread = (root: HTMLElement) => {
  const line = root.querySelector<SVGGraphicsElement>('.apexcharts-line');
  const svg = root.querySelector('.apexcharts-svg');
  return line && svg ? line.getBBox().height / svg.getBoundingClientRect().height : NaN;
};

/**
 * Without `min` and `max` a flat series fills the height of its chart; pinned
 * to 0–100, the same series is a flat line.
 */
export const ScaleCanBePinned: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="fit">
        <Sparkline data={FLAT} variant="line" height={80} />
      </div>
      <div data-testid="pinned">
        <Sparkline data={FLAT} variant="line" height={80} min={0} max={100} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const spread = (id: string) =>
      lineSpread(canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!);
    await waitFor(() => expect(spread('fit')).toBeGreaterThan(0.6));
    await waitFor(() => expect(spread('pinned')).toBeLessThan(0.15));
  },
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Area.args },
  render: (args) => (
    <Rerender>{(grown) => <Sparkline {...freshCopy(args)} height={grown ? 400 : 320} />}</Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** A sparkline is an image: screen readers read `ariaLabel`, and it stays out of the tab order. */
export const NamedImage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ariaLabel: 'Requests per second, last hour' },
  play: expectAccessibleChart({ keyboard: false }),
};
