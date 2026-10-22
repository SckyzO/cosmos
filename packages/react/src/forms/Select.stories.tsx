import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { expectFocusBorder, expectTextContrast } from '../storybook-helpers';
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

export const ChangingFiresOnChange: Story = {
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
