import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import {
  endOffset,
  expectBorderToken,
  expectFocusBorder,
  expectPlaceholderContrast,
  expectSuccessBorder,
  expectTextContrast,
  inEachTheme,
  startOffset,
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
  tags: ['!dev', '!autodocs'],
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

// ── Success (#405) ───────────────────────────────────────────────────────────

/**
 * `success` is the message under the field once its text is valid: a green border and message,
 * and no icon. `error` wins when both are set, and so does going over `maxLength`.
 */
export const WithSuccess: Story = {
  args: {
    label: 'Release notes',
    defaultValue: 'Adds a success state to the fields.',
    success: 'Looks good.',
  },
};

export const SuccessIsLinkedAndAnnounced: Story = {
  ...WithSuccess,
  tags: ['!dev'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Release notes' });
    const message = canvas.getByText('Looks good.');
    await expect(field).toHaveAccessibleDescription('Looks good.');
    await expect(field.getAttribute('aria-describedby')).toBe(message.id);
    await expect(message.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
    // A valid text is not an invalid one: nothing marks the field as such.
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

export const ErrorWinsOverSuccess: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: {
    label: 'Release notes',
    error: 'Release notes cannot be empty.',
    success: 'Looks good.',
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Release notes' });
    await expect(field).toHaveAccessibleDescription('Release notes cannot be empty.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.queryByText('Looks good.')).toBeNull();
    await expect(canvas.getByText('Release notes cannot be empty.')).not.toHaveAttribute(
      'aria-live'
    );
    expectBorderToken(field, '--color-red-400');
  },
};

/** Past `maxLength` the field is invalid, so the success gives way, border and message. */
export const OverLimitWinsOverSuccess: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: {
    label: 'Release notes',
    maxLength: 10,
    defaultValue: 'Over the limit',
    success: 'Looks good.',
    description: 'Up to 10 characters.',
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Release notes' });
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.queryByText('Looks good.')).toBeNull();
    await expect(field).toHaveAccessibleDescription('Up to 10 characters.');
    expectBorderToken(field, '--color-red-400');
  },
};

export const SuccessColorsInEveryTheme: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Release notes' });
    const message = canvas.getByText('Looks good.');
    expectSuccessBorder(field);
    inEachTheme(() => expectTextContrast(message));
  },
};

export const SuccessFocusShowsAccentBorderInDark: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox', { name: 'Release notes' }));
  },
};

/** The border and the message only: the textarea draws no icon. */
export const SuccessHasNoIcon: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).toBeNull();
  },
};

/** The success border follows a field that grows with its content. */
export const SuccessWithAutoResize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Release notes', autoResize: true, rows: 2, success: 'Looks good.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Release notes' });
    const minimum = heightOf(field);
    await userEvent.type(field, 'one{Enter}two{Enter}three{Enter}four');
    await expect(heightOf(field)).toBeGreaterThan(minimum);
    await expect(field.scrollHeight).toBeLessThanOrEqual(field.clientHeight);
    await expect(field).toHaveAccessibleDescription('Looks good.');
    // Typing took the focus: blur it, the border is the success one again.
    field.blur();
    expectSuccessBorder(field);
  },
};

/** Without `success` the field is what it was: neutral border, no icon, no live region. */
export const NoSuccessKeepsTheNeutralLook: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: { label: 'Bio', description: 'A short description.' },
  play: async ({ canvas, canvasElement }) => {
    expectBorderToken(canvas.getByRole('textbox', { name: 'Bio' }), '--color-gray-200');
    await expect(canvasElement.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('A short description.')).not.toHaveAttribute('aria-live');
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * Each paragraph follows the direction of what is typed in it, and the counter, a code, reads
 * "12 / 100" in any page and sits at the end of the row.
 */
export const ParagraphsAndCounterInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div dir="rtl">
      <Textarea
        label="Message"
        defaultValue={'Hello world\nمرحبا بالعالم'}
        maxLength={100}
        description="Visible to the team."
      />
    </div>
  ),
  play: ({ canvas, canvasElement }) => {
    const field = canvas.getByRole('textbox', { name: 'Message' });
    expect(getComputedStyle(field).unicodeBidi).toBe('plaintext');
    expect(getComputedStyle(field).direction).toBe('rtl');
    const counter = canvasElement.querySelector<HTMLElement>('[aria-live="polite"]')!;
    expect(counter).toHaveTextContent('25 / 100');
    expect(getComputedStyle(counter).direction).toBe('ltr');
    // "23" is read before "100": left of it.
    const [count, max] = [...counter.childNodes].filter((node) => node.textContent?.match(/\d/));
    const rect = (node: Node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    expect(rect(count!).left).toBeLessThan(rect(max!).left);
    // The description is at the start of the row, the counter at the end.
    const description = canvas.getByText('Visible to the team.');
    expect(startOffset(description, field)).toBeCloseTo(0, 0);
    expect(endOffset(counter, field)).toBeCloseTo(0, 0);
  },
};
