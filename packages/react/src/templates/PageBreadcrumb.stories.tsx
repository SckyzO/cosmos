import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageBreadcrumb } from './PageBreadcrumb';

const meta = {
  title: 'Layout/Page Breadcrumb',
  component: PageBreadcrumb,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { items: [] },
} satisfies Meta<typeof PageBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/library' },
      { label: 'Components', href: '/library/components' },
      { label: 'Breadcrumb' },
    ],
  },
};

export const TwoLevels: Story = {
  args: {
    items: [{ label: 'Home', href: '/' }, { label: 'Settings' }],
  },
};
