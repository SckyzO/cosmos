import type { Meta, StoryObj } from '@storybook/react-vite';
import { Filter, Globe, Database, LogOut, Server, Settings, User } from 'lucide-react';
import { useState } from 'react';
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
