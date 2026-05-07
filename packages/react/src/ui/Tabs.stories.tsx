import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tabs } from './Tabs';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 'overview', onChange: () => {}, children: null },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const ThreeTabs: Story = {
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Wrap>
        <SectionCard title="Tabs (overview / metrics / logs)">
          <Tabs value={tab} onChange={setTab}>
            <Tabs.List>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
              <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
              <Tabs.Trigger value="disabled" disabled>
                Soon
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Panel value="overview">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High-level summary of the resource.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="metrics">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time-series charts go here.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="logs">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recent log lines from the agent.
              </p>
            </Tabs.Panel>
          </Tabs>
        </SectionCard>
      </Wrap>
    );
  },
};
