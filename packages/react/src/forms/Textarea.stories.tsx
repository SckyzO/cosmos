import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import {
  expectFocusBorder,
  expectPlaceholderContrast,
  expectTextContrast,
  inEachTheme,
} from '../storybook-helpers';
import { Textarea } from './Textarea';

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { placeholder: 'Type a message…' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Message', placeholder: 'Type a message…' },
};

export const WithDescription: Story = {
  args: {
    label: 'Bio',
    description: 'A short description that appears on your profile.',
    placeholder: 'Tell us about yourself…',
  },
};

export const WithError: Story = {
  args: {
    label: 'Comment',
    error: 'Comment cannot be empty.',
    defaultValue: '',
  },
};

export const WithMaxLength: Story = {
  args: {
    label: 'Tweet',
    maxLength: 280,
    description: 'Up to 280 characters.',
    defaultValue: 'Cosmos design system in action — keep it terse.',
  },
};

export const ShowCountWithoutMax: Story = {
  args: {
    label: 'Free-form notes',
    showCount: true,
    defaultValue: 'Counts characters as you type.',
  },
};

export const NoResize: Story = {
  args: { label: 'Locked size', resize: 'none', rows: 3 },
};

export const Disabled: Story = {
  args: { label: 'Read-only', disabled: true, defaultValue: 'You cannot edit me.' },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md">
        <Textarea
          label="Bio"
          maxLength={120}
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="Type to see counter…"
        />
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Length: <code>{v.length}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TypingFiresOnChange: Story = {
  tags: ['!dev'],
  args: { label: 'Message', onChange: fn() },
  play: async ({ args, canvas }) => {
    const ta = canvas.getByLabelText('Message');
    await userEvent.type(ta, 'hi');
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

export const CounterUpdatesAsYouType: Story = {
  args: { label: 'Note', maxLength: 50 },
  play: async ({ canvas }) => {
    const ta = canvas.getByLabelText('Note');
    await userEvent.type(ta, 'hello');
    await expect(canvas.getByText('5 / 50')).toBeInTheDocument();
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Message' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox'));
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Message', error: 'Required' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox'), { token: '--color-red-500' });
  },
};

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Comment cannot be empty.'));
  },
};

// Native placeholders sat under 4.5:1 on light and sand (#151).
export const PlaceholderContrastInEveryTheme: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByLabelText('Message');
    inEachTheme(() => expectPlaceholderContrast(field));
  },
};

// ── Auto-resize ──────────────────────────────────────────────────────────────

/** `rows` is the minimum: the field grows with its content and has no resize handle. */
export const AutoResize: Story = {
  args: {
    label: 'Notes',
    description: 'Grows as you type.',
    autoResize: true,
    rows: 2,
    defaultValue: 'First line\nSecond line\nThird line',
  },
};

/** Up to `maxRows` rows, then the field scrolls. */
export const AutoResizeWithMaxRows: Story = {
  args: {
    label: 'Notes',
    description: 'Grows to 5 rows, then scrolls.',
    autoResize: true,
    rows: 2,
    maxRows: 5,
    defaultValue: Array.from({ length: 9 }, (_, i) => `Line ${i + 1}`).join('\n'),
  },
};

const heightOf = (el: HTMLElement) => el.getBoundingClientRect().height;

export const AutoResizeGrowsAndShrinks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Notes', autoResize: true, rows: 2 },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Notes' });
    const minimum = heightOf(field);
    await userEvent.type(field, 'one{Enter}two{Enter}three{Enter}four');
    await expect(heightOf(field)).toBeGreaterThan(minimum);
    await expect(field.scrollHeight).toBeLessThanOrEqual(field.clientHeight);
    await expect(getComputedStyle(field).resize).toBe('none');
    await userEvent.clear(field);
    await expect(heightOf(field)).toBe(minimum);
  },
};

export const AutoResizeStopsAtMaxRows: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Notes', autoResize: true, rows: 2, maxRows: 4 },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Notes' });
    const style = getComputedStyle(field);
    const cap =
      Number.parseFloat(style.lineHeight) * 4 +
      Number.parseFloat(style.paddingTop) +
      Number.parseFloat(style.paddingBottom) +
      Number.parseFloat(style.borderTopWidth) +
      Number.parseFloat(style.borderBottomWidth);
    await userEvent.type(field, '1{Enter}2{Enter}3');
    await expect(heightOf(field)).toBeLessThan(cap);
    await expect(getComputedStyle(field).overflowY).toBe('hidden');
    await userEvent.type(field, '{Enter}4{Enter}5{Enter}6{Enter}7');
    await expect(heightOf(field)).toBeCloseTo(cap, 0);
    await expect(getComputedStyle(field).overflowY).toBe('auto');
    await expect(field.scrollHeight).toBeGreaterThan(field.clientHeight);
  },
};

/** Without `autoResize` the field keeps its `rows`, however much is typed. */
export const WithoutAutoResizeKeepsRows: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Notes', rows: 2 },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Notes' });
    const before = heightOf(field);
    await userEvent.type(field, '1{Enter}2{Enter}3{Enter}4{Enter}5');
    await expect(heightOf(field)).toBe(before);
    await expect(getComputedStyle(field).resize).toBe('vertical');
  },
};

/** A field resized by its handle keeps that height while the user types. */
export const WithoutAutoResizeKeepsAManualHeight: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Notes', rows: 2 },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Notes' });
    // Dragging the handle writes an inline height, as this does.
    field.style.height = '200px';
    await userEvent.type(field, 'more');
    await expect(heightOf(field)).toBe(200);
  },
};

const AutoResizeSwitch = () => {
  const [autoResize, setAutoResize] = useState(true);
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setAutoResize(false)}>
        Fixed height
      </button>
      <Textarea label="Notes" rows={2} autoResize={autoResize} defaultValue={'1\n2\n3\n4\n5'} />
    </div>
  );
};

/** Turning `autoResize` off hands the height back to `rows`. */
export const TurningAutoResizeOffRestoresRows: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AutoResizeSwitch />,
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Notes' });
    await expect(field.style.height).not.toBe('');
    await userEvent.click(canvas.getByRole('button', { name: 'Fixed height' }));
    await expect(field.style.height).toBe('');
    await expect(getComputedStyle(field).resize).toBe('vertical');
  },
};
