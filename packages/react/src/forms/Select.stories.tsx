import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import {
  expectBorderToken,
  expectFocusBorder,
  expectRefFocuses,
  expectSuccessBorder,
  expectTextContrast,
  inEachTheme,
} from '../storybook-helpers';
import { FormRow } from './FormRow';
import { Select } from './Select';

const meta = {
  title: 'Forms/Select',
  component: Select,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [], onChange: () => {} },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const REGIONS = [
  { value: 'eu-west-1', label: 'eu-west-1' },
  { value: 'eu-west-3', label: 'eu-west-3' },
  { value: 'us-east-1', label: 'us-east-1' },
  { value: 'ap-south-1', label: 'ap-south-1', disabled: true },
];

export const Default: Story = {
  args: { label: 'Region', options: REGIONS, defaultValue: 'eu-west-1' },
};

export const WithDescription: Story = {
  args: {
    label: 'Region',
    options: REGIONS,
    defaultValue: 'eu-west-1',
    description: 'Where to deploy the agent.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Region',
    options: REGIONS,
    defaultValue: 'eu-west-1',
    error: 'Region not available in your plan.',
  },
};

const INTERVALS = [
  { value: '15', label: '15s' },
  { value: '30', label: '30s' },
  { value: '60', label: '1m' },
  { value: '300', label: '5m' },
];

/** A disabled, empty first option that shows while nothing is picked. */
export const Placeholder: Story = {
  args: { label: 'Region', options: REGIONS, placeholder: 'Choose a region' },
};

/**
 * `fullWidth={false}`: as wide as the widest option instead of the parent, for a
 * Select next to other controls (a FormRow, a toolbar).
 */
export const Inline: Story = {
  args: { label: 'Interval', options: INTERVALS, defaultValue: '30', fullWidth: false },
};

/** Owns the value: `onChange` gets the native event, the value is `event.target.value`. */
export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('30');
    return (
      <div>
        <Select
          label="Interval"
          options={INTERVALS}
          value={v}
          onChange={(e) => setV(e.target.value)}
          fullWidth={false}
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Current: <code>{v}</code>
        </p>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Interval' });
    await userEvent.selectOptions(select, '60');
    await expect(select).toHaveValue('60');
    await expect(canvas.getByText('60')).toBeInTheDocument();
  },
};

export const ChangingFiresOnChange: Story = {
  tags: ['!dev'],
  args: { label: 'Region', options: REGIONS, defaultValue: 'eu-west-1', onChange: fn() },
  play: async ({ args, canvas }) => {
    const select = canvas.getByLabelText('Region');
    await userEvent.selectOptions(select, 'us-east-1');
    await expect(args.onChange).toHaveBeenCalled();
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Region', options: REGIONS },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('combobox'));
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Region', options: REGIONS, error: 'Region not available.' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('combobox'), { token: '--color-red-500' });
  },
};

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Region not available in your plan.'));
  },
};

export const ErrorIsLinkedAsDescription: Story = {
  tags: ['!dev'],
  args: { label: 'Region', options: REGIONS, error: 'Region not available in your plan.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Region' });
    await expect(field).toHaveAccessibleDescription('Region not available in your plan.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const DescriptionIsLinked: Story = {
  tags: ['!dev'],
  args: { label: 'Region', options: REGIONS, description: 'Where to deploy the agent.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Region' });
    await expect(field).toHaveAccessibleDescription('Where to deploy the agent.');
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

/** Like any native field, `onChange` gets the change event of the `<select>`, not the value. */
export const OnChangeGetsTheNativeEvent: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Region', options: REGIONS, defaultValue: 'eu-west-1', onChange: fn() },
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Region' });
    await userEvent.selectOptions(select, 'us-east-1');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    const [event] = (args.onChange as ReturnType<typeof fn>).mock.calls[0] as [
      { type: string; target: HTMLSelectElement },
    ];
    await expect(event.type).toBe('change');
    await expect(event.target).toBe(select);
    await expect(event.target.value).toBe('us-east-1');
  },
};

