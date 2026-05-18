import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { expect } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
import { StackedList } from './StackedList';
import { StackedListInCard } from './StackedListInCard';

const meta = {
  title: 'Lists/Stacked List In Card',
  component: StackedListInCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof StackedListInCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample data (neutral, monitoring-flavored) ───────────────────────────────

type Service = {
  name: string;
  email: string;
  role: string;
  lastSeen: string;
  avatar: string;
};

const SERVICES: Service[] = [
  {
    name: 'Aiden Park',
    email: 'aiden.park@example.com',
    role: 'SRE Lead',
    lastSeen: '3h ago',
    avatar: placeholderAvatar('Aiden Park', 96),
  },
  {
    name: 'Mei Tanaka',
    email: 'mei.tanaka@example.com',
    role: 'Platform Engineer',
    lastSeen: '12m ago',
    avatar: placeholderAvatar('Mei Tanaka', 96),
  },
  {
    name: 'Olivier Dubois',
    email: 'olivier.dubois@example.com',
    role: 'Observability',
    lastSeen: '1d ago',
    avatar: placeholderAvatar('Olivier Dubois', 96),
  },
];

const Avatar = ({ src }: { src: string }) => (
  <img
    src={src}
    alt=""
    className="size-12 flex-none rounded-full bg-gray-50 dark:bg-gray-800"
  />
);

const Meta = ({ role, lastSeen }: { role: string; lastSeen: string }) => (
  <>
    <p className="text-sm/6 text-gray-900 dark:text-white">{role}</p>
    <p className="mt-1 text-xs/5 text-gray-500 dark:text-gray-400">
      Last seen <time>{lastSeen}</time>
    </p>
  </>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <StackedListInCard>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          href={`/users/${encodeURIComponent(s.email)}`}
          chevron
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={<Meta role={s.role} lastSeen={s.lastSeen} />}
        />
      ))}
    </StackedListInCard>
  ),
};

export const NoLinks: Story = {
  render: () => (
    <StackedListInCard>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={<Meta role={s.role} lastSeen={s.lastSeen} />}
        />
      ))}
    </StackedListInCard>
  ),
};

export const WithLeadingIcon: Story = {
  render: () => (
    <StackedListInCard>
      {[
        { name: 'api-prod-01', meta: 'us-east-1 · 12 vCPU' },
        { name: 'pg-primary', meta: 'eu-west-3 · 64 GB RAM' },
        { name: 'edge-cdn', meta: 'global · 152 PoPs' },
      ].map((s) => (
        <StackedList.Item
          key={s.name}
          href={`/services/${s.name}`}
          chevron
          avatar={
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
              <Activity className="size-5" aria-hidden />
            </span>
          }
          title={s.name}
          subtitle={s.meta}
        />
      ))}
    </StackedListInCard>
  ),
};

export const InsideContainer: Story = {
  render: () => (
    <div className="bg-gray-100 p-8 dark:bg-gray-950">
      <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Team members
      </h2>
      <StackedListInCard>
        {SERVICES.map((s) => (
          <StackedList.Item
            key={s.email}
            href={`/users/${encodeURIComponent(s.email)}`}
            chevron
            avatar={<Avatar src={s.avatar} />}
            title={s.name}
            subtitle={s.email}
            meta={<Meta role={s.role} lastSeen={s.lastSeen} />}
          />
        ))}
      </StackedListInCard>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsCardWrapperWithRingAndShadow: Story = {
  render: () => (
    <StackedListInCard data-testid="card">
      <StackedList.Item title="x" />
    </StackedListInCard>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[data-testid="card"]');
    await expect(card).not.toBeNull();
    const cls = card?.className ?? '';
    await expect(cls).toMatch(/ring-1/);
    await expect(cls).toMatch(/shadow-sm/);
    await expect(cls).toMatch(/rounded-md/);
  },
};

export const ItemsReceiveHorizontalPadding: Story = {
  render: () => (
    <StackedListInCard>
      <StackedList.Item title="One" data-testid="li" />
    </StackedListInCard>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[data-testid="li"]');
    await expect(li?.className ?? '').toMatch(/px-4/);
    await expect(li?.className ?? '').toMatch(/sm:px-6/);
  },
};

export const NestedUlHasDivideY: Story = {
  render: () => (
    <StackedListInCard data-testid="card">
      <StackedList.Item title="One" />
      <StackedList.Item title="Two" />
    </StackedListInCard>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement
      .querySelector('[data-testid="card"]')
      ?.querySelector('ul');
    await expect(ul).not.toBeNull();
    await expect(ul?.className ?? '').toMatch(/divide-y/);
  },
};
