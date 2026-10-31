import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Copy, Download, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectReadsLeftToRight,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { Badge } from './Badge';
import { Menu } from './Menu';

const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  parameters: portalDocsParams(380),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

const TRIGGER_CLASS =
  'flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200';

const Spot = ({ children }: { children: ReactNode }) => (
  <div className="flex h-80 items-start justify-center pt-8">{children}</div>
);

// ── Stories ──────────────────────────────────────────────────────────────────

/** Icons, shortcuts, a trailing badge, a disabled item, a divider and a danger item. */
export const Open: Story = {
  render: () => (
    <Spot>
      <Menu defaultOpen>
        <Menu.Trigger aria-label="More actions" className={TRIGGER_CLASS}>
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Menu.Trigger>
        <Menu.Content aria-label="Actions">
          <Menu.Item icon={Pencil} shortcut="⌘E">
            Rename
          </Menu.Item>
          <Menu.Item icon={Copy} shortcut="⌘D">
            Duplicate
          </Menu.Item>
          <Menu.Item
            icon={Share2}
            badge={
              <Badge size="sm" intent="brand">
                New
              </Badge>
            }
          >
            Share
          </Menu.Item>
          <Menu.Item icon={Download} disabled>
            Export
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item icon={Trash2} intent="danger" shortcut="⌫">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </Spot>
  ),
};

export const Closed: Story = {
  render: () => (
    <div className="flex h-24 items-start justify-center pt-8">
      <Menu>
        <Menu.Trigger
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
          aria-label="Actions"
        >
          Actions
        </Menu.Trigger>
      </Menu>
    </div>
  ),
};

/** `Menu.Group` names a run of items with a heading. */
export const Groups: Story = {
  render: () => (
    <Spot>
      <Menu defaultOpen>
        <Menu.Trigger
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
          aria-label="Document"
        >
          Document
        </Menu.Trigger>
        <Menu.Content aria-label="Document actions">
          <Menu.Group label="Edit">
            <Menu.Item icon={Pencil}>Rename</Menu.Item>
            <Menu.Item icon={Copy}>Duplicate</Menu.Item>
          </Menu.Group>
          <Menu.Separator />
          <Menu.Group label="Danger zone">
            <Menu.Item icon={Trash2} intent="danger">
              Delete
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu>
    </Spot>
  ),
};

export const AlignEnd: Story = {
  render: () => (
    <div className="flex h-80 items-start justify-end px-8 pt-8">
      <Menu defaultOpen align="end">
        <Menu.Trigger aria-label="More actions" className={TRIGGER_CLASS}>
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Menu.Trigger>
        <Menu.Content aria-label="Actions">
          <Menu.Item icon={Pencil}>Rename</Menu.Item>
          <Menu.Item icon={Trash2} intent="danger">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex h-72 flex-col items-center gap-3 pt-8">
        <Menu open={open} onOpenChange={setOpen}>
          <Menu.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
            Actions ({open ? 'open' : 'closed'})
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item icon={Pencil}>Rename</Menu.Item>
            <Menu.Item icon={Copy}>Duplicate</Menu.Item>
          </Menu.Content>
        </Menu>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-brand-600 dark:text-brand-400 text-xs underline"
        >
          Toggle from outside
        </button>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const menu = () => document.querySelector<HTMLElement>('[role="menu"]');

const NavMenu = ({ onSelect }: { onSelect?: (name: string) => void }) => (
  <Spot>
    <Menu>
      <Menu.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
        Actions
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onSelect={() => onSelect?.('Rename')}>Rename</Menu.Item>
        <Menu.Item disabled onSelect={() => onSelect?.('Duplicate')}>
          Duplicate
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item onSelect={() => onSelect?.('Share')}>Share</Menu.Item>
        <Menu.Item intent="danger" onSelect={() => onSelect?.('Delete')}>
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
    <button type="button">After</button>
  </Spot>
);

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
/** The ARIA contract: the trigger announces a menu, the panel and its parts have their roles. */
export const RolesAndAttributes: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Spot>
      <Menu defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Group label="Edit">
            <Menu.Item>Rename</Menu.Item>
          </Menu.Group>
          <Menu.Separator />
          <Menu.Item>Delete</Menu.Item>
        </Menu.Content>
      </Menu>
    </Spot>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = await waitFor(() => menu()!);
    await expect(panel).toHaveAccessibleName('Actions');
    const inside = within(panel);
    await expect(inside.getByRole('group', { name: 'Edit' })).toBeInTheDocument();
    await expect(inside.getByRole('separator')).toBeInTheDocument();
    await expect(inside.getAllByRole('menuitem')).toHaveLength(2);
  },
};

