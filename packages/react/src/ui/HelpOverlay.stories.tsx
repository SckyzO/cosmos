import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  endOffset,
  expectReadsLeftToRight,
  inDirection,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { Button } from './Button';
import { Drawer } from './Drawer';
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
  render: () => (
    <HelpOverlay open onOpenChange={() => undefined}>
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
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
          Need more help?{' '}
          <a className="text-brand-600 dark:text-brand-400 hover:underline">
            Read the docs{' '}
            <span aria-hidden className="inline-block rtl:-scale-x-100">
              →
            </span>
          </a>
        </span>
      }
    >
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const HotkeyOpensOverlay: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-sm text-gray-500 dark:text-gray-400">Press ? to open</p>
      <HelpOverlay>{SAMPLE_SHORTCUTS}</HelpOverlay>
    </div>
  ),
  play: async () => {
    const canvas = within(document.body);
    // Send `?` at the document level (the hotkey listener is on document).
    await userEvent.keyboard('?');
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
      expect(canvas.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
    });
  },
};

export const EscapeClosesOverlay: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <HelpOverlay open={open} onOpenChange={setOpen}>
        {SAMPLE_SHORTCUTS}
      </HelpOverlay>
    );
  },
  play: async () => {
    const canvas = within(document.body);
    await waitFor(() => expect(canvas.getByRole('dialog')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/** Opened over a drawer, the overlay closes on Escape and the drawer stays until the next one. */
export const EscapeOverADrawerClosesOnlyTheOverlay: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [drawer, setDrawer] = useState(true);
    return (
      <>
        <Drawer open={drawer} onClose={() => setDrawer(false)}>
          <Drawer.Header title="Filters" />
        </Drawer>
        <HelpOverlay>{SAMPLE_SHORTCUTS}</HelpOverlay>
      </>
    );
  },
  play: async () => {
    const body = within(document.body);
    await body.findByRole('dialog', { name: 'Filters' });
    await userEvent.keyboard('?');
    await body.findByRole('dialog', { name: 'Keyboard shortcuts' });

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: 'Keyboard shortcuts' })).toBeNull()
    );
    await expect(body.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filters' })).toBeNull());
  },
};

export const CloseButtonClosesOverlay: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() } as never,
  render: (args) => (
    <HelpOverlay open onOpenChange={args.onOpenChange as (open: boolean) => void}>
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
  play: async ({ args }) => {
    const canvas = within(document.body);
    const closeBtn = canvas.getByRole('button', { name: /close keyboard shortcuts/i });
    await userEvent.click(closeBtn);
    await waitFor(() =>
      expect(
        (args as unknown as { onOpenChange: ReturnType<typeof fn> }).onOpenChange
      ).toHaveBeenCalledWith(false)
    );
  },
};

export const HotkeyIgnoredWhileTypingInInput: Story = {
  tags: ['!dev', '!autodocs'],
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
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).toHaveValue('?');
  },
};

/** Focus moves into the open overlay and Tab cannot leave it. */
export const FocusIsTrapped: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="p-6">
      <Button variant="secondary">Page button</Button>
      <HelpOverlay open onOpenChange={() => undefined}>
        {SAMPLE_SHORTCUTS}
      </HelpOverlay>
    </div>
  ),
  play: async () => {
    const dialog = within(document.body).getByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    for (let i = 0; i < 3; i++) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
  },
};

// ── Open state (#151) ────────────────────────────────────────────────────────
// `open` / `defaultOpen` / `onOpenChange`, only `undefined` meaning uncontrolled.
// `defaultOpen` starts it open and it closes on its own; held at a fixed `open`,
// it reports what the user asks for and keeps the state it is given.

export const DefaultOpenClosesOnItsOwn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() } as never,
  render: (args) => (
    <HelpOverlay
      defaultOpen
      onOpenChange={(args as unknown as { onOpenChange: (open: boolean) => void }).onOpenChange}
    >
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
  play: async ({ args }) => {
    const body = within(document.body);
    await waitFor(() => expect(body.getByRole('dialog')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    await expect(
      (args as unknown as { onOpenChange: ReturnType<typeof fn> }).onOpenChange
    ).toHaveBeenCalledWith(false);
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

/**
 * A shortcut row has its description at the start and its keys at the end, and the keys keep
 * the order they are pressed in, with the title and description in their own order.
 */
export const KeysKeepTheirOrderInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <HelpOverlay
      open
      onOpenChange={() => undefined}
      title="Shortcuts (3 of 5)."
      description="Press them (1-5)."
    >
      {SAMPLE_SHORTCUTS}
    </HelpOverlay>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, () => {
        const row = within(dialog).getByText('Redo').closest('li')!;
        const keys = row.querySelector<HTMLElement>('[dir="ltr"]')!;
        expect(endOffset(keys, row)).toBeLessThan(startOffset(keys, row));
        expectReadsLeftToRight(keys);
        const sequence = within(dialog)
          .getByText('Go to home')
          .closest('li')!
          .querySelector<HTMLElement>('[dir="ltr"]')!;
        expectReadsLeftToRight(sequence);
        expectReadsLeftToRight(within(dialog).getByText('Shortcuts (3 of 5).').closest('h2')!);
        expectReadsLeftToRight(within(dialog).getByText('Press them (1-5).').closest('p')!);
      });
    }
  },
};
