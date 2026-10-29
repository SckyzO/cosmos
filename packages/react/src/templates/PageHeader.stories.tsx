import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Clock, Cpu, MapPin, Plug, Plus, RefreshCw, Server, ShieldAlert } from 'lucide-react';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectBeyondEnd,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { PageHeader } from './PageHeader';
import { Breadcrumb } from '../navigation/Breadcrumb';
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
      <Breadcrumb
        homeIcon
        items={[
          { label: 'Overview', href: '#' },
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
      <Breadcrumb
        homeIcon
        items={[
          { label: 'Overview', href: '#' },
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
// + end-aligned actions.
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
          <Breadcrumb
            homeIcon
            items={[
              { label: 'Overview', href: '#' },
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
      const icon = canvas.getByText(label).closest('div')!.querySelector('svg');
      await expect(icon?.getBoundingClientRect().width).toBe(20);
    }
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const MetaRendersWhenProvided: Story = {
  tags: ['!dev'],
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
  tags: ['!dev'],
  args: { title: 'T' },
  play: async ({ canvasElement }) => {
    const metaRow = canvasElement.querySelector('.mt-2.flex.flex-wrap');
    await expect(metaRow).toBeNull();
  },
};

// ── Leading icon tile ────────────────────────────────────────────────────────

export const WithIcon: Story = {
  args: {
    title: 'Integrations',
    as: 'h1',
    description: 'Connect the tools your team already uses.',
    icon: Plug,
    actions: (
      <PageActionButton icon={Plus} variant="primary">
        Add integration
      </PageActionButton>
    ),
  },
};

/** The tile is tinted from the intent: `brand` by default. */
export const IconIntents: Story = {
  render: () => (
    <div className="space-y-6">
      {(['brand', 'info', 'success', 'warning', 'danger', 'neutral'] as const).map((intent) => (
        <PageHeader
          key={intent}
          title={`iconIntent="${intent}"`}
          description="Connect the tools your team already uses."
          icon={intent === 'danger' ? ShieldAlert : Plug}
          iconIntent={intent}
        />
      ))}
    </div>
  ),
};

export const IconTileIsDecorativeAnd48px: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Integrations', description: 'Connect the tools.', icon: Plug },
  play: async ({ canvasElement, canvas }) => {
    const tile = canvasElement.querySelector('[aria-hidden="true"]') as HTMLElement;
    await expect(tile.querySelector('svg')).not.toBeNull();
    const box = tile.getBoundingClientRect();
    await expect([box.width, box.height]).toEqual([48, 48]);
    // Before the title, and the title is still the page's only name for itself.
    expectBeyondEnd(canvas.getByRole('heading', { name: 'Integrations' }), tile);
    await expect(canvas.getAllByRole('heading')).toHaveLength(1);
  },
};

export const WithoutIconHasNoTile: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Integrations', description: 'Connect the tools.' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-hidden="true"]')).toBeNull();
  },
};

/** Below `sm` the tile drops to 40px and the title column keeps its wrap behaviour. */
export const MobileWithIcon: Story = {
  globals: mobileViewport,
  args: {
    title: 'Integrations',
    description: 'Connect the tools your team already uses.',
    icon: Plug,
    actions: (
      <PageActionButton icon={Plus} variant="primary">
        Add integration
      </PageActionButton>
    ),
  },
  play: async ({ canvasElement, canvas }) => {
    expectNoHorizontalOverflow();
    const tile = canvasElement.querySelector('[aria-hidden="true"]') as HTMLElement;
    await expect(tile.getBoundingClientRect().width).toBe(40);
    const title = canvas.getByRole('heading', { name: 'Integrations' }).getBoundingClientRect();
    const button = canvas.getByRole('button', { name: 'Add integration' }).getBoundingClientRect();
    // The actions wrap under the title column instead of squeezing it.
    await expect(button.top).toBeGreaterThanOrEqual(title.bottom);
  },
};

// ── Breadcrumb above the title ───────────────────────────────────────────────

const TRAIL = (
  <Breadcrumb
    homeIcon
    items={[{ label: 'Support', href: '#' }, { label: 'Tickets', href: '#' }, { label: '#4821' }]}
  />
);

