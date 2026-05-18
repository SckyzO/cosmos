import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Button } from './Button';
import { Toaster, toast } from './Toast';

const meta = {
  title: 'Feedback/Toast',
  component: Toaster,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// Each story embeds its own <Toaster /> so multiple stories on one page can coexist.

export const BasicToast: Story = {
  render: () => (
    <>
      <Button onClick={() => toast('Settings updated.')}>Show toast</Button>
      <Toaster />
    </>
  ),
};

export const StatusVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toast.info('FYI: a new version is available.')}>
        Info
      </Button>
      <Button variant="secondary" onClick={() => toast.success('Backup completed!')}>
        Success
      </Button>
      <Button variant="secondary" onClick={() => toast.warning('Disk space low.')}>
        Warning
      </Button>
      <Button variant="secondary" onClick={() => toast.error('Could not save changes.')}>
        Error
      </Button>
      <Toaster />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <>
      <Button
        onClick={() =>
          toast.success('Backup completed', {
            description: '3.2 GB transferred to S3 in 8.4 s.',
          })
        }
      >
        Show with description
      </Button>
      <Toaster />
    </>
  ),
};

export const WithAction: Story = {
  render: () => (
    <>
      <Button
        onClick={() =>
          toast('Email moved to Trash.', {
            action: {
              label: 'Undo',
              onClick: () => toast.success('Restored!'),
            },
          })
        }
      >
        Show with Undo
      </Button>
      <Toaster />
    </>
  ),
};

export const PromiseFlow: Story = {
  render: () => (
    <>
      <Button
        onClick={() => {
          const promise = new Promise<{ items: number }>((resolve, reject) =>
            window.setTimeout(() => {
              if (Math.random() > 0.3) resolve({ items: 42 });
              else reject(new Error('Network down'));
            }, 1500)
          );
          toast.promise(promise, {
            loading: 'Syncing nodes…',
            success: (data) => `Synced ${data.items} nodes.`,
            error: (err) => `Sync failed: ${err.message}`,
          });
        }}
      >
        Run async task
      </Button>
      <Toaster />
    </>
  ),
};

export const LongDuration: Story = {
  render: () => (
    <>
      <Button
        onClick={() =>
          toast.warning('Sticky for 10 s.', {
            duration: 10_000,
          })
        }
      >
        10s warning
      </Button>
      <Toaster />
    </>
  ),
};

export const TopCenter: Story = {
  render: () => (
    <>
      <Button onClick={() => toast.info('Hello from the top!')}>Top center toast</Button>
      <Toaster position="top-center" />
    </>
  ),
};

export const Stacked: Story = {
  render: () => (
    <>
      <Button
        onClick={() => {
          toast.success('First');
          window.setTimeout(() => toast.info('Second'), 200);
          window.setTimeout(() => toast.warning('Third'), 400);
          window.setTimeout(() => toast.error('Fourth'), 600);
        }}
      >
        Trigger 4 toasts
      </Button>
      <Toaster />
    </>
  ),
};

export const ProgrammaticDismiss: Story = {
  render: () => {
    const [id, setId] = useState<string | number | null>(null);
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => {
            const newId = toast.loading('Long-running task…', { duration: 30_000 });
            setId(newId);
          }}
        >
          Start task
        </Button>
        <Button
          variant="secondary"
          disabled={!id}
          onClick={() => {
            if (id !== null) {
              toast.dismiss(id);
              setId(null);
            }
          }}
        >
          Dismiss it
        </Button>
        <Toaster />
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickShowsToast: Story = {
  render: () => (
    <>
      <Button onClick={() => toast('Clicked')}>Trigger</Button>
      <Toaster />
    </>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    // Sonner renders into a portal at the end of <body>; query document.
    await waitFor(() => expect(document.querySelector('[data-sonner-toaster]')).not.toBeNull());
    await waitFor(() => expect(document.body.textContent || '').toMatch(/Clicked/));
  },
};

export const ActionFiresHandler: Story = {
  render: (args) => {
    const extra = args as unknown as { onUndo: () => void };
    return (
      <>
        <Button
          onClick={() =>
            toast('With action', {
              action: { label: 'Undo', onClick: extra.onUndo },
            })
          }
        >
          Trigger
        </Button>
        <Toaster />
      </>
    );
  },
  args: { onUndo: fn() } as never,
  play: async ({ args, canvas }) => {
    const extra = args as unknown as { onUndo: ReturnType<typeof fn> };
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    await waitFor(() => {
      const undoBtn = document.querySelector('button[data-button]');
      expect(undoBtn).not.toBeNull();
    });
    const undoBtn = document.querySelector('button[data-button]') as HTMLButtonElement;
    await userEvent.click(undoBtn);
    await expect(extra.onUndo).toHaveBeenCalledTimes(1);
  },
};
