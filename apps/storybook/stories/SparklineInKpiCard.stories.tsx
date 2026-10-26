import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditCard, Gauge, Server, Users } from 'lucide-react';
import { expect, waitFor } from 'storybook/test';
import { Sparkline } from '../../../packages/charts/src';
import { KpiCard, TrendDelta } from '../../../packages/react/src';

// The only place the two packages meet: `react` and `charts` do not depend on each other, so
// a consumer passes the chart to the card's `chart` slot. The story app compiles both from source.

const meta = {
  title: 'Charts/Sparkline in Kpi Cards',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const REQUESTS = [10, 22, 18, 25, 30, 28, 35, 31, 29, 36, 32, 40];
const ERRORS = [3, 5, 4, 8, 6, 9, 7, 11, 8, 12, 10, 14];
const LATENCY = [120, 130, 110, 150, 160, 170, 165, 184, 176, 168, 181, 179];
const USERS = [300, 320, 280, 340, 360, 350, 341, 355, 362, 358, 371, 380];

/** A grid of KPI cards, each with its sparkline: the chart takes the full width of the card. */
export const Grid: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Requests/s"
        value="2.3k"
        icon={Server}
        delta={<TrendDelta value={8.2} label="vs last hour" />}
        chart={<Sparkline data={REQUESTS} label="Requests/s" ariaLabel="Requests per second" />}
      />
      <KpiCard
        label="Errors/min"
        value="12"
        icon={Gauge}
        intent="danger"
        delta={<TrendDelta value={40} goodDirection="down" label="vs last hour" />}
        chart={
          <Sparkline
            data={ERRORS}
            color="#ef4444"
            label="Errors/min"
            ariaLabel="Errors per minute"
          />
        }
      />
      <KpiCard
        label="Latency p95"
        value="184 ms"
        icon={Gauge}
        intent="warning"
        delta={<TrendDelta value={-2.4} goodDirection="down" label="vs last hour" />}
        chart={
          <Sparkline
            data={LATENCY}
            variant="line"
            color="#f59e0b"
            label="Latency p95"
            formatValue={(v) => `${v} ms`}
            ariaLabel="Latency p95"
          />
        }
      />
      <KpiCard
        label="Active users"
        value="341"
        icon={Users}
        delta={<TrendDelta value={5.1} label="vs last hour" />}
        chart={<Sparkline data={USERS} label="Users" ariaLabel="Active users" />}
      />
    </div>
  ),
};

/** While `loading`, the card keeps its layout and the chart is replaced by a skeleton. */
export const Loading: Story = {
  render: () => (
    <div className="max-w-xs">
      <KpiCard
        label="Revenue"
        value="$48 920"
        icon={CreditCard}
        loading
        delta={<TrendDelta value={12.4} label="vs last month" />}
        chart={<Sparkline data={REQUESTS} ariaLabel="Revenue, last 12 days" />}
      />
    </div>
  ),
};

/** The sparkline fills the width of the card inside its padding. */
export const ChartFillsTheCard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-80">
      <KpiCard
        label="Requests/s"
        value="2.3k"
        chart={<Sparkline data={REQUESTS} ariaLabel="Requests per second" />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('.rounded-2xl')!;
    await waitFor(() => {
      const svg = card.querySelector('svg.recharts-surface')!;
      expect(svg).not.toBeNull();
      // 20px of padding on each side of the 320px card.
      expect(svg.getBoundingClientRect().width).toBeCloseTo(280, -1);
    });
  },
};
