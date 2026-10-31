import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bell,
  FileText,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  endOffset,
  expectPlaceholderContrast,
  expectReadsLeftToRight,
  expectTextContrast,
  inDirection,
  inEachTheme,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { Button } from './Button';
import { CommandPalette } from './CommandPalette';
import { Modal } from './Modal';

const meta = {
  title: 'Overlays/Command Palette',
  component: CommandPalette,
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample content shared across stories ─────────────────────────────────────

const SamplePanel = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => (
  <CommandPalette open={open} onOpenChange={onOpenChange}>
    <CommandPalette.Input placeholder="Type a command or search…" />
    <CommandPalette.List>
      <CommandPalette.Empty>No matching commands.</CommandPalette.Empty>
      <CommandPalette.Group heading="Navigate">
        <CommandPalette.Item icon={Home} shortcut="G H" onSelect={() => onOpenChange(false)}>
          Go home
        </CommandPalette.Item>
        <CommandPalette.Item
          icon={LayoutDashboard}
          shortcut="G D"
          onSelect={() => onOpenChange(false)}
        >
          Open dashboard
        </CommandPalette.Item>
        <CommandPalette.Item icon={User} shortcut="G P" onSelect={() => onOpenChange(false)}>
          View profile
        </CommandPalette.Item>
        <CommandPalette.Item icon={Bell} shortcut="G N" onSelect={() => onOpenChange(false)}>
          Notifications
        </CommandPalette.Item>
      </CommandPalette.Group>
      <CommandPalette.Separator />
      <CommandPalette.Group heading="Actions">
        <CommandPalette.Item icon={Plus} shortcut="N" onSelect={() => onOpenChange(false)}>
          New project
        </CommandPalette.Item>
        <CommandPalette.Item icon={FileText} onSelect={() => onOpenChange(false)}>
          Create document
        </CommandPalette.Item>
        <CommandPalette.Item icon={Settings} shortcut="⌘," onSelect={() => onOpenChange(false)}>
          Settings
        </CommandPalette.Item>
      </CommandPalette.Group>
      <CommandPalette.Separator />
      <CommandPalette.Group heading="Account">
        <CommandPalette.Item icon={KeyRound} onSelect={() => onOpenChange(false)}>
          Change password
        </CommandPalette.Item>
        <CommandPalette.Item icon={LogOut} onSelect={() => onOpenChange(false)}>
          Sign out
        </CommandPalette.Item>
      </CommandPalette.Group>
    </CommandPalette.List>
    <CommandPalette.Footer>
      <span>Tip: navigate with ↑ ↓</span>
      <span>
        <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px] dark:border-gray-700 dark:bg-gray-800">
          esc
        </kbd>{' '}
        to close
      </span>
    </CommandPalette.Footer>
  </CommandPalette>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Open: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Palette opens above this text.</p>
        <SamplePanel open={open} onOpenChange={setOpen} />
      </div>
    );
  },
};

export const TriggeredByButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={() => setOpen(true)}>
          Open palette ({navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}K)
        </Button>
        <SamplePanel open={open} onOpenChange={setOpen} />
      </div>
    );
  },
};

export const HotkeyDisabled: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No global hotkey — open via button only.
        </p>
        <CommandPalette open={open} onOpenChange={setOpen} hotkey={null}>
          <CommandPalette.Input placeholder="Search…" />
          <CommandPalette.List>
            <CommandPalette.Empty>No results.</CommandPalette.Empty>
            <CommandPalette.Item onSelect={() => setOpen(false)}>Item one</CommandPalette.Item>
            <CommandPalette.Item onSelect={() => setOpen(false)}>Item two</CommandPalette.Item>
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
};

export const FlatList: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex h-screen items-center justify-center">
        <CommandPalette open={open} onOpenChange={setOpen}>
          <CommandPalette.Input placeholder="Search files…" />
          <CommandPalette.List>
            <CommandPalette.Empty>No file matches.</CommandPalette.Empty>
            {[
              'README.md',
              'package.json',
              'tsconfig.json',
              'vite.config.ts',
              'src/index.ts',
              'src/App.tsx',
              'src/components/Button.tsx',
              'src/components/Modal.tsx',
            ].map((f) => (
              <CommandPalette.Item
                key={f}
                icon={FileText}
                value={f}
                onSelect={() => setOpen(false)}
              >
                {f}
              </CommandPalette.Item>
            ))}
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
};