/** With `defaultValue` the DOM owns the value: no `value` prop, yet picking sticks. */
export const DefaultValueIsUncontrolled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Region', options: REGIONS, defaultValue: 'eu-west-3' },
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Region' });
    await expect(select).toHaveValue('eu-west-3');
    await userEvent.selectOptions(select, 'us-east-1');
    await expect(select).toHaveValue('us-east-1');
  },
};

/** The placeholder is the selected option at first, but cannot be picked back. */
export const PlaceholderShowsUntilAnOptionIsPicked: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Region', options: REGIONS, placeholder: 'Choose a region' },
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Region' });
    await expect(select).toHaveValue('');
    await expect(select).toHaveDisplayValue('Choose a region');
    await expect(canvas.getByRole('option', { name: 'Choose a region' })).toBeDisabled();
    await userEvent.selectOptions(select, 'eu-west-3');
    await expect(select).toHaveDisplayValue('eu-west-3');
  },
};

/** A controlled Select shows the placeholder while its value is empty. */
export const PlaceholderShowsForAnEmptyControlledValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Region', options: REGIONS, placeholder: 'Choose a region', value: '' },
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Region' });
    await expect(select).toHaveDisplayValue('Choose a region');
  },
};

/** An explicit `defaultValue` wins over the placeholder. */
export const PlaceholderYieldsToDefaultValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Region',
    options: REGIONS,
    placeholder: 'Choose a region',
    defaultValue: 'eu-west-3',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Region' })).toHaveDisplayValue('eu-west-3');
  },
};

/** In a FormRow, a Select without a `label` is named and described by the row. */
export const FormRowNamesAndDescribesIt: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <FormRow label="Default interval" description="Time between refreshes">
      <Select options={INTERVALS} defaultValue="30" fullWidth={false} />
    </FormRow>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Default interval' });
    await expect(field).toHaveAccessibleDescription('Time between refreshes');
    await expect(field).toHaveAttribute('aria-labelledby', canvas.getByText('Default interval').id);
  },
};

/**
 * Its own label names it, and its own error comes first in the description,
 * before the row's.
 */
export const FormRowKeepsTheOwnLabelAndError: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <FormRow label="Row label" description="Row description">
      <Select
        label="Region"
        options={REGIONS}
        defaultValue="eu-west-1"
        error="Region not available."
        fullWidth={false}
      />
    </FormRow>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Region' });
    await expect(field).not.toHaveAttribute('aria-labelledby');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription('Region not available. Row description');
    const [errorId] = (field.getAttribute('aria-describedby') ?? '').split(' ');
    await expect(canvas.getByText('Region not available.')).toHaveAttribute('id', errorId);
  },
};

/** An explicit `aria-label` names it instead of the row, and the row still describes it. */
export const ExplicitAriaLabelWinsOverTheRow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <FormRow label="Row label" description="Row description">
      <Select options={INTERVALS} defaultValue="30" aria-label="Interval" fullWidth={false} />
    </FormRow>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Interval' });
    await expect(field).not.toHaveAttribute('aria-labelledby');
    await expect(field).toHaveAccessibleDescription('Row description');
  },
};

/** An `aria-describedby` passed in is read after the select's own description. */
export const ExplicitDescribedByFollowsTheDescription: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <Select
        label="Region"
        options={REGIONS}
        description="Where to deploy the agent."
        aria-describedby="extra"
      />
      <p id="extra">Billed per region.</p>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Region' })).toHaveAccessibleDescription(
      'Where to deploy the agent. Billed per region.'
    );
  },
};

/** Default: fills its parent. `fullWidth={false}`: as wide as its options. */
export const FullWidthControlsTheLayout: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-96" data-testid="parent">
      <Select label="Full" options={INTERVALS} />
      <Select label="Inline" options={INTERVALS} fullWidth={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const parent = canvas.getByTestId('parent').getBoundingClientRect().width;
    const full = canvas.getByRole('combobox', { name: 'Full' }).getBoundingClientRect().width;
    const inline = canvas.getByRole('combobox', { name: 'Inline' }).getBoundingClientRect().width;
    await expect(full).toBeCloseTo(parent, 0);
    await expect(inline).toBeLessThan(parent / 2);
  },
};

