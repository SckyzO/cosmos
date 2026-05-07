import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Feedback/States',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const AllThree: Story = {
  render: () => (
    <Wrap>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Loading">
          <LoadingState message="Fetching data…" />
        </SectionCard>
        <SectionCard title="Empty">
          <EmptyState
            title="No items yet"
            description="Create your first item to get started."
            action={
              <button
                type="button"
                className="bg-brand-500 hover:bg-brand-600 mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white"
              >
                <Plus className="h-3 w-3" />
                New item
              </button>
            }
          />
        </SectionCard>
        <SectionCard title="Error">
          <ErrorState
            message="Failed to load data."
            onRetry={() => {
              /* noop demo */
            }}
          />
        </SectionCard>
      </div>
    </Wrap>
  ),
};
