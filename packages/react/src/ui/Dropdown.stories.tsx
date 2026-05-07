import type { Meta, StoryObj } from '@storybook/react-vite';
import { Filter, Globe, Database, Server } from 'lucide-react';
import { useState } from 'react';
import { Dropdown } from './Dropdown';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'UI/Dropdown',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

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
