import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { portalDocsParams } from '../storybook-helpers';
import { DateRangePicker, type DateRange } from './DateRangePicker';

const meta = {
  title: 'Forms/Date Range Picker',
  component: DateRangePicker,
  parameters: portalDocsParams(540),
  tags: ['autodocs'],
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const today = new Date();
const inSevenDays = new Date(today);
inSevenDays.setDate(inSevenDays.getDate() + 7);

export const Default: Story = { args: { label: 'Pick a date range' } };

export const WithDescription: Story = {
  args: {
    label: 'Reporting window',
    description: 'Both bounds are inclusive. Maximum 90 days.',
  },
};

export const Preselected: Story = {
  args: {
    label: 'Maintenance window',
    defaultValue: { from: today, to: inSevenDays },
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Filter incidents',
    fullWidth: true,
    description: 'Both triggers stretch to share the available width.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Audit window',
    error: 'End date must be after start date.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Locked',
    disabled: true,
    defaultValue: { from: today, to: inSevenDays },
  },
};

export const Bounded: Story = {
  args: {
    label: 'Booking dates',
    description: 'Available within the next 30 days only.',
    fromDate: today,
    toDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    })(),
  },
};

export const Controlled: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
    const fmt = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '—');
    return (
      <div className="space-y-3">
        <DateRangePicker label="Pick a range" value={range} onChange={setRange} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Selected: <code>{fmt(range.from)}</code> → <code>{fmt(range.to)}</code>
        </p>
      </div>
    );
  },
};
