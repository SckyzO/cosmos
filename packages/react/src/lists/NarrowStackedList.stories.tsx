import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from 'react';
import { expect } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
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
  { name: 'Aiden Park', email: 'aiden.park@example.com', av: placeholderAvatar('Aiden Park', 96) },
  { name: 'Mei Tanaka', email: 'mei.tanaka@example.com', av: placeholderAvatar('Mei Tanaka', 96) },
  {
    name: 'Olivier Dubois',
    email: 'olivier.dubois@example.com',
    av: placeholderAvatar('Olivier Dubois', 96),
  },
  {
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    av: placeholderAvatar('Priya Singh', 96),
  },
];

const PEOPLE_GROUPED: Record<string, typeof PEOPLE> = {
  A: [
    {
      name: 'Aiden Park',
      email: 'aiden.park@example.com',
      av: placeholderAvatar('Aiden Park', 96),
    },
    {
      name: 'Aubrey Pham',
      email: 'aubrey.pham@example.com',
      av: placeholderAvatar('Aubrey Pham', 96),
    },
  ],
  M: [
    {
      name: 'Mei Tanaka',
      email: 'mei.tanaka@example.com',
      av: placeholderAvatar('Mei Tanaka', 96),
    },
    {
      name: 'Marcus Bell',
      email: 'marcus.bell@example.com',
      av: placeholderAvatar('Marcus Bell', 96),
    },
  ],
  O: [
    {
      name: 'Olivier Dubois',
      email: 'olivier.dubois@example.com',
      av: placeholderAvatar('Olivier Dubois', 96),
    },
  ],
  P: [
    {
      name: 'Priya Singh',
      email: 'priya.singh@example.com',
      av: placeholderAvatar('Priya Singh', 96),
    },
  ],
};

const NOTES = [
  {
    name: 'Aiden Park',
    ago: '1d ago',
    body: 'Investigated the prom-stack pod restart loop after the upgrade. Root cause was a stale config map referencing a removed metric exporter.',
    av: placeholderAvatar('Aiden Park', 96),
  },
  {
    name: 'Mei Tanaka',
    ago: '4h ago',
    body: 'Pushed the hotfix for the Grafana datasource provisioning. Need to backport to the LTS branch before Friday.',
    av: placeholderAvatar('Mei Tanaka', 96),
  },
  {
    name: 'Olivier Dubois',
    ago: 'just now',
    body: 'Drafted the runbook for the OTLP receiver promotion. Awaiting review from Aiden.',
    av: placeholderAvatar('Olivier Dubois', 96),
  },
];

const Avatar = ({ src }: { src: string }) => (
  <img src={src} alt="" className="size-12 flex-none rounded-full bg-gray-50 dark:bg-gray-800" />
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
  // The list does not scroll: this wrapper does. Nothing in it takes focus, so the wrapper
  // does, as a named region, to be scrolled from the keyboard.
  render: () => (
    <div
      role="region"
      aria-label="People"
      tabIndex={0}
      className="focus-visible:focus-indicator max-h-96 max-w-md overflow-y-auto bg-white focus-visible:ring-inset dark:bg-gray-900"
    >
      <NarrowStackedList>
        {Object.entries(PEOPLE_GROUPED).map(([letter, group]) => (
          <Fragment key={letter}>
            <NarrowStackedList.Header sticky>{letter}</NarrowStackedList.Header>
            {group.map((p) => (
              <NarrowStackedList.Item
                key={p.email}
                className="px-3"
                avatar={<Avatar src={p.av} />}
                title={p.name}
                subtitle={p.email}
              />
            ))}
          </Fragment>
        ))}
      </NarrowStackedList>
    </div>
  ),
  play: async ({ canvas }) => {
    // One list whose children are all list items, headers included.
    const items = Array.from(canvas.getByRole('list').children);
    await expect(items.map((el) => el.tagName)).toEqual(items.map(() => 'LI'));
  },
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
                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-white/10 dark:hover:bg-gray-700"
              >
                View<span className="sr-only">, {p.name}</span>
              </a>
            }
          />
        ))}
      </NarrowStackedList>
    </div>
  ),
  play: async ({ canvas }) => {
    // Each View link names its person for screen readers.
    for (const p of PEOPLE) {
      const name = new RegExp(`^View\\s*, ${p.name}$`);
      await expect(canvas.getByRole('link', { name })).toBeInTheDocument();
    }
  },
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

/** `trailing` still renders when `timestamp` or `description` switches to the two-row layout. */
export const TrailingRendersWithDescription: Story = {
  render: () => (
    <div className="max-w-2xl">
      <NarrowStackedList>
        <NarrowStackedList.Item
          avatar={<Avatar src={NOTES[1]!.av} />}
          title={NOTES[1]!.name}
          timestamp={<time>{NOTES[1]!.ago}</time>}
          description={NOTES[1]!.body}
          trailing={
            <button
              type="button"
              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-white/10 dark:hover:bg-gray-700"
            >
              Reply
            </button>
          }
        />
      </NarrowStackedList>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText(NOTES[1]!.body)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Reply' })).toBeVisible();
  },
};

// Alpha channel of a computed CSS colour: `rgba(…, a)`, `oklab(… / a)` or opaque.
const alphaOf = (color: string) => {
  const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
  if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
  const rgba = color.match(/^rgba\(.*,\s*([\d.]+)\)$/);
  return rgba ? Number(rgba[1]) : 1;
};

/** A sticky header must be opaque in dark themes, or the rows scrolling under it show through. */
export const StickyHeaderIsOpaqueInDarkThemes: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <NarrowStackedList>
      <NarrowStackedList.Header sticky>A</NarrowStackedList.Header>
      <NarrowStackedList.Item title="Aiden Park" subtitle="aiden.park@example.com" />
    </NarrowStackedList>
  ),
  play: async ({ canvas }) => {
    await expect(document.documentElement).toHaveClass('dark');
    const header = canvas.getByText('A');
    await expect(alphaOf(getComputedStyle(header).backgroundColor)).toBe(1);
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
