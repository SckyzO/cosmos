import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { LOG_LEVEL_KEYS } from './types';
import { LogLevelBadge } from './LogLevelBadge';

const meta = {
  title: 'Monitoring/Log Level Badge',
  component: LogLevelBadge,
  tags: ['autodocs'],
  args: { level: 'error' },
} satisfies Meta<typeof LogLevelBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every level on the surface tone: the word says it, the colour only backs it. */
export const SurfaceLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {[...LOG_LEVEL_KEYS, 'warning'].map((level) => (
        <LogLevelBadge key={level} level={level} />
      ))}
    </div>
  ),
};

/** Every level on the terminal tone, the dark panel of a `LogViewer`, in every theme. */
export const TerminalLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 rounded-xl bg-slate-950 p-4">
      {LOG_LEVEL_KEYS.map((level) => (
        <LogLevelBadge key={level} level={level} tone="terminal" />
      ))}
    </div>
  ),
};

/** The test of the levels, hidden: each is a word, in any case, and a level it does not know reads UNKNOWN. */
export const LevelsAreLabelledByText: Story = {
  ...SurfaceLevels,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    for (const word of ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])
      expect(canvas.getByText(word)).toBeVisible();
    // `unknown` and the unrecognised `warning` both read UNKNOWN.
    expect(canvas.getAllByText('UNKNOWN')).toHaveLength(2);
  },
};
