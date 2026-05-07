import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingState } from './LoadingState';

const meta = {
  title: 'Feedback/Loading State',
  component: LoadingState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CustomMessage: Story = { args: { message: 'Fetching alerts…' } };