/** Enter opens on the first item; arrows move and wrap; Home and End jump; Escape gives focus back. */
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <NavMenu />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu()).not.toBeNull());
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Rename'));
    // The disabled item is skipped.
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Share');
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Delete');
    // Wraps at both ends.
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Rename');
    await userEvent.keyboard('{ArrowUp}');
    await expect(document.activeElement).toHaveTextContent('Delete');
    await userEvent.keyboard('{Home}');
    await expect(document.activeElement).toHaveTextContent('Rename');
    await userEvent.keyboard('{End}');
    await expect(document.activeElement).toHaveTextContent('Delete');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu()).toBeNull());
    await expect(document.activeElement).toBe(trigger);
  },
};

/** ArrowDown on the trigger opens on the first item, ArrowUp on the last. */
export const ArrowKeysOpenOnTheTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <NavMenu />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Rename'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu()).toBeNull());
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Delete'));
    // Tab leaves the menu and moves on past the trigger.
    await userEvent.tab();
    await waitFor(() => expect(menu()).toBeNull());
    await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'After' }));
  },
};

/** Enter and Space choose an item: `onSelect` fires once and the menu closes. */
export const SelectFiresAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <NavMenu onSelect={(args as unknown as { onPick: (n: string) => void }).onPick} />
  ),
  args: { onPick: fn() } as never,
  play: async ({ args, canvas }) => {
    const onPick = (args as unknown as { onPick: ReturnType<typeof fn> }).onPick;
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Rename'));
    await userEvent.keyboard('{Enter}');
    await expect(onPick).toHaveBeenCalledWith('Rename');
    await waitFor(() => expect(menu()).toBeNull());
    await expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Delete'));
    await userEvent.keyboard(' ');
    await expect(onPick).toHaveBeenLastCalledWith('Delete');
    await expect(onPick).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(menu()).toBeNull());
  },
};

/** A disabled item can't be chosen by the pointer either. */
export const DisabledItemIsNotSelectable: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <NavMenu onSelect={(args as unknown as { onPick: (n: string) => void }).onPick} />
  ),
  args: { onPick: fn() } as never,
  play: async ({ args, canvas }) => {
    const onPick = (args as unknown as { onPick: ReturnType<typeof fn> }).onPick;
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    const item = await within(await waitFor(() => menu()!)).findByRole('menuitem', {
      name: 'Duplicate',
    });
    await expect(item).toBeDisabled();
    await userEvent.click(item, { pointerEventsCheck: 0 });
    await expect(onPick).not.toHaveBeenCalled();
    await expect(menu()).not.toBeNull();
  },
};

/** `closeOnSelect={false}` keeps the menu open after the item runs. */
export const CloseOnSelectOff: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Spot>
      <Menu defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item closeOnSelect={false}>Stay</Menu.Item>
        </Menu.Content>
      </Menu>
    </Spot>
  ),
  play: async () => {
    const item = await within(await waitFor(() => menu()!)).findByRole('menuitem');
    await userEvent.click(item);
    await expect(menu()).not.toBeNull();
  },
};

/** Typing characters moves to the item whose label starts with them. */
export const TypeaheadMovesToMatchingItem: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <NavMenu />,
  play: async ({ canvas }) => {
    canvas.getByRole('button', { name: 'Actions' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Rename'));
    await userEvent.keyboard('d');
    await expect(document.activeElement).toHaveTextContent('Delete');
    await userEvent.keyboard('{Escape}');
  },
};

/** `intent="danger"` colors the item and its icon red; a neutral item stays gray. */
export const DangerIntentColorsTheItem: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Spot>
      <Menu defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item icon={Pencil}>Rename</Menu.Item>
          <Menu.Item icon={Trash2} intent="danger">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </Spot>
  ),
  play: async () => {
    const inside = within(await waitFor(() => menu()!));
    const neutral = inside.getByRole('menuitem', { name: 'Rename' });
    const danger = inside.getByRole('menuitem', { name: 'Delete' });
    await expect(neutral).toHaveClass('text-gray-700');
    await expect(neutral.querySelector('svg')).toHaveClass('text-gray-400');
    await expect(danger).toHaveClass('text-red-600', 'hover:bg-red-50');
    await expect(danger).not.toHaveClass('text-gray-700');
    await expect(danger.querySelector('svg')).toHaveClass('text-red-500');
  },
};

// ── Link items ───────────────────────────────────────────────────────────────

