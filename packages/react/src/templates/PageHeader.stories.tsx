import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { PageBreadcrumb } from './PageBreadcrumb';
import { PageActionButton } from '../ui/PageActionButton';

const meta = {
  title: 'Layout/Page Header',
  component: PageHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Title' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = { args: { title: 'Production Dashboard' } };

export const WithDescription: Story = {
  args: { title: 'Production Dashboard', description: 'High-level summary of the cluster.' },
};

export const WithBreadcrumb: Story = {
  args: {
    title: 'Production Dashboard',
    breadcrumb: (
      <PageBreadcrumb
        items={[
          { label: 'Home', href: '#' },
          { label: 'Monitoring', href: '#' },
          { label: 'Production' },
        ]}
      />
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: 'Production Dashboard',
    breadcrumb: (
      <PageBreadcrumb
        items={[
          { label: 'Home', href: '#' },
          { label: 'Monitoring', href: '#' },
          { label: 'Production' },
        ]}
      />
    ),
    actions: (
      <>
        <PageActionButton icon={RefreshCw}>Refresh</PageActionButton>
        <PageActionButton icon={Plus} variant="primary">
          New rule
        </PageActionButton>
      </>
    ),
  },
};
