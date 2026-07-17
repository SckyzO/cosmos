import type { Meta, StoryObj } from '@storybook/react-vite';
import { Filter, Globe, Database, LogOut, Server, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
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

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const SingleSelect: Story = {
  render: () => {
    const [room, setRoom] = useState('all');
    return (
      <Wrap>
        <SectionCard title="Filter dropdown with icon">
          <Dropdown
            icon={Filter}
            value={room}
            onChange={setRoom}
            options={[
              { value: 'all', label: 'All rooms' },
              { value: 'dc1-a', label: 'DC1 / Room A', icon: Globe },
              { value: 'dc1-b', label: 'DC1 / Room B', icon: Globe },
              { value: 'dc2-a', label: 'DC2 / Room A', icon: Database },
              { value: 'maint', label: 'Maintenance', icon: Server, disabled: true },
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
    const [v, setV] = useState<string | undefined>();
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
 * panel is a real menu (role=menu / role=menuitem), opening moves focus to the
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

    const menu = await scope.findByRole('menu');
    await expect(menu).toBeInTheDocument();
    const items = within(menu).getAllByRole('menuitem');
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