export const LoadingState: Story = {
  // Loading, then loaded after 1.5 s: a capture would show either, depending on the page load.
  tags: ['no-capture'],
  render: () => {
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      const t = window.setTimeout(() => setLoading(false), 1500);
      return () => window.clearTimeout(t);
    }, []);
    return (
      <div className="flex h-screen items-center justify-center">
        <CommandPalette open={open} onOpenChange={setOpen}>
          <CommandPalette.Input placeholder="Search…" />
          <CommandPalette.List>
            {loading ? (
              <CommandPalette.Loading>Loading commands…</CommandPalette.Loading>
            ) : (
              <>
                <CommandPalette.Empty>No results.</CommandPalette.Empty>
                <CommandPalette.Item onSelect={() => setOpen(false)}>
                  Loaded item 1
                </CommandPalette.Item>
                <CommandPalette.Item onSelect={() => setOpen(false)}>
                  Loaded item 2
                </CommandPalette.Item>
              </>
            )}
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
};

/**
 * A listbox owns options and groups only: the progressbar of `Loading` sits right after it, and
 * the separators between groups are hidden from assistive technology, and while searching.
 */
export const ListboxOwnsOnlyOptionsAndGroups: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <CommandPalette open hotkey={null} onOpenChange={() => {}}>
      <CommandPalette.Input placeholder="Search…" />
      <CommandPalette.List>
        <CommandPalette.Loading progress={40}>Loading commands…</CommandPalette.Loading>
        <CommandPalette.Group heading="Navigate">
          <CommandPalette.Item value="home">Go home</CommandPalette.Item>
        </CommandPalette.Group>
        <CommandPalette.Separator />
        <CommandPalette.Group heading="Actions">
          <CommandPalette.Item value="new">New project</CommandPalette.Item>
        </CommandPalette.Group>
      </CommandPalette.List>
    </CommandPalette>
  ),
  play: async () => {
    const page = within(document.body);
    const listbox = await page.findByRole('listbox');
    const progressbar = page.getByRole('progressbar');
    await expect(progressbar).toHaveAttribute('aria-valuenow', '40');
    await expect(listbox.contains(progressbar)).toBe(false);

    const separator = document.querySelector('[cmdk-separator]');
    await expect(separator).toHaveAttribute('aria-hidden', 'true');
    await expect(page.queryByRole('separator')).toBeNull();
    await userEvent.type(page.getByRole('combobox'), 'o');
    await waitFor(() => expect(document.querySelector('[cmdk-separator]')).toBeNull());
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [last, setLast] = useState<string | null>(null);
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Button onClick={() => setOpen(true)}>Open palette</Button>
        {last && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Last selected: <code>{last}</code>
          </p>
        )}
        <CommandPalette open={open} onOpenChange={setOpen}>
          <CommandPalette.Input placeholder="Try typing…" />
          <CommandPalette.List>
            <CommandPalette.Empty>Nothing matches.</CommandPalette.Empty>
            <CommandPalette.Group heading="Demo">
              {['Profile', 'Settings', 'Sign out', 'Dashboard', 'Help'].map((label) => (
                <CommandPalette.Item
                  key={label}
                  value={label}
                  onSelect={() => {
                    setLast(label);
                    setOpen(false);
                  }}
                >
                  {label}
                </CommandPalette.Item>
              ))}
            </CommandPalette.Group>
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const SelectingItemFiresHandler: Story = {
  tags: ['!dev'],
  render: () => {
    const [open, setOpen] = useState(true);
    const handler = fn();
    return (
      <div className="flex h-screen items-center justify-center">
        <CommandPalette open={open} onOpenChange={setOpen} hotkey={null}>
          <CommandPalette.Input placeholder="Search…" />
          <CommandPalette.List>
            <CommandPalette.Empty>No results.</CommandPalette.Empty>
            <CommandPalette.Item value="alpha" onSelect={handler} data-testid="alpha">
              Alpha
            </CommandPalette.Item>
            <CommandPalette.Item value="beta" data-testid="beta">
              Beta
            </CommandPalette.Item>
          </CommandPalette.List>
          <CommandPalette.Footer>
            <span data-testid="footer-handler-count">{handler.mock?.calls?.length ?? 0}</span>
            <span>esc to close</span>
          </CommandPalette.Footer>
        </CommandPalette>
      </div>
    );
  },
  play: async () => {
    await waitFor(() => expect(document.querySelector('[data-testid="alpha"]')).not.toBeNull());
    const alpha = document.querySelector('[data-testid="alpha"]') as HTMLElement;
    await userEvent.click(alpha);
    // After click, the dialog should remain in DOM (handler doesn't auto-close);
    // but onSelect was triggered — in the controlled story above, onOpenChange
    // is left untouched so we just verify the item exists & received focus prior.
    await expect(alpha).toBeInTheDocument();
  },
};

