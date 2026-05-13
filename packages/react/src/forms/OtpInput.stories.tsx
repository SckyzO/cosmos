import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { OtpInput } from './OtpInput';

const meta = {
  title: 'Forms/OTP Input',
  component: OtpInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: '', onChange: fn() },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { value: '123456' },
};

export const Partial: Story = {
  args: { value: '123' },
};

export const FourDigits: Story = {
  args: { length: 4, value: '12' },
};

export const EightDigits: Story = {
  args: { length: 8, value: '1234' },
};

export const Alphanumeric: Story = {
  args: { value: 'AB12', alphanumeric: true, length: 6 },
};

export const Masked: Story = {
  args: { value: '123456', mask: true },
};

export const ErrorState: Story = {
  args: { value: '999999', error: true },
};

export const Disabled: Story = {
  args: { value: '123456', disabled: true },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    const [completed, setCompleted] = useState<string | null>(null);
    return (
      <div className="space-y-3">
        <OtpInput
          value={v}
          onChange={setV}
          onComplete={(final) => setCompleted(final)}
          autoFocus
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Value: <code>{v || '(empty)'}</code>
          {completed && (
            <>
              {' · '}Completed: <code>{completed}</code>
            </>
          )}
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TypingFillsCells: Story = {
  render: () => {
    const [v, setV] = useState('');
    return <OtpInput value={v} onChange={setV} length={4} />;
  },
  play: async ({ canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    await userEvent.keyboard('1234');
    await expect(cells[0]).toHaveValue('1');
    await expect(cells[1]).toHaveValue('2');
    await expect(cells[2]).toHaveValue('3');
    await expect(cells[3]).toHaveValue('4');
  },
};

export const OnCompleteFiresOnLastCell: Story = {
  render: (args) => {
    const [v, setV] = useState('');
    return (
      <OtpInput
        value={v}
        onChange={setV}
        onComplete={args.onComplete}
        length={3}
      />
    );
  },
  args: { onComplete: fn() },
  play: async ({ args, canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    await userEvent.keyboard('789');
    await expect(args.onComplete).toHaveBeenCalledWith('789');
  },
};

export const NonDigitsAreFiltered: Story = {
  render: () => {
    const [v, setV] = useState('');
    return <OtpInput value={v} onChange={setV} length={4} />;
  },
  play: async ({ canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    // Letters are filtered for digits-only OTP
    await userEvent.keyboard('a1b2');
    await expect(cells[0]).toHaveValue('1');
    await expect(cells[1]).toHaveValue('2');
    await expect(cells[2]).toHaveValue('');
  },
};

export const AlphanumericAccepts: Story = {
  render: () => {
    const [v, setV] = useState('');
    return <OtpInput value={v} onChange={setV} length={4} alphanumeric />;
  },
  play: async ({ canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    await userEvent.keyboard('aB1');
    await expect(cells[0]).toHaveValue('a');
    await expect(cells[1]).toHaveValue('B');
    await expect(cells[2]).toHaveValue('1');
  },
};

export const BackspaceMovesBack: Story = {
  render: () => {
    const [v, setV] = useState('123');
    return <OtpInput value={v} onChange={setV} length={4} autoFocus />;
  },
  play: async ({ canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[3].focus();
    // Cell 3 is empty → Backspace moves focus back AND clears cell 2 (the '3').
    await userEvent.keyboard('{Backspace}');
    await expect(cells[2]).toHaveFocus();
  },
};