const selectRef = createRef<HTMLSelectElement>();

/** The ref gets the native `<select>`, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Select ref={selectRef} options={INTERVALS} defaultValue="30" aria-label="Interval" />
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(selectRef, canvas.getByRole('combobox', { name: 'Interval' }));
  },
};

// ── Success (#405) ───────────────────────────────────────────────────────────

/**
 * `success` is the message under the field once its choice is valid: a green border and message,
 * and a check icon beside the chevron. `error` wins when both are set.
 */
export const WithSuccess: Story = {
  args: {
    label: 'Region',
    options: REGIONS,
    defaultValue: 'eu-west-3',
    success: 'Available in your plan.',
  },
};

export const SuccessIsLinkedAndAnnounced: Story = {
  ...WithSuccess,
  tags: ['!dev'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Region' });
    const message = canvas.getByText('Available in your plan.');
    await expect(field).toHaveAccessibleDescription('Available in your plan.');
    await expect(field.getAttribute('aria-describedby')).toBe(message.id);
    await expect(message.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
    // A valid choice is not an invalid one: nothing marks the field as such.
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

export const ErrorWinsOverSuccess: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: {
    label: 'Region',
    options: REGIONS,
    defaultValue: 'eu-west-3',
    error: 'Region not available in your plan.',
    success: 'Available in your plan.',
  },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole('combobox', { name: 'Region' });
    await expect(field).toHaveAccessibleDescription('Region not available in your plan.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.queryByText('Available in your plan.')).toBeNull();
    await expect(canvas.getByText('Region not available in your plan.')).not.toHaveAttribute(
      'aria-live'
    );
    // The border stays red, and only the chevron is drawn.
    expectBorderToken(field, '--color-red-400');
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(1);
  },
};

export const SuccessColorsInEveryTheme: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Region' });
    const message = canvas.getByText('Available in your plan.');
    expectSuccessBorder(field);
    inEachTheme(() => expectTextContrast(message));
  },
};

export const SuccessFocusShowsAccentBorderInDark: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('combobox', { name: 'Region' }));
  },
};

/** In each size the check clears the chevron, and the selected text clears the check. */
export const SuccessIconSitsBesideTheChevron: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Select
          key={size}
          size={size}
          aria-label={size}
          options={REGIONS}
          defaultValue="eu-west-3"
          success="Available."
        />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const size of ['sm', 'md', 'lg']) {
      const select = canvas.getByRole('combobox', { name: size });
      // The check is drawn first, the chevron after it.
      const [check, chevron] = Array.from(select.parentElement!.querySelectorAll('svg'));
      await expect(check).toHaveAttribute('aria-hidden', 'true');
      const box = select.getBoundingClientRect();
      const c = check.getBoundingClientRect();
      const v = chevron.getBoundingClientRect();
      await expect(v.left - c.right, `${size}: gap between the icons`).toBeCloseTo(6, 0);
      await expect(c.top + c.height / 2, `${size}: vertical centre`).toBeCloseTo(
        v.top + v.height / 2,
        0
      );
      const pad = parseFloat(getComputedStyle(select).paddingRight);
      await expect(pad, `${size}: the text clears the check`).toBeGreaterThanOrEqual(
        box.right - c.left
      );
    }
  },
};

/** Without `success` the field is what it was: neutral border, the chevron alone, no live region. */
export const NoSuccessKeepsTheNeutralLook: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: {
    label: 'Region',
    options: REGIONS,
    defaultValue: 'eu-west-1',
    description: 'Where to deploy the agent.',
  },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole('combobox', { name: 'Region' });
    expectBorderToken(field, '--color-gray-200');
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(1);
    await expect(parseFloat(getComputedStyle(field).paddingRight)).toBe(36);
    await expect(canvas.getByText('Where to deploy the agent.')).not.toHaveAttribute('aria-live');
  },
};
