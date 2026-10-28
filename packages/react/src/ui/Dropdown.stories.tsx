import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Archive,
  Filter,
  Globe,
  Database,
  LogOut,
  Server,
  Settings,
  Smartphone,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  expectBelow,
  expectFocusRing,
  expectOutsideClip,
  portalDocsParams,
  scrollAnchor,
  startOffset,
} from '../storybook-helpers';
import { Dropdown, type DropdownItem } from './Dropdown';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Overlays/Dropdown',
  component: Dropdown,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [] },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

// The open menu: queried from the whole page, wherever the menu renders.
const page = within(document.body);

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const SingleSelect: Story = {
  render: () => {
    const [project, setProject] = useState('all');
    return (
      <Wrap>
        <SectionCard title="Filter dropdown with icon">
          <Dropdown
            icon={Filter}
            value={project}
            onChange={setProject}
            options={[
              { value: 'all', label: 'All projects' },
              { value: 'website', label: 'Website', icon: Globe },
              { value: 'mobile', label: 'Mobile app', icon: Smartphone },
              { value: 'api', label: 'Public API', icon: Database },
              { value: 'legacy', label: 'Legacy portal', icon: Archive, disabled: true },
            ]}
          />
        </SectionCard>
      </Wrap>
    );
  },
};

export const WithDivider: Story = {
  render: () => {
    const [v, setV] = useState('profile');
    const items: DropdownItem[] = [
      { value: 'profile', label: 'Profile', icon: User },
      { value: 'settings', label: 'Settings', icon: Settings },
      { divider: true },
      { value: 'logout', label: 'Sign out', icon: LogOut },
    ];
    return (
      <Wrap>
        <SectionCard title="Dropdown with divider — separates destructive action">
          <Dropdown value={v} onChange={setV} options={items} placeholder="Account…" />
        </SectionCard>
      </Wrap>
    );
  },
};

export const MultipleDividers: Story = {
  render: () => {
    const [v, setV] = useState('');
    const items: DropdownItem[] = [
      { value: 'all', label: 'All resources' },
      { divider: true },
      { value: 'servers', label: 'Servers', icon: Server },
      { value: 'storage', label: 'Storage', icon: Database },
      { value: 'network', label: 'Network', icon: Globe },
      { divider: true },
      { value: 'archived', label: 'Archived', disabled: true },
    ];
    return (
      <Wrap>
        <SectionCard title="Multiple dividers — group related options">
          <Dropdown value={v} onChange={setV} options={items} placeholder="Select a category" />
        </SectionCard>
      </Wrap>
    );
  },
};

/** `defaultOpen` shows the menu as it looks once opened: the selected option checked, a divider, a disabled option. */
export const Open: Story = {
  parameters: portalDocsParams.md(),
  render: () => {
    const [project, setProject] = useState('website');
    return (
      <Wrap>
        <Dropdown
          icon={Filter}
          defaultOpen
          value={project}
          onChange={setProject}
          options={[
            { value: 'all', label: 'All projects' },
            { divider: true },
            { value: 'website', label: 'Website', icon: Globe },
            { value: 'mobile', label: 'Mobile app', icon: Smartphone },
            { value: 'api', label: 'Public API', icon: Database },
            { value: 'legacy', label: 'Legacy portal', icon: Archive, disabled: true },
          ]}
        />
      </Wrap>
    );
  },
  play: async () => {
    const menu = await page.findByRole('menu');
    await expect(menu).toBeVisible();
    await expect(within(menu).getByRole('menuitemradio', { name: 'Website' })).toBeChecked();
    // Opened on mount, not by the user: focus stays out of the menu, so a docs page does not jump to it.
    await expect(menu.contains(document.activeElement)).toBe(false);
  },
};

/**
 * a11y: the trigger advertises a popup (aria-haspopup + aria-expanded), the
 * panel is a real menu (role=menu / role=menuitemradio), opening moves focus to the
 * first item, and ArrowDown roves between items.
 */
