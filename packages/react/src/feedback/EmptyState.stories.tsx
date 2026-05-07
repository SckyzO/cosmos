import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Feedback/Empty State',
  component: EmptyState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'No items' },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Minimal: Story = { args: { title: 'No items yet' } };

export const WithDescription: Story = {
  args: {
    title: 'No items yet',
    description: 'Create your first item to get started.',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No items yet',
    description: 'Create your first item to get started.',
    action: (
      <button
        type="button"
        className="bg-brand-500 hover:bg-brand-600 mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white"
      >
        <Plus className="h-3 w-3" />
        New item
      </button>
    ),
  },
};
