import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Download, SlidersHorizontal } from 'lucide-react';
import { PageActionButton, PageActionIconButton } from './PageActionButton';
import { RefreshButton, useAutoRefresh } from './RefreshButton';
import { RowActionButton } from './RowActionButton';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'UI/Page Actions',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const ActionButtons: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="PageActionButton — variants">
        <div className="flex flex-wrap gap-2">
          <PageActionButton icon={SlidersHorizontal}>outline</PageActionButton>
          <PageActionButton icon={Plus} variant="primary">
            primary
          </PageActionButton>
          <PageActionButton icon={Pencil} variant="brand-outline">
            brand-outline
          </PageActionButton>
          <PageActionButton icon={Trash2} variant="danger-outline">
            danger-outline
          </PageActionButton>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PageActionIconButton icon={SlidersHorizontal} title="Configure" />
          <PageActionIconButton icon={Download} title="Download" />
          <PageActionIconButton icon={Plus} title="Add" variant="primary" />
          <RowActionButton>View</RowActionButton>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const RefreshSplitButton: Story = {
  render: () => {
    const [refreshing, setRefreshing] = useState(false);
    const { autoRefreshMs, onIntervalChange } = useAutoRefresh('storybook-demo', () => {});
    const onRefresh = async () => {
      setRefreshing(true);
      await new Promise((r) => setTimeout(r, 600));
      setRefreshing(false);
    };
    return (
      <Wrap>
        <SectionCard title="RefreshButton — split button with interval picker">
          <RefreshButton
            refreshing={refreshing}
            autoRefreshMs={autoRefreshMs}
            onRefresh={onRefresh}
            onIntervalChange={onIntervalChange}
          />
        </SectionCard>
      </Wrap>
    );
  },
};
