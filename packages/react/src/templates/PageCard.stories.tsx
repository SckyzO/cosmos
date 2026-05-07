import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageCard } from './PageCard';

const meta = {
  title: 'Layout/Page Card',
  component: PageCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof PageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-6 text-[var(--color-text-secondary)]">
        Outer card wrapping a full page block.
      </div>
    ),
  },
};
