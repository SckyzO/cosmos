import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Clock, Cpu, MapPin, Plus, RefreshCw, Server } from 'lucide-react';
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
      title="compute-042"
      meta={
        <>
          <PageHeader.MetaItem icon={Server}>Rack R12, slot 14</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={MapPin}>Paris DC1</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={Cpu}>64 cores, 512 GB</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={Clock}>Up 41 days</PageHeader.MetaItem>
        </>
      }
      actions={
        <>
          <PageActionButton>Silence</PageActionButton>
          <PageActionButton>Edit</PageActionButton>
          <PageActionButton variant="primary">Drain</PageActionButton>
        </>
      }
    />
  ),
};

// At phone width (a 320px screen minus its page gutters) the actions don't fit
// beside the title: they have to move under it rather than cover it.
export const Narrow: Story = {
  render: () => (
    <div className="w-72">
      <PageHeader
        title="Production Dashboard"
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Home', href: '#' },
              { label: 'Monitoring', href: '#' },
              { label: 'Production' },
            ]}
          />
        }
        meta={
          <>
            <PageHeader.MetaItem icon={Server}>128 nodes</PageHeader.MetaItem>
            <PageHeader.MetaItem icon={Clock}>
              Refreshed 12 seconds ago from prometheus-eu-west-1
            </PageHeader.MetaItem>
          </>
        }
        actions={
          <>
            <PageActionButton icon={RefreshCw}>Refresh</PageActionButton>
            <PageActionButton icon={Plus} variant="primary">
              New rule
            </PageActionButton>
          </>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Measure the title's text, not the h2 box: a squeezed h2 lets its words
    // spill out of it.
    const range = document.createRange();
    range.selectNodeContents(canvas.getByRole('heading', { name: 'Production Dashboard' }));
    const text = range.getBoundingClientRect();
    for (const name of ['Refresh', 'New rule']) {
      const button = canvas.getByRole('button', { name }).getBoundingClientRect();
      const overlaps =
        button.left < text.right &&
        button.right > text.left &&
        button.top < text.bottom &&
        button.bottom > text.top;
      await expect(overlaps).toBe(false);
    }
    // Meta icons keep their 20px, also beside text that wraps.
    for (const label of ['128 nodes', /^Refreshed/]) {
      const icon = canvas.getByText(label).querySelector('svg');
      await expect(icon?.getBoundingClientRect().width).toBe(20);
    }
  },
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
