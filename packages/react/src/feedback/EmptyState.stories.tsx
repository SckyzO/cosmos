import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  CalendarClock,
  CheckCheck,
  Plus,
  SearchX,
  Sparkles,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState, type EmptyStateIntent } from './EmptyState';

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

/** A first run: nothing to show yet, and the user can fix that. */
export const NoDataYet: Story = {
  args: {
    intent: 'brand',
    icon: Sparkles,
    title: 'No data yet',
    description: 'Metrics show up here once the first node reports.',
    action: (
      <Button size="sm" icon={Plus}>
        Add a node
      </Button>
    ),
  },
};

/** Nothing left to do: the tile says so, the title stays neutral. */
export const AllCaughtUp: Story = {
  args: {
    intent: 'success',
    icon: CheckCheck,
    title: "You're all caught up",
    description: 'No alert needs your attention.',
  },
};

/** A source is out of reach. A failure that needs a retry is an `ErrorState`, not an `intent="danger"`. */
export const NoConnection: Story = {
  args: {
    intent: 'warning',
    icon: WifiOff,
    title: 'No internet connection',
    description: 'This list fills in again when the connection is back.',
  },
};

type Case = { intent: EmptyStateIntent; icon: LucideIcon; title: string; description: string };

const CASES: Case[] = [
  {
    intent: 'neutral',
    icon: SearchX,
    title: 'No results',
    description: 'Try a different search term.',
  },
  {
    intent: 'brand',
    icon: Sparkles,
    title: 'No data yet',
    description: 'Metrics show up here once the first node reports.',
  },
  {
    intent: 'info',
    icon: CalendarClock,
    title: 'Nothing scheduled',
    description: 'Maintenance windows you plan appear here.',
  },
  {
    intent: 'success',
    icon: CheckCheck,
    title: "You're all caught up",
    description: 'No alert needs your attention.',
  },
  {
    intent: 'warning',
    icon: WifiOff,
    title: 'No internet connection',
    description: 'This list fills in again when the connection is back.',
  },
];

/** Every `intent` with an `icon` of its own: the tile carries the meaning, the title does not. */
export const Intents: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CASES.map((c) => (
        <div key={c.intent} className="rounded-xl border border-[var(--color-border)]">
          <EmptyState {...c} compact />
        </div>
      ))}
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The tile is the sibling before the text block that holds the title.
// The title is isolated in a `bdi`: the tile is before the block that holds its paragraph.
const tileOf = (title: HTMLElement) => title.closest('p')!.parentElement!.previousElementSibling!;

const TILE: Record<EmptyStateIntent, string> = {
  neutral: 'bg-gray-100',
  brand: 'bg-brand-50',
  info: 'bg-blue-50',
  success: 'bg-green-50',
  warning: 'bg-amber-50',
};

const ICON_COLOR: Record<EmptyStateIntent, string> = {
  neutral: 'text-gray-500',
  brand: 'text-brand-600',
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
};

// Lucide names each icon's class after it: the pictogram drawn is the one passed.
const ICON_NAME: Record<EmptyStateIntent, string> = {
  neutral: 'lucide-search-x',
  brand: 'lucide-sparkles',
  info: 'lucide-calendar-clock',
  success: 'lucide-check-check',
  warning: 'lucide-wifi-off',
};

/** Without props the tile is still the neutral one, holding `Inbox`; an `intent` alone keeps `Inbox`. */
export const DefaultsToTheNeutralInbox: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <EmptyState title="plain" />
      <EmptyState title="success only" intent="success" />
    </div>
  ),
  play: async ({ canvas }) => {
    const plain = tileOf(canvas.getByText('plain'));
    await expect(plain).toHaveClass(TILE.neutral);
    await expect(plain.querySelector('svg')).toHaveClass('lucide-inbox', ICON_COLOR.neutral);

    // The intent tints the tile; the pictogram stays the caller's choice.
    const success = tileOf(canvas.getByText('success only'));
    await expect(success).toHaveClass(TILE.success);
    await expect(success.querySelector('svg')).toHaveClass('lucide-inbox', ICON_COLOR.success);
  },
};

/** Each `intent` tints the tile and the icon, and an `icon` replaces `Inbox`; the title stays neutral. */
export const IntentAndIconReachTheTile: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      {CASES.map((c) => (
        <EmptyState key={c.intent} {...c} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const neutralTile = getComputedStyle(tileOf(canvas.getByText('No results'))).backgroundColor;
    for (const { intent, title } of CASES) {
      const tile = tileOf(canvas.getByText(title));
      await expect(tile).toHaveClass(TILE[intent]);
      const svg = tile.querySelector('svg')!;
      await expect(svg).toHaveClass(ICON_COLOR[intent]);
      await expect(svg).not.toHaveClass('lucide-inbox');
      await expect(svg).toHaveClass(ICON_NAME[intent]);
      // A meaning other than neutral paints a tile that is not the neutral one.
      if (intent !== 'neutral') {
        await expect(getComputedStyle(tile).backgroundColor).not.toBe(neutralTile);
      }
      // The title carries no color of its own: it would say the meaning twice.
      const titleBox = canvas.getByText(title).closest('p')!;
      await expect(titleBox).toHaveClass('text-[var(--color-text-secondary)]');
      await expect(titleBox.className).not.toMatch(/(amber|green|blue|brand)-/);
    }
  },
};

/** An empty state announces nothing, whatever its `intent`: only `ErrorState` is an alert. */
export const StaysStaticWhateverTheIntent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      {CASES.map((c) => (
        <EmptyState key={c.intent} {...c} />
      ))}
      <EmptyState title="default" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.queryByRole('status')).toBeNull();
    await expect(canvas.getByText('default').closest('[role]')).toBeNull();
    for (const { title } of CASES) {
      await expect(canvas.getByText(title).closest('[role]')).toBeNull();
    }
  },
};

/** `children` under the description: here, the steps to follow. */
export const WithSteps: Story = {
  args: {
    intent: 'brand',
    icon: Sparkles,
    title: 'Add your first exporter',
    description: 'Connect one exporter and your racks appear here within a minute.',
    children: (
      <ol className="list-decimal space-y-1 ps-5 text-start text-xs text-[var(--color-text-secondary)]">
        <li>Install node_exporter on one compute node.</li>
        <li>Add it to a Prometheus scrape job, then reload.</li>
        <li>Paste the URL of your Prometheus server.</li>
      </ol>
    ),
    action: (
      <Button size="sm" icon={Plus}>
        Add exporter
      </Button>
    ),
  },
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list');
    await expect(list.querySelectorAll('li')).toHaveLength(3);
    // Between the description and the action.
    const description = canvas.getByText(/appear here within a minute/).getBoundingClientRect();
    const action = canvas.getByRole('button', { name: 'Add exporter' }).getBoundingClientRect();
    await expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(description.bottom);
    await expect(list.getBoundingClientRect().bottom).toBeLessThanOrEqual(action.top);
  },
};

export const ChildrenRender: Story = {
  tags: ['!dev', '!autodocs'],
  args: { title: 'No items yet', children: <p>Steps go here.</p> },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Steps go here.')).toBeInTheDocument();
  },
};
