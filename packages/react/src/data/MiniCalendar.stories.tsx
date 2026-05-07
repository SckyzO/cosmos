import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { MiniCalendar } from './MiniCalendar';

const meta = {
  title: 'Data/Mini Calendar',
  component: MiniCalendar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { selected: new Date(2026, 4, 7), onSelect: () => {} },
} satisfies Meta<typeof MiniCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { today: new Date(2026, 4, 7), selected: new Date(2026, 4, 7), onSelect: () => {} },
};

export const WithEventDots: Story = {
  args: {
    today: new Date(2026, 4, 7),
    selected: new Date(2026, 4, 7),
    eventDays: new Set(['2026-05-12', '2026-05-21', '2026-05-28']),
    onSelect: () => {},
  },
};

export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = useState(new Date(2026, 4, 7));
    return (
      <div>
        <MiniCalendar today={new Date(2026, 4, 7)} selected={selected} onSelect={setSelected} />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Selected: {selected.toLocaleDateString()}
        </p>
      </div>
    );
  },
};

export const NextMonthFiresOnSelect: Story = {
  args: {
    today: new Date(2026, 4, 7),
    selected: new Date(2026, 4, 7),
    onSelect: fn(),
  },
  play: async ({ args, canvas }) => {
    // Click the "Next month" arrow → June, then click day 10
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    const cell = canvas.getByRole('button', { name: '10' });
    await userEvent.click(cell);
    await expect(args.onSelect).toHaveBeenCalled();
  },
};
