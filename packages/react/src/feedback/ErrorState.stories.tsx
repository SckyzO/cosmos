import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ErrorState } from './ErrorState';

const meta = {
  title: 'Feedback/Error State',
  component: ErrorState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { message: 'Something went wrong.' },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { message: 'Failed to load data.' } };

export const WithRetry: Story = {
  args: { message: 'Failed to load data.', onRetry: () => {} },
};

export const RetryFiresHandler: Story = {
  args: { message: 'Failed to load data.', onRetry: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Try again/i }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};
