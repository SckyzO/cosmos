import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentNarrow } from './ContentNarrow';

const meta = {
  title: 'Layout/Content Narrow',
  component: ContentNarrow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof ContentNarrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6 text-sm text-[var(--color-text-secondary)]">
        Content constrained to a narrow column (default 680px).
      </div>
    ),
  },
};

export const WiderColumn: Story = {
  args: {
    maxWidth: 960,
    children: (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6 text-sm text-[var(--color-text-secondary)]">
        Content with `maxWidth=960`.
      </div>
    ),
  },
};