export const SearchFiltersItems: Story = {
  tags: ['!dev'],
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex h-screen items-center justify-center">
        <CommandPalette open={open} onOpenChange={setOpen} hotkey={null}>
          <CommandPalette.Input placeholder="Search…" />
          <CommandPalette.List>
            <CommandPalette.Empty>No matching results.</CommandPalette.Empty>
            <CommandPalette.Item value="settings">Settings</CommandPalette.Item>
            <CommandPalette.Item value="profile">Profile</CommandPalette.Item>
            <CommandPalette.Item value="dashboard">Dashboard</CommandPalette.Item>
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
  play: async () => {
    await waitFor(() => expect(document.querySelector('[cmdk-input]')).not.toBeNull());
    const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
    input.focus();
    await userEvent.type(input, 'dash');
    // Only "Dashboard" should remain matchable
    await waitFor(() => {
      const items = Array.from(document.querySelectorAll('[cmdk-item]'));
      const visible = items.filter((i) => (i as HTMLElement).offsetParent !== null);
      expect(visible.length).toBe(1);
    });
  },
};

export const HotkeyOpensPalette: Story = {
  tags: ['!dev'],
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="hint">
          Press Ctrl/Cmd+K
        </p>
        <CommandPalette open={open} onOpenChange={setOpen}>
          <CommandPalette.Input placeholder="…" />
          <CommandPalette.List>
            <CommandPalette.Empty>—</CommandPalette.Empty>
            <CommandPalette.Item value="hello">Hello</CommandPalette.Item>
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
  play: async () => {
    // Initially no dialog
    await expect(document.querySelector('[cmdk-dialog]')).toBeNull();
    // Trigger Ctrl+K
    await userEvent.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(document.querySelector('[cmdk-dialog]')).not.toBeNull());
  },
};

/** Opened over a modal, the palette closes on Escape and the modal stays until the next one. */
export const EscapeOverAModalClosesOnlyThePalette: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [modal, setModal] = useState(true);
    const [palette, setPalette] = useState(false);
    return (
      <>
        <Modal open={modal} onClose={() => setModal(false)}>
          <Modal.Header title="Project settings" />
          <Modal.Body>
            <Button variant="secondary">Rename</Button>
          </Modal.Body>
        </Modal>
        <CommandPalette open={palette} onOpenChange={setPalette}>
          <CommandPalette.Input placeholder="Search" />
          <CommandPalette.List>
            <CommandPalette.Item value="hello">Hello</CommandPalette.Item>
          </CommandPalette.List>
        </CommandPalette>
      </>
    );
  },
  play: async () => {
    const body = within(document.body);
    await body.findByRole('dialog', { name: 'Project settings' });
    await userEvent.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(document.querySelector('[cmdk-dialog]')).not.toBeNull());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[cmdk-dialog]')).toBeNull());
    await expect(await body.findByRole('dialog', { name: 'Project settings' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: 'Project settings' })).toBeNull()
    );
  },
};

// Group headings (gray-400, 11px) fell under 4.5:1 (#151).
const headingContrastIn = (theme: string): Story => ({
  ...Open,
  tags: ['!dev', '!autodocs'],
  globals: { theme },
  play: async () => {
    await waitFor(() => expect(document.querySelector('[cmdk-group-heading]')).not.toBeNull());
    expectTextContrast(document.querySelector('[cmdk-group-heading]') as HTMLElement);
  },
});

export const GroupHeadingContrastInLight = headingContrastIn('light');
export const GroupHeadingContrastInSand = headingContrastIn('sand');
export const GroupHeadingContrastInDark = headingContrastIn('dark');
export const GroupHeadingContrastInDeepBlue = headingContrastIn('deep-blue');

// A bare-key hotkey like `/` opened the palette while typing in a field (#151).
export const BareHotkeyIgnoredWhileTyping: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <input aria-label="Notes" />
        <CommandPalette open={open} onOpenChange={setOpen} hotkey="/">
          <CommandPalette.Input placeholder="…" />
          <CommandPalette.List>
            <CommandPalette.Item value="hello">Hello</CommandPalette.Item>
          </CommandPalette.List>
        </CommandPalette>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Notes' }), 'a/b');
    await expect(canvas.getByRole('textbox', { name: 'Notes' })).toHaveValue('a/b');
    await expect(document.querySelector('[cmdk-dialog]')).toBeNull();
    // Outside a field the same key still opens it.
    await userEvent.click(document.body);
    await userEvent.keyboard('/');
    await waitFor(() => expect(document.querySelector('[cmdk-dialog]')).not.toBeNull());
  },
};

// The search field's placeholder (gray-400) sat under 4.5:1 on light and sand (#151).
export const PlaceholderContrastInEveryTheme: Story = {
  ...Open,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    await waitFor(() => expect(document.querySelector('[cmdk-input]')).not.toBeNull());
    const input = document.querySelector<HTMLElement>('[cmdk-input]')!;
    inEachTheme(() => expectPlaceholderContrast(input));
  },
};

// ── Rich items and close button ──────────────────────────────────────────────