const LinkMenu = ({ onSelect }: { onSelect?: () => void }) => (
  <Spot>
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Rename</Menu.Item>
        <Menu.Item href="/docs" target="_blank" rel="noreferrer" onSelect={onSelect}>
          Documentation
        </Menu.Item>
        <Menu.Item href="/gone" disabled>
          Archived
        </Menu.Item>
        <Menu.Item>Delete</Menu.Item>
      </Menu.Content>
    </Menu>
  </Spot>
);

/** With `href` an item is a link: it keeps the menu behaviour and the browser's link behaviour. */
export const LinkItems: Story = {
  render: () => <LinkMenu />,
};

export const LinkItemFollowsItsHrefAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onPick: fn() } as never,
  render: (args) => <LinkMenu onSelect={(args as unknown as { onPick: () => void }).onPick} />,
  play: async ({ args, canvas }) => {
    const onPick = (args as unknown as { onPick: ReturnType<typeof fn> }).onPick;
    canvas.getByRole('button', { name: 'Actions' }).focus();
    await userEvent.keyboard('{Enter}');
    const body = within(document.body);
    const link = await body.findByRole('menuitem', { name: 'Documentation' });
    await expect(link.tagName).toBe('A');
    await expect(link).toHaveAttribute('href', '/docs');
    await expect(link).toHaveAttribute('target', '_blank');
    // Activating it fires a click on the link; stop it there so the test page stays put.
    let clicks = 0;
    const stop = (e: Event) => {
      clicks += 1;
      e.preventDefault();
    };
    link.addEventListener('click', stop);
    link.focus();
    await userEvent.keyboard('{Enter}');
    link.removeEventListener('click', stop);
    await expect(clicks).toBe(1);
    await expect(onPick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(menu()).toBeNull());
  },
};

export const ArrowKeysCrossButtonAndLinkItems: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LinkMenu />,
  play: async ({ canvas }) => {
    canvas.getByRole('button', { name: 'Actions' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Rename'));
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Documentation');
    // The disabled link is skipped.
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Delete');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect(document.activeElement).toHaveTextContent('Rename');
    await userEvent.keyboard('{Escape}');
  },
};

export const DisabledLinkItemHasNoHref: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LinkMenu />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    const item = await within(document.body).findByRole('menuitem', { name: 'Archived' });
    await expect(item).toHaveAttribute('aria-disabled', 'true');
    await expect(item).not.toHaveAttribute('href');
    await userEvent.click(item);
    await expect(menu()).not.toBeNull();
  },
};

// ── Checkbox items ───────────────────────────────────────────────────────────

const CheckboxMenu = ({
  onCheckedChange,
  closeOnSelect,
}: {
  onCheckedChange?: (name: string, checked: boolean) => void;
  closeOnSelect?: boolean;
}) => (
  <Spot>
    <Menu>
      <Menu.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
        View
      </Menu.Trigger>
      <Menu.Content aria-label="View options">
        <Menu.Group label="Show">
          <Menu.CheckboxItem
            defaultChecked
            closeOnSelect={closeOnSelect}
            onCheckedChange={(c) => onCheckedChange?.('Sidebar', c)}
          >
            Sidebar
          </Menu.CheckboxItem>
          <Menu.CheckboxItem
            closeOnSelect={closeOnSelect}
            onCheckedChange={(c) => onCheckedChange?.('Minimap', c)}
          >
            Minimap
          </Menu.CheckboxItem>
          <Menu.CheckboxItem disabled defaultChecked>
            Status bar
          </Menu.CheckboxItem>
          <Menu.CheckboxItem
            closeOnSelect={closeOnSelect}
            onCheckedChange={(c) => onCheckedChange?.('Ruler', c)}
          >
            Ruler
          </Menu.CheckboxItem>
        </Menu.Group>
      </Menu.Content>
    </Menu>
    <button type="button">After</button>
  </Spot>
);

/** Checkbox items for options that are on or off: a checked item shows a filled accent box. */
export const CheckboxItems: Story = {
  render: () => (
    <Spot>
      <Menu defaultOpen>
        <Menu.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
          View
        </Menu.Trigger>
        <Menu.Content aria-label="View options">
          <Menu.Group label="Show">
            <Menu.CheckboxItem defaultChecked>Sidebar</Menu.CheckboxItem>
            <Menu.CheckboxItem>Minimap</Menu.CheckboxItem>
            <Menu.CheckboxItem disabled defaultChecked>
              Status bar
            </Menu.CheckboxItem>
          </Menu.Group>
        </Menu.Content>
      </Menu>
    </Spot>
  ),
};

