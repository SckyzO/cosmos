import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
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
