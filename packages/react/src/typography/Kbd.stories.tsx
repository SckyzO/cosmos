import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './Kbd';

const meta = {
  title: 'Typography/Kbd',
  component: Kbd,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'K' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const SizeSm: Story = {
  args: { size: 'sm', children: 'K' },
};

export const Combo: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
      <Kbd>⌘</Kbd>
      <span className="text-gray-400">+</span>
      <Kbd>K</Kbd>
    </span>
  ),
};

export const ComboLong: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
      <Kbd>Ctrl</Kbd>
      <span className="text-gray-400">+</span>
      <Kbd>Shift</Kbd>
      <span className="text-gray-400">+</span>
      <Kbd>P</Kbd>
    </span>
  ),
};

export const InsideParagraph: Story = {
  render: () => (
    <p className="max-w-prose text-sm text-gray-700 dark:text-gray-200">
      Press <Kbd size="sm">⌘</Kbd> <Kbd size="sm">K</Kbd> to open the command palette, then{' '}
      <Kbd size="sm">↑</Kbd> / <Kbd size="sm">↓</Kbd> to navigate suggestions and{' '}
      <Kbd size="sm">↵</Kbd> to confirm.
    </p>
  ),
};

export const ShortcutLegend: Story = {
  render: () => {
    const rows = [
      { combo: ['⌘', 'K'], label: 'Open command palette' },
      { combo: ['⌘', '/'], label: 'Show keyboard shortcuts' },
      { combo: ['G', 'D'], label: 'Go to dashboard' },
      { combo: ['Esc'], label: 'Close overlay' },
    ];
    return (
      <div className="max-w-sm rounded-xl border border-gray-200 dark:border-gray-800">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={
              'flex items-center justify-between gap-4 px-4 py-2.5 ' +
              (i < rows.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : '')
            }
          >
            <span className="text-sm text-gray-700 dark:text-gray-200">{r.label}</span>
            <span className="flex items-center gap-1">
              {r.combo.map((k, j) => (
                <span key={k + j} className="inline-flex items-center gap-1">
                  <Kbd size="sm">{k}</Kbd>
                  {j < r.combo.length - 1 && <span className="text-gray-400">+</span>}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  },
};
