import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sk, SkeletonList, SkeletonTable, SkeletonText } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  component: Sk,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Sk>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primitive: Story = {
  render: () => (
    <div className="space-y-2">
      <Sk h="h-5" w="w-3/4" />
      <Sk h="h-4" />
      <Sk h="h-4" w="w-5/6" />
    </div>
  ),
};

export const TextParagraph: Story = {
  name: 'SkeletonText',
  render: () => <SkeletonText lines={4} />,
};

export const Table: Story = {
  name: 'SkeletonTable',
  render: () => <SkeletonTable rows={3} cols={4} />,
};

export const List: Story = {
  name: 'SkeletonList',
  render: () => (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <SkeletonList rows={3} />
    </div>
  ),
};
