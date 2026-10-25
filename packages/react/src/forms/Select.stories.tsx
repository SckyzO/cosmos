import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectFocusBorder, expectRefFocuses, expectTextContrast } from '../storybook-helpers';
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