/** The role, the state and the disabled state are exposed to assistive technology. */
export const CheckboxItemRolesAndAttributes: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <CheckboxMenu />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'View' }));
    const inside = within(await waitFor(() => menu()!));
    const items = inside.getAllByRole('menuitemcheckbox');
    await expect(items).toHaveLength(4);
    await expect(inside.getByRole('menuitemcheckbox', { name: 'Sidebar' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(inside.getByRole('menuitemcheckbox', { name: 'Minimap' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    await expect(inside.getByRole('menuitemcheckbox', { name: 'Status bar' })).toBeDisabled();
  },
};

/** A click toggles the item, calls `onCheckedChange` with the new state, and keeps the menu open. */
export const CheckboxItemTogglesAndStaysOpen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onPick: fn() } as never,
  render: (args) => (
    <CheckboxMenu
      onCheckedChange={(args as unknown as { onPick: (n: string, c: boolean) => void }).onPick}
    />
  ),
  play: async ({ args, canvas }) => {
    const onPick = (args as unknown as { onPick: ReturnType<typeof fn> }).onPick;
    await userEvent.click(canvas.getByRole('button', { name: 'View' }));
    const inside = within(await waitFor(() => menu()!));
    const minimap = inside.getByRole('menuitemcheckbox', { name: 'Minimap' });
    await userEvent.click(minimap);
    await expect(onPick).toHaveBeenLastCalledWith('Minimap', true);
    await expect(minimap).toHaveAttribute('aria-checked', 'true');
    await expect(menu()).not.toBeNull();
    await userEvent.click(minimap);
    await expect(onPick).toHaveBeenLastCalledWith('Minimap', false);
    await expect(minimap).toHaveAttribute('aria-checked', 'false');
    // A disabled item neither toggles nor calls back.
    await userEvent.click(inside.getByRole('menuitemcheckbox', { name: 'Status bar' }), {
      pointerEventsCheck: 0,
    });
    await expect(onPick).toHaveBeenCalledTimes(2);
  },
};

/** Arrows, Home, End and the typeahead move over the checkbox items; Space and Enter toggle them. */
export const CheckboxItemKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <CheckboxMenu />,
  play: async ({ canvas }) => {
    canvas.getByRole('button', { name: 'View' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Sidebar'));
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Minimap');
    await userEvent.keyboard(' ');
    await expect(document.activeElement).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(document.activeElement).toHaveAttribute('aria-checked', 'false');
    // The disabled "Status bar" is skipped.
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Ruler');
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Sidebar');
    await userEvent.keyboard('{End}');
    await expect(document.activeElement).toHaveTextContent('Ruler');
    await userEvent.keyboard('{Home}');
    await expect(document.activeElement).toHaveTextContent('Sidebar');
    await userEvent.keyboard('r');
    await expect(document.activeElement).toHaveTextContent('Ruler');
    // The menu stayed open through all of it.
    await expect(menu()).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu()).toBeNull());
  },
};

/** `closeOnSelect` closes the menu after the toggle, as an action item does. */
export const CheckboxItemCloseOnSelect: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <CheckboxMenu closeOnSelect />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'View' }));
    const inside = within(await waitFor(() => menu()!));
    await userEvent.click(inside.getByRole('menuitemcheckbox', { name: 'Ruler' }));
    await waitFor(() => expect(menu()).toBeNull());
  },
};

const ControlledCheckbox = () => {
  const [on, setOn] = useState(false);
  return (
    <Spot>
      <Menu defaultOpen>
        <Menu.Trigger>View</Menu.Trigger>
        <Menu.Content aria-label="View options">
          <Menu.CheckboxItem checked={on} onCheckedChange={setOn}>
            Minimap
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu>
      <span data-testid="state">{on ? 'on' : 'off'}</span>
    </Spot>
  );
};

/** With `checked`, the host owns the state and the item shows what it passes back. */
export const CheckboxItemControlled: Story = {
  tags: ['!autodocs'],
  render: () => <ControlledCheckbox />,
};

export const CheckboxItemControlledChecks: Story = {
  ...CheckboxItemControlled,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const item = await within(await waitFor(() => menu()!)).findByRole('menuitemcheckbox');
    await expect(item).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item);
    await expect(canvas.getByTestId('state')).toHaveTextContent('on');
    await expect(item).toHaveAttribute('aria-checked', 'true');
  },
};

// ── Radio items ──────────────────────────────────────────────────────────────