/** The breadcrumb sits above the title, and the description stays under it. */
export const WithBreadcrumbAndDescription: Story = {
  args: {
    title: 'Checkout fails with a 502 on the EU payment gateway',
    as: 'h1',
    description: 'Opened by Ana Costa, assigned to the payments team.',
    breadcrumb: TRAIL,
    actions: (
      <PageActionButton icon={Plus} variant="primary">
        Reply
      </PageActionButton>
    ),
  },
  play: async ({ canvas }) => {
    const trail = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    const title = canvas.getByRole('heading', { name: /Checkout fails/ });
    const description = canvas.getByText(/Opened by Ana Costa/);
    await expect(trail.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      title.getBoundingClientRect().top
    );
    await expect(title.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      description.getBoundingClientRect().top
    );
  },
};

export const BreadcrumbComesBeforeTheTitleInTheDom: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Order #20431', description: 'Placed on 3 March.', breadcrumb: TRAIL },
  play: async ({ canvas }) => {
    const trail = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    const title = canvas.getByRole('heading', { name: 'Order #20431' });
    await expect(
      trail.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    // The description is no longer an alternative to the breadcrumb.
    await expect(canvas.getByText('Placed on 3 March.')).toBeInTheDocument();
  },
};

/**
 * Below `sm` the actions wrap under the meta items, at the start of the line, even when they would
 * fit beside the title. The icon tile stays beside the text column, which holds the breadcrumb.
 */
export const MobileBreadcrumbMetaAndActions: Story = {
  globals: mobileViewport,
  args: {
    title: 'Checkout fails with a 502',
    as: 'h1',
    description: 'Opened by Ana Costa.',
    breadcrumb: TRAIL,
    icon: Plug,
    meta: (
      <>
        <PageHeader.MetaItem icon={Server}>payments-gw</PageHeader.MetaItem>
        <PageHeader.MetaItem icon={Clock}>Open 3 days</PageHeader.MetaItem>
      </>
    ),
    actions: <PageActionButton icon={RefreshCw} aria-label="Refresh" />,
  },
  play: async ({ canvasElement, canvas }) => {
    expectNoHorizontalOverflow();
    const tile = canvasElement.querySelector('[aria-hidden="true"]') as HTMLElement;
    const trail = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    const lastMeta = canvas.getByText('Open 3 days').getBoundingClientRect();
    const button = canvas.getByRole('button', { name: 'Refresh' });
    // The tile is beside the text column: level with the breadcrumb, which leads it.
    await expect(tile.getBoundingClientRect().top).toBeLessThanOrEqual(
      trail.getBoundingClientRect().top + 1
    );
    expectBeyondEnd(trail, tile);
    // The actions are under the meta, and start where the header starts.
    await expect(button.getBoundingClientRect().top).toBeGreaterThanOrEqual(lastMeta.bottom);
    await expect(
      Math.abs(button.getBoundingClientRect().left - tile.getBoundingClientRect().left)
    ).toBeLessThanOrEqual(1);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The title starts at the start edge, the actions end at the end edge, the icon tile leads the title. */
export const FollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'Integrations', description: 'Connect the tools.', icon: Plug },
  render: (args) =>
    bothDirections(() => (
      <PageHeader
        {...args}
        meta={
          <div className="flex gap-x-6">
            <PageHeader.MetaItem icon={MapPin}>Lisbon</PageHeader.MetaItem>
            <PageHeader.MetaItem icon={Cpu}>64 cores, 512 GB</PageHeader.MetaItem>
          </div>
        }
        actions={<PageActionButton icon={Plus}>New rule</PageActionButton>}
      />
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('[aria-hidden="true"]'));
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('heading', { name: 'Integrations' })
    );
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const action = within(box).getByRole('button', { name: 'New rule' });
      // The actions end at the end edge of the header, the title is not under them.
      expect(endOffset(action, box)).toBeLessThanOrEqual(1);
      expectBeyondEnd(action, within(box).getByRole('heading', { name: 'Integrations' }));
      // The meta icon leads its text: it is at the start of the item.
      const meta = within(box).getByText('Lisbon').closest('div')!;
      const icon = meta.querySelector('svg')!;
      expect(startOffset(icon, meta)).toBeLessThan(endOffset(icon, meta));
      // Its gap to the text is on the end side of the icon, in both directions.
      expect(getComputedStyle(icon).marginInlineEnd, `${dir}: icon gap`).toBe('6px');
      // A meta text that starts with a number keeps its order: "64 cores", not "cores 64".
      expectReadsLeftToRight(within(box).getByText('64 cores, 512 GB'));
      // The title is an island: its own direction, whatever the header's.
      const title = within(box)
        .getByRole('heading', { name: 'Integrations' })
        .querySelector('bdi')!;
      expect(getComputedStyle(title).unicodeBidi, `${dir}: title`).toBe('isolate');
    }
  },
};