export const MenuSemanticsAndKeyboard: Story = {
  tags: ['!dev'],
  render: () => {
    const [v, setV] = useState('');
    return (
      <Wrap>
        <Dropdown
          label="Actions"
          value={v}
          onChange={setV}
          options={[
            { value: 'profile', label: 'Profile', icon: User },
            { value: 'settings', label: 'Settings', icon: Settings },
            { value: 'logout', label: 'Sign out', icon: LogOut },
          ]}
        />
      </Wrap>
    );
  },
  play: async ({ canvasElement }) => {
    const scope = within(canvasElement);
    const trigger = scope.getByRole('button', { name: /Actions|Select/ });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const menu = await page.findByRole('menu');
    await expect(menu).toBeInTheDocument();
    const items = within(menu).getAllByRole('menuitemradio');
    await expect(items).toHaveLength(3);

    // Opening focuses the first item; ArrowDown moves to the second.
    await expect(document.activeElement).toBe(items[0]);
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(items[1]);

    // Escape closes and returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(document.activeElement).toBe(trigger);
  },
};

export const SelectedItemIsChecked: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [v, setV] = useState('settings');
    return (
      <Wrap>
        <Dropdown
          label="Actions"
          value={v}
          onChange={setV}
          options={[
            { value: 'profile', label: 'Profile' },
            { value: 'settings', label: 'Settings' },
          ]}
        />
      </Wrap>
    );
  },
  play: async ({ canvasElement }) => {
    const scope = within(canvasElement);
    await userEvent.click(scope.getByRole('button', { name: 'Settings' }));
    const menu = within(await page.findByRole('menu'));
    await expect(
      menu.getByRole('menuitemradio', { name: 'Settings', checked: true })
    ).toBeVisible();
    await expect(
      menu.getByRole('menuitemradio', { name: 'Profile', checked: false })
    ).toBeVisible();

    await userEvent.click(menu.getByRole('menuitemradio', { name: 'Profile' }));
    await userEvent.click(scope.getByRole('button', { name: 'Profile' }));
    const reopened = within(await page.findByRole('menu'));
    await expect(
      reopened.getByRole('menuitemradio', { name: 'Profile', checked: true })
    ).toBeVisible();
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

const ACCOUNT = [
  { value: 'profile', label: 'Profile' },
  { value: 'settings', label: 'Settings' },
];

export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <Wrap>
      <div className="flex gap-3">
        <Dropdown label="Own" options={ACCOUNT} defaultValue="settings" onChange={args.onChange} />
        <Dropdown label="Held" options={ACCOUNT} value="settings" onChange={args.onChange} />
      </div>
    </Wrap>
  ),
  play: async ({ args, canvasElement }) => {
    const scope = within(canvasElement);
    const [own, held] = scope.getAllByRole('button', { name: 'Settings' });

    await userEvent.click(own);
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Profile' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('profile');
    await expect(own).toHaveTextContent('Profile');

    await userEvent.click(held);
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Profile' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('profile');
    await expect(args.onChange).toHaveBeenCalledTimes(2);
    await expect(held).toHaveTextContent('Settings');
  },
};

// ── Open state (#151) ────────────────────────────────────────────────────────
// `open` / `defaultOpen` / `onOpenChange`, only `undefined` meaning uncontrolled.
// `defaultOpen` starts it open and it closes on its own; held at a fixed `open`,
// it reports what the user asks for and keeps the state it is given.

