import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Home, Settings } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SearchInput } from '../forms/SearchInput';
import { Topbar } from '../layout/Topbar';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { CommandPalette } from './CommandPalette';
import { CommandPaletteTrigger } from './CommandPaletteTrigger';
import { isApplePlatform } from './hotkey';

const meta = {
  title: 'Overlays/Command Palette Trigger',
  component: CommandPaletteTrigger,
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
} satisfies Meta<typeof CommandPaletteTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

const dialog = () => document.querySelector('[cmdk-dialog]');

// The palette owns the hotkey and the open state; the trigger only opens it on a click.
const Palette = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => (
  <CommandPalette open={open} onOpenChange={onOpenChange}>
    <CommandPalette.Input placeholder="Search projects, tasks, docs…" />
    <CommandPalette.List>
      <CommandPalette.Empty>No matching results.</CommandPalette.Empty>
      <CommandPalette.Group heading="Go to">
        <CommandPalette.Item icon={Home} onSelect={() => onOpenChange(false)}>
          Overview
        </CommandPalette.Item>
        <CommandPalette.Item icon={FileText} onSelect={() => onOpenChange(false)}>
          Documents
        </CommandPalette.Item>
        <CommandPalette.Item icon={Settings} onSelect={() => onOpenChange(false)}>
          Settings
        </CommandPalette.Item>
      </CommandPalette.Group>
    </CommandPalette.List>
  </CommandPalette>
);

const InTopbar = ({ shortcut }: { shortcut?: string | null }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[var(--color-bg-base)]">
      <Topbar
        pageTitle="Projects"
        center={
          <div className="mx-auto max-w-md">
            <CommandPaletteTrigger
              placeholder="Search projects, tasks, docs"
              shortcut={shortcut}
              onClick={() => setOpen(true)}
            />
          </div>
        }
      />
      <Palette open={open} onOpenChange={setOpen} />
    </div>
  );
};

/** In the `Topbar`'s center slot, opening a `CommandPalette` on a click and on the hotkey. */
export const InTheTopbar: Story = {
  render: () => <InTopbar />,
};

/** The palette runs without a hotkey: the button shows no key hint. */
export const WithoutShortcut: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="max-w-md p-6">
        <CommandPaletteTrigger shortcut={null} onClick={() => setOpen(true)} />
        <CommandPalette open={open} onOpenChange={setOpen} hotkey={null}>
          <CommandPalette.Input placeholder="Search…" />
          <CommandPalette.List>
            <CommandPalette.Empty>No matching results.</CommandPalette.Empty>
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
};

export const WithoutShortcutChecks: Story = {
  ...WithoutShortcut,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Search…' });
    await expect(button.querySelector('kbd')).toBeNull();
    await expect(button).not.toHaveAttribute('aria-keyshortcuts');
  },
};

/** `size` follows the form fields: `sm`, `md` (default) and `lg`, next to a `SearchInput` of each. */
export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4 p-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <CommandPaletteTrigger size={size} />
          <SearchInput size={size} aria-label={`Search field, ${size}`} />
        </div>
      ))}
    </div>
  ),
};

export const SizesChecks: Story = {
  ...Sizes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    // Same height as the field of its size, so the two line up in a form or a bar.
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button', { name: /Search/ });
    const fields = canvas.getAllByRole('textbox');
    buttons.forEach((button, i) => {
      expect(button.getBoundingClientRect().height).toBe(fields[i].getBoundingClientRect().height);
      expect(getComputedStyle(button).borderTopColor).toBe(
        getComputedStyle(fields[i]).borderTopColor
      );
      expect(getComputedStyle(button).borderTopLeftRadius).toBe(
        getComputedStyle(fields[i]).borderTopLeftRadius
      );
    });
  },
};

/**
 * Below `sm` the button is a square icon button: the key hint is gone, the placeholder stays as
 * the accessible name.
 */
export const IconButtonOnAPhone: Story = {
  globals: mobileViewport,
  render: () => <InTopbar />,
};

export const IconButtonOnAPhoneChecks: Story = {
  ...IconButtonOnAPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: /Search projects/ });
    await expect(button).toHaveAccessibleName(/Search projects, tasks, docs/);
    await expect(getComputedStyle(button.querySelector('kbd')!).display).toBe('none');
    const box = button.getBoundingClientRect();
    await expect(box.width).toBe(box.height);
    expectNoHorizontalOverflow();
  },
};

/** Test: a click opens the palette and moves the focus into its field. */
export const ClickOpensThePalette: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <InTopbar />,
  play: async ({ canvasElement }) => {
    await expect(dialog()).toBeNull();
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Search projects/ }));
    await waitFor(() => expect(dialog()).not.toBeNull());
    await waitFor(() => expect(within(document.body).getByRole('combobox')).toHaveFocus());
  },
};

/**
 * Test: the hotkey opens the palette from anywhere, once. The trigger registers no listener of
 * its own: two listeners would toggle the palette open, then closed again.
 */
export const HotkeyOpensThePaletteOnce: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <InTopbar />,
  play: async () => {
    await expect(dialog()).toBeNull();
    await userEvent.keyboard(isApplePlatform() ? '{Meta>}k{/Meta}' : '{Control>}k{/Control}');
    await waitFor(() => expect(dialog()).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(dialog()).not.toBeNull();
  },
};

/** Test: the hint is `⌘K` on Apple platforms and `Ctrl K` elsewhere, and the button announces the keys. */
export const ShortcutHintFollowsThePlatform: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <InTopbar />,
  play: async ({ canvasElement }) => {
    const apple = isApplePlatform();
    const button = within(canvasElement).getByRole('button', { name: /Search projects/ });
    await expect(button.querySelector('kbd')).toHaveTextContent(apple ? '⌘K' : 'Ctrl K');
    await expect(button).toHaveAttribute('aria-keyshortcuts', apple ? 'Meta+K' : 'Control+K');
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  },
};
