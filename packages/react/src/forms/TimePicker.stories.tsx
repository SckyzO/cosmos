import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { TimePicker } from './TimePicker';

const meta = {
  title: 'Forms/Time Picker',
  component: TimePicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Time' },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Preselected: Story = {
  args: { defaultValue: '14:30' },
};

export const FifteenMinuteSteps: Story = {
  args: {
    label: 'Meeting time',
    description: '15-minute increments only.',
    step: 15,
    defaultValue: '09:00',
  },
};

export const HoursOnly: Story = {
  args: {
    label: 'Hour bucket',
    description: 'step=60 → minute spinner shows :00 only.',
    step: 60,
    defaultValue: '13:00',
  },
};

export const BusinessHours: Story = {
  args: {
    label: 'Slot',
    description: '08:00 – 18:00 only.',
    min: '08:00',
    max: '18:00',
    defaultValue: '09:30',
  },
};

export const WithError: Story = {
  args: {
    label: 'Reminder time',
    error: 'Time must be in the future.',
    defaultValue: '06:00',
  },
};

export const Disabled: Story = {
  args: { label: 'Locked', disabled: true, defaultValue: '12:00' },
};

export const Controlled: Story = {
  render: () => {
    const [time, setTime] = useState('');
    return (
      <div className="space-y-2">
        <TimePicker label="Pick a time" value={time} onChange={setTime} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Selected: <code>{time || '(none)'}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ChangingFiresHandler: Story = {
  args: { label: 'Test', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText('Test') as HTMLInputElement;
    // Setting value directly + dispatching change is more reliable than
    // userEvent.type for type="time" (which has segmented input behaviour).
    await userEvent.clear(input);
    await userEvent.type(input, '0930AM');
    // Validate the value is parsed by the browser.
    await expect(args.onChange).toHaveBeenCalled();
  },
};
