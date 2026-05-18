import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { NarrowStackedList } from './NarrowStackedList';

const meta = {
  title: 'Lists/Narrow Stacked List',
  component: NarrowStackedList,
  subcomponents: {
    'NarrowStackedList.Item': NarrowStackedList.Item,
    'NarrowStackedList.Header': NarrowStackedList.Header,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof NarrowStackedList>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample data (neutral, monitoring-flavored) ───────────────────────────────

const PEOPLE = [
  { name: 'Aiden Park', email: 'aiden.park@example.com', av: 'https://i.pravatar.cc/96?u=aiden' },
  { name: 'Mei Tanaka', email: 'mei.tanaka@example.com', av: 'https://i.pravatar.cc/96?u=mei' },
  { name: 'Olivier Dubois', email: 'olivier.dubois@example.com', av: 'https://i.pravatar.cc/96?u=olivier' },
  { name: 'Priya Singh', email: 'priya.singh@example.com', av: 'https://i.pravatar.cc/96?u=priya' },
];

const PEOPLE_GROUPED: Record<string, typeof PEOPLE> = {
  A: [
    { name: 'Aiden Park', email: 'aiden.park@example.com', av: 'https://i.pravatar.cc/96?u=aiden' },
    { name: 'Aubrey Pham', email: 'aubrey.pham@example.com', av: 'https://i.pravatar.cc/96?u=aubrey' },
  ],
  M: [
    { name: 'Mei Tanaka', email: 'mei.tanaka@example.com', av: 'https://i.pravatar.cc/96?u=mei' },
    { name: 'Marcus Bell', email: 'marcus.bell@example.com', av: 'https://i.pravatar.cc/96?u=marcus' },
  ],
  O: [
    { name: 'Olivier Dubois', email: 'olivier.dubois@example.com', av: 'https://i.pravatar.cc/96?u=olivier' },
  ],
  P: [
    { name: 'Priya Singh', email: 'priya.singh@example.com', av: 'https://i.pravatar.cc/96?u=priya' },
  ],
};

const NOTES = [
  {
    name: 'Aiden Park',
    ago: '1d ago',
    body: 'Investigated the prom-stack pod restart loop after the upgrade. Root cause was a stale config map referencing a removed metric exporter.',
    av: 'https://i.pravatar.cc/96?u=aiden',
  },
  {
    name: 'Mei Tanaka',
    ago: '4h ago',
    body: 'Pushed the hotfix for the Grafana datasource provisioning. Need to backport to the LTS branch before Friday.',
    av: 'https://i.pravatar.cc/96?u=mei',
  },
  {
    name: 'Olivier Dubois',
    ago: 'just now',
    body: 'Drafted the runbook for the OTLP receiver promotion. Awaiting review from Aiden.',
    av: 'https://i.pravatar.cc/96?u=olivier',
  },
];

const Avatar = ({ src }: { src: string }) => (
  <img
    src={src}
    alt=""
    className="size-12 flex-none rounded-full bg-gray-50 dark:bg-gray-800"
  />
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Narrow: Story = {
  render: () => (
    <div className="max-w-md">
      <NarrowStackedList>
        {PEOPLE.map((p) => (
          <NarrowStackedList.Item
            key={p.email}
            avatar={<Avatar src={p.av} />}
            title={p.name}
            subtitle={p.email}
          />
        ))}
      </NarrowStackedList>
    </div>
  ),
};

export const StickyHeadings: Story = {
  render: () => (
    <div className="max-w-md max-h-96 overflow-y-auto bg-white dark:bg-gray-900">
      <NarrowStackedList>
        {Object.entries(PEOPLE_GROUPED).map(([letter, group]) => (
          <NarrowStackedList key={letter} className="contents">
            <NarrowStackedList.Header sticky>{letter}</NarrowStackedList.Header>
            {group.map((p) => (
              <NarrowStackedList.Item
                key={p.email}
                avatar={<Avatar src={p.av} />}
                title={p.name}
                subtitle={p.email}
              />
            ))}
          </NarrowStackedList>
        ))}
      </NarrowStackedList>
    </div>
  ),
};

export const WithActions: Story = {
  render: () => (
    <div className="max-w-md">
      <NarrowStackedList>
        {PEOPLE.map((p) => (
          <NarrowStackedList.Item
            key={p.email}
            avatar={<Avatar src={p.av} />}
            title={p.name}
            subtitle={p.email}
            trailing={
              <a
                href={`/users/${encodeURIComponent(p.email)}`}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 ring-1 shadow-sm ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-white/10 dark:hover:bg-gray-700"
              >
                View
              </a>
            }
          />
        ))}
      </NarrowStackedList>
    </div>
  ),
};

export const WithTruncatedDescription: Story = {
  render: () => (
    <div className="max-w-2xl">
      <NarrowStackedList>
        {NOTES.map((n) => (
          <NarrowStackedList.Item
            key={n.name + n.body}
            avatar={<Avatar src={n.av} />}
            title={n.name}
            timestamp={<time>{n.ago}</time>}
            description={n.body}
          />
        ))}
      </NarrowStackedList>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsUlWithRoleListAndDivider: Story = {
  render: () => (
    <NarrowStackedList data-testid="nsl">
      <NarrowStackedList.Item title="One" />
    </NarrowStackedList>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul[data-testid="nsl"]');
    await expect(ul).not.toBeNull();
    await expect(ul).toHaveAttribute('role', 'list');
    await expect(ul?.className ?? '').toMatch(/divide-y/);
  },
};

export const SimpleItemHasNoJustifyBetween: Story = {
  render: () => (
    <NarrowStackedList>
      <NarrowStackedList.Item title="X" subtitle="y" data-testid="li" />
    </NarrowStackedList>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[data-testid="li"]');
    await expect(li?.className ?? '').toMatch(/flex gap-x-4 py-5/);
    await expect(li?.className ?? '').not.toMatch(/justify-between/);
  },
};

export const TrailingForcesJustifyBetween: Story = {
  render: () => (
    <NarrowStackedList>
      <NarrowStackedList.Item
        title="X"
        subtitle="y"
        trailing={<button>act</button>}
        data-testid="li"
      />
    </NarrowStackedList>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[data-testid="li"]');
    await expect(li?.className ?? '').toMatch(/justify-between/);
  },
};

export const DescriptionTriggersRichLayout: Story = {
  render: () => (
    <NarrowStackedList>
      <NarrowStackedList.Item
        title="Title"
        description="A long description that will be line-clamped at two lines so the row stays compact even with a paragraph of text."
        timestamp={<time>1h</time>}
        data-testid="li"
      />
    </NarrowStackedList>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[data-testid="li"]');
    await expect(li?.querySelector('.line-clamp-2')).not.toBeNull();
    await expect(li?.querySelector('time')).not.toBeNull();
  },
};

export const HeaderRendersWithBackgroundAndStickyClass: Story = {
  render: () => (
    <NarrowStackedList>
      <NarrowStackedList.Header sticky data-testid="h">
        A
      </NarrowStackedList.Header>
      <NarrowStackedList.Item title="One" />
    </NarrowStackedList>
  ),
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector('[data-testid="h"]');
    await expect(h?.className ?? '').toMatch(/bg-gray-50/);
    await expect(h?.className ?? '').toMatch(/sticky/);
  },
};
