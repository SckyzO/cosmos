import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Briefcase, Calendar, DollarSign, MapPin, Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { PageBreadcrumb } from './PageBreadcrumb';
import { PageActionButton } from '../ui/PageActionButton';

const meta = {
  title: 'Layout/Page Header',
  component: PageHeader,
  subcomponents: { 'PageHeader.MetaItem': PageHeader.MetaItem },
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

// TUI Plus pattern "With meta and actions" — title + meta row (icons + text)
// + right-aligned actions.
export const WithMetaAndActions: Story = {
  render: () => (
    <PageHeader
      title="Back End Developer"
      meta={
        <>
          <PageHeader.MetaItem icon={Briefcase}>Full-time</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={MapPin}>Remote</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={DollarSign}>$120k – $140k</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={Calendar}>Closing on January 9, 2020</PageHeader.MetaItem>
        </>
      }
      actions={
        <>
          <PageActionButton>Edit</PageActionButton>
          <PageActionButton>View</PageActionButton>
          <PageActionButton variant="primary">Publish</PageActionButton>
        </>
      }
    />
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const MetaRendersWhenProvided: Story = {
  args: {
    title: 'T',
    meta: <PageHeader.MetaItem>x</PageHeader.MetaItem>,
  },
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('h2 ~ div .flex.items-center');
    await expect(items.length).toBeGreaterThanOrEqual(1);
  },
};

export const NoMetaOmitsMetaContainer: Story = {
  args: { title: 'T' },
  play: async ({ canvasElement }) => {
    const metaRow = canvasElement.querySelector('.mt-2.flex.flex-wrap');
    await expect(metaRow).toBeNull();
  },
};
