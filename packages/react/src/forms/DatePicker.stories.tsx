import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { Calendar } from './Calendar';
import { DatePicker, type DateRange } from './DatePicker';

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

// ── Range mode ───────────────────────────────────────────────────────────────
// DatePicker switches to a two-trigger layout when `mode="range"`. The same
// component covers both single-date and date-range cases — one import for
// both flavours.

export const Range: Story = {
  args: { mode: 'range', label: 'Pick a date range' },
};

export const RangePreselected: Story = {
  args: {
    mode: 'range',
    label: 'Maintenance window',
    defaultValue: (() => {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 7);
      return { from, to };
    })(),
  },
};

export const RangeFullWidth: Story = {
  args: {
    mode: 'range',
    label: 'Filter incidents',
    fullWidth: true,
    description: 'Both triggers stretch to share the available width.',
  },
};

export const RangeBoundedTo30Days: Story = {
  args: {
    mode: 'range',
    label: 'Booking dates',
    description: 'Available within the next 30 days only.',
    fromDate: new Date(),
    toDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    })(),
  },
};

export const RangeControlled: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
    const fmt = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '—');
    return (
      <div className="space-y-3">
        <DatePicker mode="range" label="Pick a range" value={range} onChange={setRange} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Selected: <code>{fmt(range.from)}</code> → <code>{fmt(range.to)}</code>
        </p>
      </div>
    );
  },
};

// ── Flowbite-inspired patterns ───────────────────────────────────────────────
// Map to the canonical Flowbite Datepicker variants
// (https://flowbite.com/docs/components/datepicker/) using Cosmos primitives.

export const InlineCalendar: Story = {
  // The popover-less variant: drop the trigger and embed `<Calendar>` directly
  // in the surrounding layout. Useful for filter sidebars and date-driven
  // dashboards where the picker is always visible. Same component, no chrome.
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="max-w-xs rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Calendar mode="single" selected={date} onSelect={setDate} captionLayout="dropdown" />
      </div>
    );
  },
};

export const TodayAndClear: Story = {
  // Mirrors Flowbite's "Datepicker with action buttons" — two actions in the
  // footer instead of just the default "Today" pill, using the public
  // `calendarFooter` slot to compose without forking the component.
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <DatePicker
        label="Maintenance window"
        value={date}
        onChange={setDate}
        calendarFooter={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setDate(undefined)}
              className="inline-flex h-7 items-center rounded-md px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setDate(new Date())}
              className="bg-brand-500 hover:bg-brand-600 inline-flex h-7 items-center rounded-md px-3 text-xs font-medium text-white transition-colors"
            >
              Today
            </button>
          </div>
        }
      />
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