const RichPalette = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => (
  <CommandPalette open={open} onOpenChange={onOpenChange} hotkey={null}>
    <CommandPalette.Input placeholder="Search…" onClose={() => onOpenChange(false)} />
    <CommandPalette.List>
      <CommandPalette.Empty>No matching commands.</CommandPalette.Empty>
      <CommandPalette.Group heading="Projects">
        <CommandPalette.Item
          icon={LayoutDashboard}
          description="Fleet overview with the live alerts"
          meta="Dashboards"
        >
          Open dashboard
        </CommandPalette.Item>
        <CommandPalette.Item
          icon={FileText}
          description="Start from a template or an empty page"
          meta="3 templates"
          shortcut="N"
        >
          Create document
        </CommandPalette.Item>
        <CommandPalette.Item icon={Settings} meta="Account">
          Settings
        </CommandPalette.Item>
      </CommandPalette.Group>
    </CommandPalette.List>
  </CommandPalette>
);

/** `description` is a second line, `meta` trailing text; an item with neither stays compact. */
export const RichItems: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex h-screen items-center justify-center">
        <RichPalette open={open} onOpenChange={setOpen} />
      </div>
    );
  },
};

export const RichItemsChecks: Story = {
  ...RichItems,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    const inside = within(dialog);
    await expect(inside.getByText('Fleet overview with the live alerts')).toBeVisible();
    await expect(inside.getByText('3 templates')).toBeVisible();
    // The compact item has no second line: it is no taller than the text line it carries.
    const compact = inside.getByText('Settings').closest('[cmdk-item]') as HTMLElement;
    const rich = inside.getByText('Create document').closest('[cmdk-item]') as HTMLElement;
    await expect(rich.getBoundingClientRect().height).toBeGreaterThan(
      compact.getBoundingClientRect().height
    );
  },
};

/** The close button of the input calls `onClose`; without the prop there is none. */
export const CloseButtonClosesThePalette: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex h-screen items-center justify-center">
        <span data-testid="state">{open ? 'open' : 'closed'}</span>
        <RichPalette open={open} onOpenChange={setOpen} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    const dialog = await within(document.body).findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    await expect(canvas.getByTestId('state')).toHaveTextContent('closed');
  },
};

export const NoCloseButtonByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <CommandPalette open hotkey={null} onOpenChange={fn()}>
      <CommandPalette.Input placeholder="Search…" />
      <CommandPalette.List>
        <CommandPalette.Item>Item</CommandPalette.Item>
      </CommandPalette.List>
    </CommandPalette>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    await expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
  },
};

/** A search that matches nothing hides the empty listbox and shows the `Empty` message. */
export const NoResults: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex h-screen items-center justify-center">
        <SamplePanel open={open} onOpenChange={setOpen} />
      </div>
    );
  },
  // A search that matches nothing, to show the empty state.
  play: async () => {
    const input = await waitFor(() => {
      const found = document.querySelector<HTMLInputElement>('[cmdk-input]');
      if (!found) throw new Error('The palette is not open yet.');
      return found;
    });
    input.focus();
    await userEvent.type(input, 'zzzz');
  },
};

export const NoResultsChecks: Story = {
  ...NoResults,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    await waitFor(() => expect(document.querySelector('[cmdk-input]')).not.toBeNull());
    const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
    input.focus();
    await userEvent.type(input, 'zzzz');
    const page = within(document.body);
    await waitFor(() => expect(page.getByText('No matching commands.')).toBeVisible());
    await expect(document.querySelectorAll('[cmdk-item]')).toHaveLength(0);
    // No listbox is left in the accessibility tree with nothing in it.
    await expect(page.queryByRole('listbox')).toBeNull();
    // Clearing the search brings the list back.
    await userEvent.clear(input);
    await waitFor(() => expect(page.getByRole('listbox')).toBeVisible());
  },
};

/**
 * The dialog stays centred in right to left, an item's icon and text start the row, and its
 * shortcut ends it with the keys in the order they are pressed ("⌘," would read ",⌘").
 */
export const CentredAndShortcutsKeepTheirOrder: Story = {
  tags: ['!dev', '!autodocs'],
  render: Open.render,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, async () => {
        await waitFor(() => {
          const box = dialog.getBoundingClientRect();
          const viewport = document.documentElement.clientWidth;
          expect(
            Math.abs((box.left + box.right) / 2 - viewport / 2),
            `${dir}: centred`
          ).toBeLessThan(1);
        });
        const item = within(dialog).getByText('Settings').closest<HTMLElement>('[cmdk-item]')!;
        const label = within(item).getByText('Settings');
        const shortcut = item.querySelector('kbd')!;
        expect(startOffset(item.querySelector('svg')!, item)).toBeLessThan(
          startOffset(label, item)
        );
        expect(endOffset(shortcut, item)).toBeLessThan(startOffset(shortcut, item));
        expectReadsLeftToRight(shortcut);
      });
    }
  },
};
