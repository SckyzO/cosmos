import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectFocusBorder,
  expectRefFocuses,
  expectTextContrast,
  inEachTheme,
  portalDocsParams,
  withCanvasPadding,
} from '../storybook-helpers';
import { Calendar } from './Calendar';
import { DatePicker, type DateRange } from './DatePicker';

const meta = {
  title: 'Forms/Date Picker',
  component: DatePicker,
  parameters: portalDocsParams(420),
  decorators: [withCanvasPadding],
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
          Selected: <code>{fmt(range.from)}</code>{' '}
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            →
          </span>{' '}
          <code>{fmt(range.to)}</code>
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

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const ClickOpensCalendar: Story = {
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
  args: { label: 'Pick' },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /pick/i }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};

/** Opening from the keyboard moves focus into the calendar; Escape brings it back. */
export const KeyboardFocusManagement: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Pick' },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /pick/i });
    const dialog = () => document.querySelector('[role="dialog"]');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog()).not.toBeNull());
    await waitFor(() => expect(dialog()!.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(document.activeElement).toBe(trigger);
  },
};

/** In range mode, focus goes back to the trigger that opened the calendar. */
export const RangeRestoresFocusToOpeningTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  args: { mode: 'range', label: 'Stay' },
  play: async ({ canvas }) => {
    const to = canvas.getByRole('button', { name: /end date/i });
    const dialog = () => document.querySelector('[role="dialog"]');
    to.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog()?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(document.activeElement).toBe(to);
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const TriggerFocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Pick a date' },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-haspopup="dialog"]');
    await expectFocusBorder(trigger as HTMLElement);
  },
};

export const TriggerErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Pick a date', error: 'Required' },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-haspopup="dialog"]');
    await expectFocusBorder(trigger as HTMLElement, { token: '--color-red-500' });
  },
};

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Date must be in the future.'));
  },
};

// The empty trigger's placeholder text sat under 4.5:1 on light and sand (#151).
export const PlaceholderContrastInEveryTheme: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const placeholder = canvas.getByRole('button').querySelector('span')!;
    inEachTheme(() => expectTextContrast(placeholder));
  },
};

const singleRef = createRef<HTMLButtonElement>();
const rangeRef = createRef<HTMLButtonElement>();

/** The ref gets the labelled trigger `<button>`: the only one, or the start date's in `range` mode. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-4">
      <DatePicker ref={singleRef} label="Departure" />
      <DatePicker ref={rangeRef} mode="range" label="Stay" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(singleRef, canvas.getByLabelText('Departure'));
    await expectRefFocuses(rangeRef, canvas.getByLabelText('Stay'));
  },
};

// ── Open state (#151) ────────────────────────────────────────────────────────
// `open` / `defaultOpen` / `onOpenChange`, only `undefined` meaning uncontrolled.
// `defaultOpen` starts it open and it closes on its own; held at a fixed `open`,
// it reports what the user asks for and keeps the state it is given.

const calendarDialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

/** Opened by `defaultOpen`, the calendar anchors under the trigger and closes on its own. */
export const DefaultOpenClosesOnItsOwn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Due', defaultOpen: true, onOpenChange: fn() },
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('button', { name: /due/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(calendarDialog()).not.toBeNull());
    const top = trigger.getBoundingClientRect().bottom + 6;
    await expect(calendarDialog()!.style.top).toBe(`${top}px`);

    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(calendarDialog()).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/** Held open, a pick and Escape report a close and the calendar stays. */
export const ControlledOpenOnlyReports: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Due',
    open: true,
    defaultValue: new Date(2026, 4, 7),
    onOpenChange: fn(),
    onChange: fn(),
  },
  play: async ({ args }) => {
    await waitFor(() => expect(calendarDialog()).not.toBeNull());
    await userEvent.click(within(calendarDialog()!).getByRole('button', { name: /May 12/ }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenChange).toHaveBeenCalledTimes(2);
    await expect(calendarDialog()).not.toBeNull();
  },
};

/**
 * Opened from the end date, the calendar stays under that trigger when its
 * container scrolls: the refresh used to move it under the start date.
 */
export const RangeStaysUnderTheTriggerThatOpenedIt: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="scroller" className="h-64 overflow-y-auto">
      <div className="pt-8 pb-[600px]">
        <DatePicker mode="range" label="Stay" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const to = canvas.getByRole('button', { name: /end date/i });
    await userEvent.click(to);
    await waitFor(() => expect(calendarDialog()).not.toBeNull());
    const scroller = canvas.getByTestId('scroller');
    const before = to.getBoundingClientRect().top;
    scroller.scrollTop = 40;
    await expect(to.getBoundingClientRect().top).toBeCloseTo(before - 40, 0);
    await waitFor(() => {
      const t = to.getBoundingClientRect();
      const panel = calendarDialog()!.getBoundingClientRect();
      // The edges the text starts at: the left ones, the right ones in right to left.
      const edge = getComputedStyle(to).direction === 'rtl' ? 'right' : 'left';
      expect(panel[edge]).toBeCloseTo(t[edge], 0);
      expect(panel.top).toBeCloseTo(t.bottom + 6, 0);
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(calendarDialog()).toBeNull());
  },
};

/** Held closed, a click on the trigger reports an open and nothing opens. */
export const ControlledClosedOnlyReports: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Due', open: false, onOpenChange: fn() },
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('button', { name: /due/i });
    await userEvent.click(trigger);
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(calendarDialog()).toBeNull();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The calendar opens under the trigger, aligned to the edges the text starts at, in its direction. */
export const OpensUnderTheTriggerInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => bothDirections(() => <DatePicker label="Day" />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const trigger = within(box).getByRole('button', { name: /Day/ });
      await userEvent.click(trigger);
      await waitFor(() => expect(calendarDialog()).not.toBeNull());
      const dialog = calendarDialog()!;
      await expect(dialog).toHaveAttribute('dir', dir);
      // The calendar is told the direction it sits in (left alone in left to right).
      const calendar = dialog.querySelector('.rdp-root')!;
      if (dir === 'rtl') await expect(calendar).toHaveAttribute('dir', 'rtl');
      else await expect(calendar).not.toHaveAttribute('dir');
      await waitFor(() => {
        const edge = dir === 'rtl' ? 'right' : 'left';
        expect(dialog.getBoundingClientRect()[edge]).toBeCloseTo(
          trigger.getBoundingClientRect()[edge],
          0
        );
      });
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(calendarDialog()).toBeNull());
    }
  },
};

// On a phone the two dates of a range don't fit side by side: the end date goes under the start
// date instead of pushing the page sideways.
export const RangeWrapsInANarrowBox: Story = {
  tags: ['!dev', '!autodocs'],
  args: { mode: 'range', label: 'Stay' },
  render: (args) => (
    <div data-testid="box" style={{ width: 296 }}>
      <DatePicker {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const box = canvas.getByTestId('box');
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const [from, to] = canvasElement.querySelectorAll('button[aria-haspopup="dialog"]');
    await expect(to!.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      from!.getBoundingClientRect().bottom
    );
  },
};
