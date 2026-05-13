import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { Button } from './Button';
import { HelpOverlay } from './HelpOverlay';

const meta = {
  title: 'Overlays/Help Overlay',
  component: HelpOverlay,
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof HelpOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_SHORTCUTS = (
  <>
    <HelpOverlay.Section title="Navigation">
      <HelpOverlay.Shortcut keys="mod+k" description="Open command palette" />
      <HelpOverlay.Shortcut keys="/" description="Focus search" />
      <HelpOverlay.Shortcut keys={['g', 'h']} description="Go to home" />
      <HelpOverlay.Shortcut keys={['g', 'd']} description="Go to dashboard" />
      <HelpOverlay.Shortcut keys={['g', 's']} description="Go to settings" />
    </HelpOverlay.Section>
    <HelpOverlay.Section title="Editing">
      <HelpOverlay.Shortcut keys="mod+s" description="Save changes" />
      <HelpOverlay.Shortcut keys="mod+z" description="Undo" />
      <HelpOverlay.Shortcut keys="mod+shift+z" description="Redo" />
      <HelpOverlay.Shortcut keys="mod+enter" description="Submit form" />
    </HelpOverlay.Section>
    <HelpOverlay.Section title="View">
      <HelpOverlay.Shortcut keys="mod+b" description="Toggle sidebar" />
      <HelpOverlay.Shortcut keys="mod+." description="Toggle theme" />
      <HelpOverlay.Shortcut keys="?" description="Show this help overlay" />
    </HelpOverlay.Section>
    <HelpOverlay.Section title="Selection">
      <HelpOverlay.Shortcut keys="mod+a" description="Select all" />
      <HelpOverlay.Shortcut keys="shift+arrowdown" description="Extend down" />
      <HelpOverlay.Shortcut keys="escape" description="Clear selection" />
    </HelpOverlay.Section>
  </>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <HelpOverlay open onOpenChange={() => undefined}>{SAMPLE_SHORTCUTS}</HelpOverlay>,
};

export const WithDescription: Story = {
  render: () => (
    <HelpOverlay
      open
      onOpenChange={() => undefined}
      description="Press the listed combos to navigate and act faster."
    >
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
};

export const Uncontrolled: Story = {
  render: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="space-y-3 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Press <kbd className="rounded border px-1.5">?</kbd> to open
        </p>
        <HelpOverlay>{SAMPLE_SHORTCUTS}</HelpOverlay>
      </div>
    </div>
  ),
};

export const ControlledByButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="space-y-3 text-center">
          <Button onClick={() => setOpen(true)}>Show shortcuts</Button>
          <HelpOverlay open={open} onOpenChange={setOpen}>
            {SAMPLE_SHORTCUTS}
          </HelpOverlay>
        </div>
      </div>
    );
  },
};

export const CustomHotkey: Story = {
  render: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="space-y-3 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Press <kbd className="rounded border px-1.5">⌘</kbd>+
          <kbd className="rounded border px-1.5">/</kbd> to open
        </p>
        <HelpOverlay hotkey="mod+/">{SAMPLE_SHORTCUTS}</HelpOverlay>
      </div>
    </div>
  ),
};

export const CustomFooter: Story = {
  render: () => (
    <HelpOverlay
      open
      onOpenChange={() => undefined}
      footer={
        <span className="flex items-center gap-2">
          Need more help? <a className="text-brand-600 hover:underline">Read the docs →</a>
        </span>
      }
    >
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const HotkeyOpensOverlay: Story = {
  render: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-sm text-gray-500">Press ? to open</p>
      <HelpOverlay>{SAMPLE_SHORTCUTS}</HelpOverlay>
    </div>
  ),
  play: async ({ canvas }) => {
    // Send `?` at the document level (the hotkey listener is on document).
    await userEvent.keyboard('?');
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
      expect(canvas.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
    });
  },
};

export const EscapeClosesOverlay: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <HelpOverlay open={open} onOpenChange={setOpen}>
        {SAMPLE_SHORTCUTS}
      </HelpOverlay>
    );
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('dialog')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(canvas.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

export const CloseButtonClosesOverlay: Story = {
  args: { onOpenChange: fn() } as never,
  render: (args) => (
    <HelpOverlay open onOpenChange={args.onOpenChange as (open: boolean) => void}>
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
  play: async ({ args, canvas }) => {
    const closeBtn = canvas.getByRole('button', { name: /close keyboard shortcuts/i });
    await userEvent.click(closeBtn);
    await waitFor(() =>
      expect(
        (args as unknown as { onOpenChange: ReturnType<typeof fn> }).onOpenChange,
      ).toHaveBeenCalledWith(false),
    );
  },
};

export const HotkeyIgnoredWhileTypingInInput: Story = {
  render: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
      <input
        type="text"
        placeholder="Type ? here…"
        defaultValue=""
        className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
      />
      <HelpOverlay>{SAMPLE_SHORTCUTS}</HelpOverlay>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByPlaceholderText(/type \? here/i);
    await userEvent.click(input);
    await userEvent.keyboard('?');
    // Focused input → hotkey skipped → no dialog rendered.
    expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).toHaveValue('?');
  },
};
