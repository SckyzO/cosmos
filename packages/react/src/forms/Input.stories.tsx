import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import {
  expectFocusBorder,
  expectPlaceholderContrast,
  expectTextContrast,
  inEachTheme,
} from '../storybook-helpers';
import { Input } from './Input';

const meta = {
  title: 'Forms/Input',
  component: Input,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { placeholder: 'Type here…' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Email', placeholder: 'user@example.com' },
};

export const WithIcon: Story = {
  args: { label: 'Email', icon: Mail, placeholder: 'user@example.com' },
};

export const WithDescription: Story = {
  args: {
    label: 'Email',
    icon: Mail,
    placeholder: 'user@example.com',
    description: 'We will never share your email.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Endpoint URL',
    placeholder: 'https://prom.example.com',
    error: 'Must start with https://',
  },
};

export const WithRightSlot: Story = {
  args: {
    label: 'Scrape interval',
    placeholder: '15',
    type: 'number',
    rightSlot: 'seconds',
  },
};

export const WithPrefix: Story = {
  args: {
    label: 'Endpoint URL',
    prefix: 'https://',
    placeholder: 'prom.example.com',
  },
};

export const WithSuffix: Story = {
  args: {
    label: 'Bucket name',
    suffix: '.s3.amazonaws.com',
    placeholder: 'my-bucket',
  },
};

export const WithPrefixAndSuffix: Story = {
  args: {
    label: 'Domain',
    prefix: 'https://',
    suffix: '.com',
    placeholder: 'example',
  },
};

export const PrefixCurrency: Story = {
  args: {
    label: 'Monthly budget',
    prefix: '€',
    suffix: '/ month',
    type: 'number',
    placeholder: '0',
  },
};

export const PrefixWithError: Story = {
  args: {
    label: 'Endpoint URL',
    prefix: 'https://',
    placeholder: 'prom.example.com',
    error: 'Host could not be reached.',
  },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md">
        <Input
          label="Search"
          placeholder="Type to filter…"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Value: <code>{v || '(empty)'}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TypingFiresOnChange: Story = {
  args: { label: 'Name', placeholder: 'Your name', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText('Name');
    await userEvent.type(input, 'Tom');
    // onChange called once per keystroke
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

export const PrefixTypingFiresOnChange: Story = {
  args: {
    label: 'Domain',
    prefix: 'https://',
    placeholder: 'example',
    onChange: fn(),
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByPlaceholderText('example');
    await userEvent.type(input, 'abc');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Email' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox'));
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Endpoint URL', error: 'Must start with https://' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox'), { token: '--color-red-500' });
  },
};

export const FocusShowsAccentBorderInLight: Story = {
  ...FocusShowsAccentBorderInDark,
  globals: { theme: 'light' },
};

export const ErrorFocusShowsRedBorderInLight: Story = {
  ...ErrorFocusShowsRedBorderInDark,
  globals: { theme: 'light' },
};

export const PrefixGroupFocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Endpoint URL', prefix: 'https://' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expectFocusBorder(input, { border: input.parentElement as HTMLElement });
  },
};

export const PrefixGroupErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Endpoint URL', prefix: 'https://', error: 'Must start with https://' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expectFocusBorder(input, {
      border: input.parentElement as HTMLElement,
      token: '--color-red-500',
    });
  },
};

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Must start with https://'));
  },
};

export const ErrorIsLinkedAsDescription: Story = {
  tags: ['!dev'],
  args: { label: 'Endpoint URL', error: 'Must start with https://' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Endpoint URL' });
    await expect(field).toHaveAccessibleDescription('Must start with https://');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const DescriptionIsLinked: Story = {
  tags: ['!dev'],
  args: { label: 'Endpoint URL', description: 'Full URL of the server.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Endpoint URL' });
    await expect(field).toHaveAccessibleDescription('Full URL of the server.');
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

// Native placeholders sat under 4.5:1 on light and sand (#151).
export const PlaceholderContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3">
      <Input label="Plain" placeholder="user@example.com" />
      <Input label="With prefix" prefix="https://" placeholder="prom.example.com" />
    </div>
  ),
  play: async ({ canvas }) => {
    const fields = [canvas.getByLabelText('Plain'), canvas.getByLabelText('With prefix')];
    inEachTheme(() => fields.forEach((field) => expectPlaceholderContrast(field)));
  },
};

export const ReadOnly: Story = {
  args: { label: 'API endpoint', defaultValue: 'https://prom.example.com', readOnly: true },
};

export const ReadOnlyWithPrefix: Story = {
  args: {
    label: 'API endpoint',
    prefix: 'https://',
    defaultValue: 'prom.example.com',
    readOnly: true,
  },
};

export const WithErrorIcon: Story = {
  args: {
    label: 'Endpoint URL',
    placeholder: 'https://prom.example.com',
    error: 'Must start with https://',
    errorIcon: true,
  },
};

export const WithErrorIconAndPrefix: Story = {
  args: {
    label: 'Endpoint URL',
    prefix: 'https://',
    error: 'Enter a valid host',
    errorIcon: true,
  },
};

export const ReadOnlyIsMutedAndFocusable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'API endpoint', defaultValue: 'https://prom.example.com', readOnly: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'API endpoint' });
    const white = document.createElement('div');
    white.className = 'bg-white dark:bg-gray-800';
    document.body.append(white);
    const editable = getComputedStyle(white).backgroundColor;
    white.remove();
    await expect(getComputedStyle(input).backgroundColor).not.toBe(editable);
    // Not disabled: it takes focus and keeps its value, which can't be typed over.
    await userEvent.click(input);
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'x');
    await expect(input).toHaveValue('https://prom.example.com');
  },
};

export const ErrorIconShowsOnlyOnError: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Endpoint URL', errorIcon: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).toBeNull();
  },
};

export const ErrorIconIsDecorative: Story = {
  tags: ['!dev', '!autodocs'],
  ...WithErrorIcon,
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('svg')!;
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    // The input keeps room for it: its text can't run under the icon.
    const input = canvasElement.querySelector('input')!;
    const pad = parseFloat(getComputedStyle(input).paddingRight);
    await expect(pad).toBeGreaterThanOrEqual(icon.getBoundingClientRect().width + 12);
  },
};
