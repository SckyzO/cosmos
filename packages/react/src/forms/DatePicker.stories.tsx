import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { DatePicker } from './DatePicker';

const meta = {
  title: 'Forms/Date Picker',
  component: DatePicker,
  parameters: portalDocsParams(420),
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Pick a date' } };

export const WithDescription: Story = {
  args: {
    label: 'Departure',
    description: 'You can change this later up to 24 h before the flight.',
  },
};

export const Preselected: Story = {
  args: { label: 'Anniversary', defaultValue: new Date(2026, 4, 7) },
};

export const WithError: Story = {
  args: { label: 'Due date', error: 'Date must be in the future.' },
};

export const Disabled: Story = {
  args: { label: 'Locked', disabled: true, defaultValue: new Date() },
};

export const RangeBounded: Story = {
  args: {
    label: 'Booking date',
    description: 'Available within the next 30 days only.',
    fromDate: new Date(),
    toDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    })(),
  },
};

export const CustomFormat: Story = {
  args: {
    label: 'Release date',
    defaultValue: new Date(),
    format: (d) => d.toISOString().slice(0, 10),
  },
};

export const NarrowYearRange: Story = {
  args: {
    label: 'Birth year',
    description: 'Year dropdown is bounded to 1950–2010.',
    fromYear: 1950,
    toYear: 2010,
    defaultValue: new Date(1990, 5, 15),
  },
};

export const NoTodayButton: Story = {
  args: { label: 'Anniversary', showTodayButton: false },
};

export const ChevronCaption: Story = {
  args: {
    label: 'Old-school caption',
    description: 'Set captionLayout="label" to use chevron-only navigation.',
    captionLayout: 'label',
  },
};

export const Controlled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="space-y-3">
        <DatePicker label="Pick a date" value={date} onChange={setDate} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Selected: <code>{date ? date.toISOString().slice(0, 10) : '(none)'}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickOpensCalendar: Story = {
  args: { label: 'Pick' },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /pick/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
  },
};

export const EscapeCloses: Story = {
  args: { label: 'Pick' },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /pick/i }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};
