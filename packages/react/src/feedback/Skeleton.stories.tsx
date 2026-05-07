import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sk, SkeletonList, SkeletonTable, SkeletonText } from './Skeleton';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Feedback/Skeleton',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Primitives: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Sk — primitive blocks">
        <div className="space-y-2">
          <Sk h="h-5" w="w-3/4" />
          <Sk h="h-4" />
          <Sk h="h-4" w="w-5/6" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Presets: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="SkeletonText (4 lines)">
          <SkeletonText lines={4} />
        </SectionCard>
        <SectionCard title="SkeletonTable (3 × 4)">
          <SkeletonTable rows={3} cols={4} />
        </SectionCard>
        <SectionCard title="SkeletonList (3)">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <SkeletonList rows={3} />
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};