export const DefaultOpenClosesOnItsOwn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: (args) => (
    <Wrap>
      <Dropdown label="Account" options={ACCOUNT} defaultOpen onOpenChange={args.onOpenChange} />
    </Wrap>
  ),
  play: async ({ args, canvasElement }) => {
    const scope = within(canvasElement);
    const trigger = scope.getByRole('button', { name: 'Account' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(await page.findByRole('menu', { name: 'Account' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.queryByRole('menu')).toBeNull();
  },
};

export const ControlledOpenOnlyReports: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: (args) => (
    <Wrap>
      <Dropdown label="Account" options={ACCOUNT} open onOpenChange={args.onOpenChange} />
    </Wrap>
  ),
  play: async ({ args, canvasElement }) => {
    const scope = within(canvasElement);
    const menu = await page.findByRole('menu', { name: 'Account' });
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Profile' }));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    // The host keeps it open.
    await expect(page.getByRole('menu', { name: 'Account' })).toBeVisible();
    await expect(scope.getByRole('button', { name: 'Profile' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  },
};

// Opening the menu from the keyboard moves focus onto its first item.

export const MenuItemFocusShowsRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => (
    <Wrap>
      <Dropdown
        label="Actions"
        value=""
        options={[
          { value: 'profile', label: 'Profile', icon: User },
          { value: 'logout', label: 'Sign out', icon: LogOut },
        ]}
      />
    </Wrap>
  ),
  play: async () => {
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const item = await page.findByRole('menuitemradio', { name: 'Profile' });
    await waitFor(() => expect(item).toHaveFocus());
    await expectFocusRing(item, { inset: true });
  },
};

export const MenuItemFocusShowsRingInLight: Story = {
  tags: ['!dev'],
  ...MenuItemFocusShowsRingInDark,
  globals: { theme: 'light' },
};

// ── Floating menu (#151) ─────────────────────────────────────────────────────
// The menu renders in a portal: no `overflow: hidden` ancestor clips it, and it
// follows its trigger while the page scrolls.

/** A card that clips its content no longer cuts the menu off. */
export const MenuEscapesOverflowHidden: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div data-testid="clip" className="h-16 overflow-hidden rounded-lg border p-3">
        <Dropdown label="Actions" options={ACCOUNT} />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    expectOutsideClip(await page.findByRole('menu'), canvas.getByTestId('clip'));
  },
};

/** The menu follows its trigger on scroll; Escape and an outside click close it. */
export const MenuFollowsTriggerAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="scroller" className="h-64 overflow-y-auto">
      <div className="flex flex-col items-end gap-4 p-6 pb-[600px]">
        <Dropdown label="Actions" options={ACCOUNT} align="end" />
        <button type="button">Outside</button>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    const menu = await page.findByRole('menu');
    await scrollAnchor(canvas.getByTestId('scroller'), trigger);
    await waitFor(() => expectBelow(menu, trigger, { offset: 4, align: 'end' }));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await page.findByRole('menu');
    await userEvent.click(canvas.getByRole('button', { name: 'Outside' }));
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
  },
};

/**
 * At the bottom of the screen, where the viewport would cut it, the menu opens upward. It
 * flips only when the other side has more room, and a menu the viewport cuts on the left or
 * the right moves back inside, 16px from the edge.
 */
export const OpensUpwardAtTheBottomEdge: Story = {
  tags: ['!dev'],
  parameters: portalDocsParams.sm(),
  render: () => (
    <div className="flex h-screen items-end bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">
      <Dropdown
        label="Actions"
        options={[
          { value: 'profile', label: 'Profile', icon: User },
          { value: 'settings', label: 'Settings', icon: Settings },
          { divider: true },
          { value: 'logout', label: 'Sign out', icon: LogOut },
        ]}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    const panel = await page.findByRole('menu');
    const menu = panel.getBoundingClientRect();
    const anchor = trigger.getBoundingClientRect();
    // 4px above the trigger, flush with its start edge (the left one, the right in rtl).
    await expect(menu.bottom).toBeCloseTo(anchor.top - 4, 0);
    await expect(startOffset(panel, trigger)).toBeCloseTo(0, 0);
  },
};

/** Tab past the last item closes the menu and moves on to the element after the trigger. */
export const TabLeavesTheMenu: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex gap-3">
        <Dropdown label="Actions" options={ACCOUNT} />
        <button type="button">After</button>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const [first, last] = await page.findAllByRole('menuitemradio');
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.tab();
    await expect(last).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
  },
};
