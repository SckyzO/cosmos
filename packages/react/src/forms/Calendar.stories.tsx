import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from './Calendar';

const meta = {
  title: 'Forms/Calendar',
  component: Calendar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSelect: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="inline-block rounded-xl border border-gray-200 dark:border-gray-700">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </div>
    );
  },
};

export const WithFooter: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="inline-block rounded-xl border border-gray-200 dark:border-gray-700">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          footer={date ? `Selected: ${date.toLocaleDateString()}` : 'Pick a day.'}
        />
      </div>
    );
  },
};

export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange | undefined>();
    return (
      <div className="inline-block rounded-xl border border-gray-200 dark:border-gray-700">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          footer={
            range?.from && range?.to
              ? `${range.from.toLocaleDateString()} → ${range.to.toLocaleDateString()}`
              : 'Pick a start date, then an end date.'
          }
        />
      </div>
    );
  },
};

export const DisabledWeekends: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="inline-block rounded-xl border border-gray-200 dark:border-gray-700">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={{ dayOfWeek: [0, 6] }}
          footer="Weekends are disabled."
        />
      </div>
    );
  },
};

export const DisabledPastDates: Story = {
  render: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="inline-block rounded-xl border border-gray-200 dark:border-gray-700">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={{ before: today }}
          footer="Past dates are disabled."
        />
      </div>
    );
  },
};
