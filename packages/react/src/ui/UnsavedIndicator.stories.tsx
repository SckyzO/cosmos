import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnsavedIndicator } from './UnsavedIndicator';

const meta = {
  title: 'Actions/Unsaved Indicator',
  component: UnsavedIndicator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { visible: true },
} satisfies Meta<typeof UnsavedIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = { args: { visible: true } };
export const Hidden: Story = { args: { visible: false } };
export const CustomLabel: Story = { args: { visible: true, label: 'Form has changed' } };
