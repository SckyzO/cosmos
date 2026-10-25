import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

const meta = {
  title: 'Feedback/States',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ compact }: { compact?: boolean }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div className="rounded-xl border border-[var(--color-border)]">
      <EmptyState
        compact={compact}
        title="No items yet"
        description="Create your first item to get started."
        action={
          <Button size="sm" icon={Plus}>
            New item
          </Button>
        }
      />
    </div>
    <div className="rounded-xl border border-[var(--color-border)]">
      <ErrorState
        compact={compact}
        title="Failed to load data"
        description="The server did not answer in time."
        onRetry={() => undefined}
      />
    </div>
    <div className="rounded-xl border border-[var(--color-border)]">
      <LoadingState
        compact={compact}
        title="Fetching alerts…"
        description="This can take a moment."
      />
    </div>
  </div>
);

/** Empty, error and loading share one layout: tile, title, description, action. */
export const SideBySide: Story = { render: () => <Row /> };

/** `compact` for a card or a table body. */
export const SideBySideCompact: Story = { render: () => <Row compact /> };

// ── Interaction tests ────────────────────────────────────────────────────────

/** Loading is a status, error an alert, empty static; the spinner is not announced a second time. */
export const RolesMatchTheState: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <EmptyState title="empty state" />
      <ErrorState title="error state" />
      <LoadingState title="loading state" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('loading state');
    await expect(canvas.getAllByRole('status')).toHaveLength(1);
    await expect(canvas.getByRole('alert')).toHaveTextContent('error state');
    await expect(canvas.getByText('empty state').closest('[role]')).toBeNull();
  },
};

const onRetry = fn();

/** The retry is a real button and reports the click. */
export const RetryIsAButton: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ErrorState title="Failed" onRetry={onRetry} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(onRetry).toHaveBeenCalledTimes(1);
  },
};

/** `message` still works as the title, and `title` wins when both are set. */
export const MessageStaysAnAlias: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <ErrorState message="legacy error" />
      <ErrorState title="new title" message="ignored" />
      <LoadingState message="legacy loading" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('legacy error')).toBeVisible();
    await expect(canvas.getByText('new title')).toBeVisible();
    await expect(canvas.queryByText('ignored')).toBeNull();
    await expect(canvas.getByRole('status')).toHaveTextContent('legacy loading');
  },
};

/** `compact` tightens the spacing. */
export const CompactTightensSpacing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <EmptyState title="roomy" />
      <EmptyState title="tight" compact />
    </div>
  ),
  play: async ({ canvas }) => {
    const box = (label: string) =>
      canvas.getByText(label).closest('p')!.parentElement!.parentElement!;
    await expect(box('roomy')).toHaveClass('py-12');
    await expect(box('tight')).toHaveClass('py-6');
  },
};
