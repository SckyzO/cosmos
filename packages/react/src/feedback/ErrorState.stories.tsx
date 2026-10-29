import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
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
  args: { message: 'Failed to load data.', onRetry: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Try again/i }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

/** A way out that is not a retry: the record is gone, trying again will not bring it back. */
export const WithAction: Story = {
  args: {
    title: 'This ticket does not exist.',
    description: 'It may have been deleted, or the link is wrong.',
    action: (
      <Button variant="secondary" size="sm" icon={ArrowLeft}>
        Back to tickets
      </Button>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Back to tickets' })).toBeInTheDocument();
    // No `onRetry`: no retry button.
    await expect(canvas.queryByRole('button', { name: /Try again/i })).toBeNull();
  },
};

/** Both buttons side by side, the retry first. */
export const WithRetryAndAction: Story = {
  args: {
    title: 'Failed to load the ticket.',
    onRetry: fn(),
    retryLabel: 'Reload',
    action: (
      <Button variant="secondary" size="sm" icon={ArrowLeft}>
        Back to tickets
      </Button>
    ),
  },
};

export const RetryLabelAndActionRender: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    title: 'Failed to load the ticket.',
    onRetry: fn(),
    retryLabel: 'Reload',
    action: <button type="button">Back to tickets</button>,
  },
  play: async ({ args, canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Try again' })).toBeNull();
    const retry = canvas.getByRole('button', { name: 'Reload' });
    const action = canvas.getByRole('button', { name: 'Back to tickets' });
    // Side by side, on one row.
    await expect(
      Math.abs(retry.getBoundingClientRect().top - action.getBoundingClientRect().top)
    ).toBeLessThan(retry.getBoundingClientRect().height);
    await userEvent.click(retry);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};
