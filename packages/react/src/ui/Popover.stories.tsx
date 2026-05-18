import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { HelpCircle, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { Button } from './Button';
import { Popover, type PopoverPosition } from './Popover';

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  parameters: portalDocsParams.sm(),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors">
          Open popover
        </Popover.Trigger>
        <Popover.Content>
          <p>This is a basic popover.</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="grid h-72 grid-cols-2 place-items-center gap-12">
      {(['top', 'right', 'bottom', 'left'] as PopoverPosition[]).map((pos) => (
        <Popover key={pos} defaultOpen>
          <Popover.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            {pos}
          </Popover.Trigger>
          <Popover.Content position={pos} arrow width="w-40">
            <p className="text-xs">Position: {pos}</p>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
};

export const RichContent: Story = {
  render: () => (
    <div className="flex h-72 items-center justify-center">
      <Popover>
        <Popover.Trigger className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200">
          <HelpCircle className="h-5 w-5" />
        </Popover.Trigger>
        <Popover.Content position="bottom" arrow width="w-72">
          <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Need help?</h4>
          <p className="mb-3 text-xs text-gray-600 dark:text-gray-300">
            Read the docs or contact support — we usually reply within a few hours.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm">
              Docs
            </Button>
            <Button variant="primary" size="sm">
              Contact
            </Button>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const ActionsMenu: Story = {
  render: () => (
    <div className="flex h-72 items-center justify-center">
      <Popover>
        <Popover.Trigger className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200">
          <MoreVertical className="h-4 w-4" />
        </Popover.Trigger>
        <Popover.Content position="bottom" width="w-48" className="p-0">
          <ul className="py-1">
            <li>
              <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5">
                Rename
              </button>
            </li>
            <li>
              <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5">
                Duplicate
              </button>
            </li>
            <li>
              <hr className="my-1 border-gray-100 dark:border-gray-800" />
            </li>
            <li>
              <button className="block w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                Delete
              </button>
            </li>
          </ul>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            Open ({open ? 'on' : 'off'})
          </Popover.Trigger>
          <Popover.Content arrow>
            <p className="text-xs">Externally controlled popover.</p>
          </Popover.Content>
        </Popover>
        <button onClick={() => setOpen((o) => !o)} className="text-brand-500 text-xs underline">
          Toggle from outside
        </button>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TriggerOpensCloses: Story = {
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Click</Popover.Trigger>
        <Popover.Content>
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Click' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};

export const EscapeCloses: Story = {
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Open</Popover.Trigger>
        <Popover.Content>
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};

export const OnOpenChangeFires: Story = {
  render: (args) => (
    <div className="flex h-48 items-center justify-center">
      <Popover onOpenChange={args.onOpenChange as (o: boolean) => void}>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Trigger</Popover.Trigger>
        <Popover.Content>
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  args: { onOpenChange: fn() } as never,
  play: async ({ args, canvas }) => {
    const extra = args as unknown as { onOpenChange: ReturnType<typeof fn> };
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    await expect(extra.onOpenChange).toHaveBeenCalledWith(true);
  },
};
