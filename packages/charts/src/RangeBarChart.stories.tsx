import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { RangeBarChart } from './RangeBarChart';
import {
  HOSTILE,
  expectNoInjectedImage,
  hover,
  legendTexts,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
} from './storybook-helpers';

// Fixed dates (UTC, October 2026) keep the stories and their tests deterministic.
const at = (day: number, hour: number, minute = 0) => Date.UTC(2026, 9, day, hour, minute);

const CHANGES = [
  {
    name: 'Maintenance',
    data: [
      { x: 'api-gateway', y: [at(13, 2), at(13, 4)] },
      { x: 'search-service', y: [at(13, 22), at(14, 0, 30)] },
      { x: 'payment-service', y: [at(14, 1), at(14, 3, 30)] },
    ],
  },
  {
    name: 'Deploy',
    data: [
      { x: 'api-gateway', y: [at(13, 10), at(13, 10, 40)] },
      { x: 'auth-service', y: [at(13, 14), at(13, 14, 30)] },
      { x: 'payment-service', y: [at(13, 16), at(13, 16, 25)] },
      { x: 'checkout-service', y: [at(14, 11), at(14, 11, 45)] },
      { x: 'search-service', y: [at(14, 15), at(14, 15, 30)] },
    ],
  },
  {
    name: 'Incident',
    data: [
      { x: 'auth-service', y: [at(13, 19, 10), at(13, 20)] },
      { x: 'api-gateway', y: [at(14, 8), at(14, 8, 50)] },
      { x: 'checkout-service', y: [at(14, 11, 20), at(14, 13, 5)] },
    ],
  },
] satisfies { name: string; data: { x: string; y: [number, number] }[] }[];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Range Bar',
  component: RangeBarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof RangeBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** One series: a week of planned maintenance windows per rack. No legend. */
export const MaintenanceWindows: Story = {
  args: {
    height: 280,
    series: [
      {
        name: 'Maintenance',
        data: [
          { x: 'PAR1 rack A12', y: [at(12, 22), at(13, 2)] },
          { x: 'PAR1 rack A12', y: [at(16, 21), at(17, 1)] },
          { x: 'PAR1 rack B03', y: [at(14, 1), at(14, 5)] },
          { x: 'FRA2 rack C07', y: [at(13, 20), at(14, 2)] },
          { x: 'LON1 rack D01', y: [at(15, 0), at(15, 3)] },
          { x: 'TYO1 rack E09', y: [at(17, 14), at(17, 20)] },
        ],
      },
    ],
  },
};

/**
 * Two days of changes per service, one series per kind. Each series gets its
 * own lane in the row, so an incident never hides the deploy under it.
 */
export const ChangeTimeline: Story = {
  args: { series: CHANGES },
};

/** `groupRows` draws every series of a row on one lane: one strip per service. */
export const GroupedRows: Story = {
  args: { series: CHANGES, groupRows: true, height: 260 },
};

/**
 * Datacenter availability over a day. `colors` maps the series to severity
 * colors and `formatDate` shows the time only, since it is a single day.
 */
export const SeverityColors: Story = {
  args: {
    groupRows: true,
    height: 240,
    colors: ['#f59e0b', '#ef4444'],
    formatDate: (t) => `${new Date(t).toISOString().slice(11, 16)} UTC`,
    series: [
      {
        name: 'Degraded',
        data: [
          { x: 'DC1 Paris', y: [at(14, 3, 15), at(14, 4)] },
          { x: 'DC2 Frankfurt', y: [at(14, 9, 10), at(14, 9, 45)] },
          { x: 'DC2 Frankfurt', y: [at(14, 10, 20), at(14, 11)] },
          { x: 'DC3 London', y: [at(14, 13, 5), at(14, 13, 30)] },
          { x: 'DC4 Tokyo', y: [at(14, 17), at(14, 19, 30)] },
        ],
      },
      {
        name: 'Outage',
        data: [
          { x: 'DC2 Frankfurt', y: [at(14, 9, 45), at(14, 10, 20)] },
          { x: 'DC3 London', y: [at(14, 13, 30), at(14, 14, 10)] },
        ],
      },
    ],
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The legend and the tooltip are HTML: series names and row labels show as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    series: [
      {
        name: HOSTILE,
        data: [
          { x: HOSTILE, y: [at(14, 2), at(14, 8)] },
          { x: 'B', y: [at(14, 4), at(14, 6)] },
        ],
      },
      { name: 'Normal', data: [{ x: 'B', y: [at(14, 9), at(14, 12)] }] },
    ],
  },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    // Tooltips render on hover: the title is the row, then the series name
    // and the dates.
    // The chart redraws once after mount and rebuilds an empty tooltip, so
    // hover again until both show.
    await waitFor(() => {
      hover(canvasElement.querySelector('.apexcharts-rangebar-series path') as Element);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
        HOSTILE
      );
    });
    await expectNoInjectedImage(canvasElement);
  },
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MaintenanceWindows.args, formatDate: (t) => new Date(t).toISOString() },
  render: (args) => (
    <Rerender>
      {(grown) => <RangeBarChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};
