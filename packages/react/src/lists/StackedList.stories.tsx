import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, MoreVertical } from 'lucide-react';
import { expect } from 'storybook/test';
import { StackedList } from './StackedList';

const meta = {
  title: 'Lists/Stacked List',
  component: StackedList,
  subcomponents: { 'StackedList.Item': StackedList.Item },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof StackedList>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample data — neutral, monitoring-flavored, no TUI brand names ───────────
type Service = {
  name: string;
  email: string;
  role: string;
  lastSeen?: string;
  online?: boolean;
  avatar: string;
};

const SERVICES: Service[] = [
  {
    name: 'Aiden Park',
    email: 'aiden.park@example.com',
    role: 'SRE Lead',
    lastSeen: '3h ago',
    avatar:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Mei Tanaka',
    email: 'mei.tanaka@example.com',
    role: 'Platform Engineer',
    lastSeen: '12m ago',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Olivier Dubois',
    email: 'olivier.dubois@example.com',
    role: 'Observability',
    online: true,
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    role: 'Backend Engineer',
    lastSeen: '1d ago',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
];

const Avatar = ({ src }: { src: string }) => (
  <img
    src={src}
    alt=""
    className="size-12 flex-none rounded-full bg-gray-50 dark:bg-gray-800"
  />
);

const MetaWithTimestamp = ({ role, lastSeen }: { role: string; lastSeen: string }) => (
  <>
    <p className="text-sm/6 text-gray-900 dark:text-white">{role}</p>
    <p className="mt-1 text-xs/5 text-gray-500 dark:text-gray-400">
      Last seen <time>{lastSeen}</time>
    </p>
  </>
);

const MetaWithStatus = ({ role }: { role: string }) => (
  <>
    <p className="text-sm/6 text-gray-900 dark:text-white">{role}</p>
    <div className="mt-1 flex items-center gap-x-1.5">
      <div className="flex-none rounded-full bg-emerald-500/20 p-1">
        <div className="size-1.5 rounded-full bg-emerald-500" />
      </div>
      <p className="text-xs/5 text-gray-500 dark:text-gray-400">Online</p>
    </div>
  </>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Simple: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={
            s.online ? (
              <MetaWithStatus role={s.role} />
            ) : (
              <MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />
            )
          }
        />
      ))}
    </StackedList>
  ),
};

export const WithLinks: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          href={`/users/${encodeURIComponent(s.email)}`}
          chevron
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={
            s.online ? (
              <MetaWithStatus role={s.role} />
            ) : (
              <MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />
            )
          }
        />
      ))}
    </StackedList>
  ),
};

export const WithActionsMenu: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={<MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? '—'} />}
          trailing={
            <button
              type="button"
              aria-label={`Actions for ${s.name}`}
              className="flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              <MoreVertical className="size-5" aria-hidden />
            </button>
          }
        />
      ))}
    </StackedList>
  ),
};

export const NoSubtitle: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
        />
      ))}
    </StackedList>
  ),
};

export const NoAvatar: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          title={s.name}
          subtitle={s.email}
          meta={<MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? '—'} />}
        />
      ))}
    </StackedList>
  ),
};

export const WithLeadingIcon: Story = {
  render: () => (
    <StackedList>
      {[
        { name: 'api-prod-01', meta: 'us-east-1 · 12 vCPU' },
        { name: 'pg-primary', meta: 'eu-west-3 · 64 GB RAM' },
        { name: 'edge-cdn', meta: 'global · 152 PoPs' },
      ].map((s) => (
        <StackedList.Item
          key={s.name}
          avatar={
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
              <Activity className="size-5" aria-hidden />
            </span>
          }
          title={s.name}
          subtitle={s.meta}
        />
      ))}
    </StackedList>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsUlWithRoleList: Story = {
  render: () => (
    <StackedList data-testid="sl">
      <StackedList.Item title="One" />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul[data-testid="sl"]');
    await expect(ul).not.toBeNull();
    await expect(ul).toHaveAttribute('role', 'list');
    await expect(ul?.className ?? '').toMatch(/divide-y/);
  },
};

export const ItemRendersTitleAndSubtitle: Story = {
  render: () => (
    <StackedList>
      <StackedList.Item title="Aiden Park" subtitle="aiden@ex.com" />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Aiden Park')).toBeInTheDocument();
    await expect(canvas.getByText('aiden@ex.com')).toBeInTheDocument();
  },
};

export const HrefMakesRowLinkAndChevronShows: Story = {
  render: () => (
    <StackedList>
      <StackedList.Item href="/x" chevron title="Linked Row" data-testid="li" />
    </StackedList>
  ),
  play: async ({ canvas, canvasElement }) => {
    const link = canvas.getByRole('link', { name: /linked row/i });
    await expect(link).toHaveAttribute('href', '/x');
    const li = canvasElement.querySelector('[data-testid="li"]');
    await expect(li?.className ?? '').toMatch(/relative/);
    // chevron icon (ChevronRight from lucide) renders as svg with class size-5
    const svg = li?.querySelector('svg.size-5');
    await expect(svg).not.toBeNull();
  },
};

export const MetaIsHiddenOnMobileViewport: Story = {
  render: () => (
    <StackedList>
      <StackedList.Item
        title="X"
        meta={<p data-testid="meta">meta-content</p>}
      />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const meta = canvasElement.querySelector('[data-testid="meta"]');
    const wrapper = meta?.parentElement;
    // The wrapper has `hidden sm:flex` per TUI pattern
    await expect(wrapper?.className ?? '').toMatch(/hidden/);
    await expect(wrapper?.className ?? '').toMatch(/sm:flex/);
  },
};
