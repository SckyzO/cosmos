import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RealtimeChart, type RealtimeChartProps } from './RealtimeChart';

// Recorded traces, replayed in a loop: the wrapper's default generator is
// random, which would make every render different.
const CPU = [
  48, 52, 55, 51, 58, 62, 60, 66, 71, 68, 64, 59, 61, 57, 53, 50, 54, 49, 46, 51, 55, 60, 63, 58,
  54, 52, 56, 53, 49, 47,
];
const DISK = [
  76, 77, 77, 78, 79, 79, 80, 81, 81, 82, 83, 84, 84, 85, 86, 87, 88, 89, 90, 91, 91, 92, 88, 84,
  81, 79, 78, 78, 77, 76,
];
const QUEUE = [22, 31, 45, 38, 52, 67, 74, 88, 81, 63, 49, 36, 28, 25, 33, 41];

/** RealtimeChart fed from `trace`, from the start on every mount. */
const Replay = ({ trace, ...props }: RealtimeChartProps & { trace: number[] }) => {
  // The generator must be stable: RealtimeChart restarts its interval when it changes.
  const [generator] = useState(() => {
    let i = 0;
    return () => trace[i++ % trace.length];
  });
  return <RealtimeChart {...props} generator={generator} />;
};

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Realtime',
  component: RealtimeChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof RealtimeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * A new sample every 2 s scrolls a 30-point window on a 0–100 axis, with the
 * WARN (70) and CRIT (85) thresholds.
 */
export const Basic: Story = {
  render: (args) => <Replay {...args} trace={CPU} />,
};

/** `warnThreshold` and `critThreshold` move the annotation lines. */
export const CustomThresholds: Story = {
  args: { warnThreshold: 80, critThreshold: 90 },
  render: (args) => <Replay {...args} trace={DISK} />,
};

/** `intervalMs` and `windowSize` set the pace and how much history stays on screen. */
export const FastShortWindow: Story = {
  args: { intervalMs: 1000, windowSize: 12 },
  render: (args) => <Replay {...args} trace={QUEUE} />,
};

/** `height` fits the chart in a dashboard tile. */
export const CompactHeight: Story = {
  args: { height: 140 },
  render: (args) => <Replay {...args} trace={CPU} />,
};
