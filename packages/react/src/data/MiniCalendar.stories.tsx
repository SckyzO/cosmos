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

const FIXED_DAY = {
  today: new Date(2026, 4, 7),
  selected: new Date(2026, 4, 7),
};

/** A day reports its exact date, in the month on display. */
export const DayClickReportsTheDate: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '10' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(new Date(2026, 4, 10));
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await userEvent.click(canvas.getByRole('button', { name: '10' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(new Date(2026, 5, 10));
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
  },
};

/** The arrows step through the months and years; the title goes back to today's month. */
export const MonthNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn() },
  play: async ({ canvas }) => {
    const days = () => canvas.getAllByRole('button', { name: /^\d+$/ });
    await expect(canvas.getByRole('button', { name: 'May 2026' })).toBeVisible();
    await expect(days()).toHaveLength(31);

    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('button', { name: 'June 2026' })).toBeVisible();
    await expect(days()).toHaveLength(30);

    // Back past the start of the year.
    for (let i = 0; i < 6; i++)
      await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await expect(canvas.getByRole('button', { name: 'December 2025' })).toBeVisible();
    await expect(days()).toHaveLength(31);

    await userEvent.click(canvas.getByRole('button', { name: 'December 2025' }));
    await expect(canvas.getByRole('button', { name: 'May 2026' })).toBeVisible();
  },
};

/** Weeks start on Monday: May 1st, 2026 is a Friday and May 3rd a Sunday. */
export const WeeksStartOnMonday: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn() },
  play: async ({ canvas }) => {
    const left = (el: HTMLElement) => el.getBoundingClientRect().left;
    await expect(left(canvas.getByRole('button', { name: '1' }))).toBeCloseTo(
      left(canvas.getByText('Fr')),
      0
    );
    await expect(left(canvas.getByRole('button', { name: '3' }))).toBeCloseTo(
      left(canvas.getByText('Su')),
      0
    );
    await expect(left(canvas.getByRole('button', { name: '4' }))).toBeCloseTo(
      left(canvas.getByText('Mo')),
      0
    );
  },
};
