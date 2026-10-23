import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { DateRange, Matcher } from 'react-day-picker';
import { expect, userEvent } from 'storybook/test';
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

// ── Interaction tests ────────────────────────────────────────────────────────

// A fixed month and "today", so the tests don't depend on the date they run.
const MAY = new Date(2026, 4);
const TODAY = new Date(2026, 4, 7);

// Local-time `YYYY-MM-DD`, to show the picked day as plain text.
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const PickADay = ({
  disabled,
  startMonth,
  endMonth,
  captionLayout,
}: {
  disabled?: Matcher | Matcher[];
  startMonth?: Date;
  endMonth?: Date;
  captionLayout?: 'label' | 'dropdown';
}) => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <Calendar
      mode="single"
      defaultMonth={MAY}
      today={TODAY}
      selected={date}
      onSelect={setDate}
      disabled={disabled}
      startMonth={startMonth}
      endMonth={endMonth}
      captionLayout={captionLayout}
      footer={date ? `Selected: ${ymd(date)}` : 'Pick a day.'}
    />
  );
};

/** A click on a day selects it, marks its cell and replaces the previous pick. */
export const ClickSelectsADay: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <PickADay />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('grid', { name: 'May 2026' })).toBeVisible();
    await expect(canvas.queryByRole('gridcell', { selected: true })).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: /May 15th, 2026/ }));
    await expect(canvas.getByText('Selected: 2026-05-15')).toBeVisible();
    await expect(canvas.getByRole('gridcell', { selected: true })).toHaveTextContent('15');

    await userEvent.click(canvas.getByRole('button', { name: /May 20th, 2026/ }));
    await expect(canvas.getByText('Selected: 2026-05-20')).toBeVisible();
    await expect(canvas.getAllByRole('gridcell', { selected: true })).toHaveLength(1);
  },
};

/** The arrows, PageDown and Enter reach and pick a day without the pointer. */
export const KeyboardPicksADay: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <PickADay />,
  play: async ({ canvas }) => {
    // The grid is one tab stop, on today; the arrow keys move by day and by week.
    canvas.getByRole('button', { name: 'Go to the Next Month' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: /May 7th, 2026/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('button', { name: /May 8th, 2026/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('button', { name: /May 15th, 2026/ })).toHaveFocus();
    // PageDown goes to the same day of the next month.
    await userEvent.keyboard('{PageDown}');
    await expect(canvas.getByRole('grid', { name: 'June 2026' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: /June 15th, 2026/ })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Selected: 2026-06-15')).toBeVisible();
  },
};

/** The chevrons step through the months; `startMonth` and `endMonth` stop them. */
export const MonthNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <PickADay startMonth={new Date(2026, 3)} endMonth={new Date(2026, 5)} />,
  play: async ({ canvas }) => {
    const previous = canvas.getByRole('button', { name: 'Go to the Previous Month' });
    const next = canvas.getByRole('button', { name: 'Go to the Next Month' });
    await userEvent.click(next);
    await expect(canvas.getByRole('grid', { name: 'June 2026' })).toBeVisible();
    // At its limit a chevron is `aria-disabled` and does nothing.
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(next);
    await expect(canvas.getByRole('grid', { name: 'June 2026' })).toBeVisible();
    await userEvent.click(previous);
    await userEvent.click(previous);
    await expect(canvas.getByRole('grid', { name: 'April 2026' })).toBeVisible();
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(previous);
    await expect(canvas.getByRole('grid', { name: 'April 2026' })).toBeVisible();
  },
};

/** `captionLayout="dropdown"` replaces the label with month and year selects. */
export const CaptionDropdownsJumpToAMonth: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <PickADay
      captionLayout="dropdown"
      startMonth={new Date(2024, 0)}
      endMonth={new Date(2028, 11)}
    />
  ),
  play: async ({ canvas }) => {
    const [month, year] = canvas.getAllByRole('combobox');
    await expect(month).toHaveDisplayValue('May');
    await expect(year).toHaveDisplayValue('2026');
    await userEvent.selectOptions(month, 'September');
    await expect(canvas.getByRole('grid', { name: 'September 2026' })).toBeVisible();
    await userEvent.selectOptions(year, '2027');
    await expect(canvas.getByRole('grid', { name: 'September 2027' })).toBeVisible();
  },
};

/** A disabled day is not clickable and is never picked. */
export const DisabledDaysCannotBePicked: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <PickADay disabled={{ dayOfWeek: [0, 6] }} />,
  play: async ({ canvas }) => {
    const saturday = canvas.getByRole('button', { name: /May 9th, 2026/ });
    await expect(saturday).toBeDisabled();
    await userEvent.click(saturday);
    await expect(canvas.getByText('Pick a day.')).toBeVisible();

    const friday = canvas.getByRole('button', { name: /May 8th, 2026/ });
    await expect(friday).toBeEnabled();
    await userEvent.click(friday);
    await expect(canvas.getByText('Selected: 2026-05-08')).toBeVisible();
  },
};

/** In range mode, a first click starts the range and a second one ends it. */
export const RangeFillsTheDaysBetween: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [range, setRange] = useState<DateRange | undefined>();
    return (
      <Calendar
        mode="range"
        defaultMonth={MAY}
        today={TODAY}
        selected={range}
        onSelect={setRange}
        footer={
          range?.from && range?.to
            ? `Range: ${ymd(range.from)} to ${ymd(range.to)}`
            : 'Pick a start date, then an end date.'
        }
      />
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /May 11th, 2026/ }));
    await expect(canvas.getByRole('gridcell', { selected: true })).toHaveTextContent('11');
    await userEvent.click(canvas.getByRole('button', { name: /May 14th, 2026/ }));
    await expect(canvas.getByText('Range: 2026-05-11 to 2026-05-14')).toBeVisible();
    // 11, 12, 13 and 14 are all marked.
    await expect(canvas.getAllByRole('gridcell', { selected: true })).toHaveLength(4);
  },
};
