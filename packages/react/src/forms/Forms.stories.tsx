import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Mail, Filter, LayoutGrid, List, Map } from 'lucide-react';
import { Input } from './Input';
import { SearchInput } from './SearchInput';
import { Select } from './Select';
import { Toggle } from './Toggle';
import { FilterPills } from './FilterPills';
import { SegmentedControl } from './SegmentedControl';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Forms/Basic Controls',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const TextInputs: Story = {
  render: () => {
    const [search, setSearch] = useState('');
    return (
      <Wrap>
        <SectionCard title="Text inputs">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Email"
              icon={Mail}
              placeholder="user@example.com"
              description="We will never share your email."
            />
            <Input
              label="Endpoint URL"
              placeholder="https://prom.example.com"
              error="Must start with https://"
            />
            <Input label="Scrape interval" rightSlot="seconds" placeholder="15" type="number" />
            <SearchInput value={search} onChange={setSearch} placeholder="Search resources…" />
          </div>
        </SectionCard>
      </Wrap>
    );
  },
};

export const Selects: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Select">
        <div className="grid max-w-sm gap-4">
          <Select
            label="Region"
            options={[
              { value: 'eu-west-1', label: 'eu-west-1' },
              { value: 'eu-west-3', label: 'eu-west-3' },
              { value: 'us-east-1', label: 'us-east-1' },
              { value: 'ap-south-1', label: 'ap-south-1', disabled: true },
            ]}
            description="Where to deploy the agent."
          />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Toggles: Story = {
  render: () => {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [strict, setStrict] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Toggles">
          <div className="space-y-4">
            <Toggle
              checked={autoRefresh}
              onChange={setAutoRefresh}
              label="Auto-refresh"
              description="Reload data every 30 seconds."
            />
            <Toggle
              checked={strict}
              onChange={setStrict}
              label="Strict mode"
              description="Reject scrape targets without TLS."
            />
            <Toggle checked={false} onChange={() => {}} disabled label="Coming soon" />
          </div>
        </SectionCard>
      </Wrap>
    );
  },
};

export const PillsAndSegmented: Story = {
  render: () => {
    const [filter, setFilter] = useState('all');
    const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
    return (
      <Wrap>
        <SectionCard title="Pills & segmented control">
          <div className="flex flex-wrap items-center gap-6">
            <FilterPills
              icon={Filter}
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'ok', label: 'OK' },
                { value: 'warn', label: 'Warn' },
                { value: 'crit', label: 'Crit' },
              ]}
            />
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: 'Grid', icon: LayoutGrid },
                { value: 'list', label: 'List', icon: List },
                { value: 'map', label: 'Map', icon: Map },
              ]}
            />
          </div>
        </SectionCard>
      </Wrap>
    );
  },
};