const RadioMenu = ({ defaultOpen }: { defaultOpen?: boolean }) => {
  const [density, setDensity] = useState('Default');
  return (
    <Spot>
      <Menu defaultOpen={defaultOpen}>
        <Menu.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
          Density
        </Menu.Trigger>
        <Menu.Content aria-label="Density options">
          <Menu.Group label="Row height">
            {['Compact', 'Default', 'Comfortable'].map((name) => (
              <Menu.RadioItem
                key={name}
                checked={density === name}
                disabled={name === 'Compact' && density !== name}
                onSelect={() => setDensity(name)}
              >
                {name}
              </Menu.RadioItem>
            ))}
          </Menu.Group>
        </Menu.Content>
      </Menu>
    </Spot>
  );
};

/** Radio items pick one option of a set: the checked one shows an accent dot. The host owns `checked`. */
export const RadioItems: Story = {
  render: () => <RadioMenu defaultOpen />,
};

/** The role and the state are exposed; a pick moves the check, closes the menu and takes the focus back. */
export const RadioItemPicksOneAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <RadioMenu />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Density' });
    await userEvent.click(trigger);
    const inside = within(await waitFor(() => menu()!));
    const items = inside.getAllByRole('menuitemradio');
    await expect(items.map((i) => i.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    await expect(inside.getByRole('menuitemradio', { name: 'Compact' })).toBeDisabled();
    await userEvent.click(inside.getByRole('menuitemradio', { name: 'Comfortable' }));
    await waitFor(() => expect(menu()).toBeNull());
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    const again = within(await waitFor(() => menu()!));
    await expect(again.getByRole('menuitemradio', { name: 'Comfortable' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  },
};

/** The arrows reach the radio items and skip the disabled one. */
export const RadioItemsTakeTheArrowKeys: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <RadioMenu />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Density' }));
    const inside = within(await waitFor(() => menu()!));
    // Compact is disabled: the first item is Default.
    await waitFor(() =>
      expect(inside.getByRole('menuitemradio', { name: 'Default' })).toHaveFocus()
    );
    await userEvent.keyboard('{ArrowDown}');
    await expect(inside.getByRole('menuitemradio', { name: 'Comfortable' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(inside.getByRole('menuitemradio', { name: 'Default' })).toHaveFocus();
  },
};

// The panel of the menu aligned to `align` in the box of `dir`: portaled to the end of `<body>`,
// and it takes the direction of its trigger.
const panelOf = (dir: 'ltr' | 'rtl', align: 'start' | 'end') =>
  document.querySelector<HTMLElement>(
    `[role="menu"][dir="${dir}"][aria-label="Menu aligned to the ${align}"]`
  );

/**
 * A menu lines up with the start or the end of its trigger (the left or right edge, swapped in
 * right to left), its items and group label start the line, and a shortcut ends it and keeps
 * its keys in order.
 */
export const MenuFollowsTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams(420),
  render: () =>
    bothDirections(() => (
      <div className="flex h-72 items-start justify-center gap-96 pt-4">
        {(['start', 'end'] as const).map((align) => (
          <Menu key={align} defaultOpen align={align}>
            <Menu.Trigger className="rounded-md border px-3 py-1 text-sm">{align}</Menu.Trigger>
            <Menu.Content aria-label={`Menu aligned to the ${align}`} width="w-48">
              <Menu.Group label="File (3 of 5)">
                <Menu.Item icon={Copy} shortcut="⌘D">
                  Duplicate
                </Menu.Item>
                <Menu.CheckboxItem defaultChecked>Show hidden</Menu.CheckboxItem>
              </Menu.Group>
            </Menu.Content>
          </Menu>
        ))}
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const [startTrigger, endTrigger] = within(box).getAllByRole('button');
      await waitFor(() => expect(panelOf(dir, 'end')).not.toBeNull());
      const atStart = panelOf(dir, 'start')!;
      const atEnd = panelOf(dir, 'end')!;
      expect(startOffset(atStart, startTrigger!), `${dir}: align start`).toBeCloseTo(0, 0);
      expect(endOffset(atEnd, endTrigger!), `${dir}: align end`).toBeCloseTo(0, 0);
      expect(atStart.getAttribute('dir')).toBe(dir);

      const item = within(atStart).getByRole('menuitem', { name: /Duplicate/ });
      const label = within(item).getByText('Duplicate');
      const shortcut = item.querySelector('kbd')!;
      // Text and icon start the line, the shortcut ends it.
      expect(startOffset(item.querySelector('svg')!, item)).toBeLessThan(startOffset(label, item));
      expect(endOffset(shortcut, item)).toBeLessThan(startOffset(shortcut, item));
      expectReadsLeftToRight(shortcut);
      // The item's text starts where the menu's content does.
      expect(getComputedStyle(item).textAlign).toBe('start');
      expectReadsLeftToRight(within(atStart).getByText('File (3 of 5)'));
    }
  },
};
