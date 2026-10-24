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
import { expectFocusRing } from '../storybook-helpers';
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

/**
 * a11y: the trigger advertises a popup (aria-haspopup + aria-expanded), the
 * panel is a real menu (role=menu / role=menuitemradio), opening moves focus to the
 * first item, and ArrowDown roves between items.
 */
export const MenuSemanticsAndKeyboard: Story = {
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
  ...MenuItemFocusShowsRingInDark,
  globals: { theme: 'light' },
};
