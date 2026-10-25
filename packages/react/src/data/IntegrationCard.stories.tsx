import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import {
  Bell,
  Calendar,
  Database,
  FolderKanban,
  Mail,
  MessageSquare,
  Hash,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { IntegrationCard } from './IntegrationCard';

const meta = {
  title: 'Data/Integration Card',
  component: IntegrationCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { logo: null as ReactNode, name: 'Integration' },
} satisfies Meta<typeof IntegrationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const ColoredIcon = ({ icon: Icon, color }: { icon: LucideIcon; color: string }) => (
  <Icon className={color} />
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Available: Story = {
  args: {
    logo: <ColoredIcon icon={Mail} color="text-orange-500" />,
    name: 'Mailchimp',
    description: 'Email marketing platform — sync your contact lists and campaigns.',
    status: 'available',
    category: 'Marketing',
    actionLabel: 'Connect',
    onAction: fn(),
  },
};

export const Connected: Story = {
  args: {
    logo: <ColoredIcon icon={Hash} color="text-violet-500" />,
    name: 'Hash',
    description: 'Send incident alerts to a channel and respond from chat.',
    status: 'connected',
    category: 'Communication',
    actionLabel: 'Disconnect',
    actionIntent: 'danger',
    secondaryLabel: 'Configure',
    onAction: fn(),
    onSecondary: fn(),
  },
};

export const Error: Story = {
  args: {
    logo: <ColoredIcon icon={Database} color="text-blue-500" />,
    name: 'PostgreSQL',
    description: 'Connection failed — credentials may have expired.',
    status: 'error',
    category: 'Storage',
    actionLabel: 'Reconnect',
    secondaryLabel: 'Logs',
    onAction: fn(),
    onSecondary: fn(),
  },
};

export const Pending: Story = {
  args: {
    logo: <ColoredIcon icon={Bell} color="text-amber-500" />,
    name: 'PagerDuty',
    description: 'Awaiting OAuth confirmation — check your email to finish.',
    status: 'pending',
    category: 'Alerting',
    actionLabel: 'Resend invite',
    onAction: fn(),
  },
};

export const NoStatus: Story = {
  args: {
    logo: <ColoredIcon icon={Calendar} color="text-rose-500" />,
    name: 'Calendar',
    description: 'Sync maintenance windows with Google Calendar.',
    actionLabel: 'Add',
    onAction: fn(),
  },
};

/** `meta` is a line under the description: a sync time, a version, a count. */
export const WithMeta: Story = {
  args: {
    logo: <ColoredIcon icon={Hash} color="text-violet-500" />,
    name: 'Hash',
    description: 'Send incident alerts to a channel and respond from chat.',
    status: 'connected',
    category: 'Communication',
    meta: 'Last synced 2 min ago · 14 channels',
    actionLabel: 'Disconnect',
    actionIntent: 'danger',
    onAction: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Last synced 2 min ago · 14 channels')).toBeInTheDocument();
  },
};

export const NoActions: Story = {
  args: {
    logo: <ColoredIcon icon={Video} color="text-blue-600" />,
    name: 'Zoom',
    description: 'Read-only — managed by your workspace admin.',
    status: 'connected',
    category: 'Communication',
  },
};

export const Loading: Story = {
  args: {
    logo: <ColoredIcon icon={Mail} color="text-orange-500" />,
    name: 'Mailchimp',
    description: 'Email marketing platform — sync your contact lists and campaigns.',
    status: 'pending',
    category: 'Marketing',
    actionLabel: 'Connecting…',
    onAction: fn(),
    loading: true,
  },
};

// ── Real grid integration ────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    logo: Mail,
    color: 'text-orange-500',
    name: 'Mailchimp',
    description: 'Email marketing.',
    category: 'Marketing',
    status: 'available' as const,
  },
  {
    logo: Hash,
    color: 'text-violet-500',
    name: 'Hash',
    description: 'Incident alerts in chat.',
    category: 'Communication',
    status: 'connected' as const,
    actionVariant: 'primary' as const,
  },
  {
    logo: Video,
    color: 'text-blue-600',
    name: 'Zoom',
    description: 'Spin up incident calls.',
    category: 'Communication',
    status: 'connected' as const,
    actionVariant: 'secondary' as const,
  },
  {
    logo: MessageSquare,
    color: 'text-pink-500',
    name: 'Loom',
    description: 'Async video updates.',
    category: 'Communication',
    status: 'available' as const,
  },
  {
    logo: FolderKanban,
    color: 'text-violet-600',
    name: 'Linear',
    description: 'Auto-create tickets from incidents.',
    category: 'Productivity',
    status: 'connected' as const,
    actionVariant: 'soft' as const,
  },
  {
    logo: Database,
    color: 'text-blue-500',
    name: 'Postgres',
    description: 'Sample query metrics.',
    category: 'Storage',
    status: 'error' as const,
  },
];

/**
 * The three connected cards show the three emphases a destructive action can take
 * (`actionVariant` with `actionIntent="danger"`): `primary`, `secondary` (outlined) and
 * `soft` (tinted). On a grid, `secondary` or `soft` keeps it from being the loudest
 * element of every card.
 */
export const Grid: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {INTEGRATIONS.map((i) => {
        const Icon = i.logo;
        return (
          <IntegrationCard
            key={i.name}
            logo={<Icon className={i.color} />}
            name={i.name}
            description={i.description}
            category={i.category}
            status={i.status}
            actionLabel={i.status === 'connected' ? 'Disconnect' : 'Connect'}
            actionVariant={i.actionVariant}
            actionIntent={i.status === 'connected' ? 'danger' : 'brand'}
            secondaryLabel="Details"
            onAction={fn()}
            onSecondary={fn()}
          />
        );
      })}
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    return (
      <div className="max-w-sm">
        <IntegrationCard
          logo={<Hash className="text-violet-500" />}
          name="Hash"
          description="Send incident alerts to a channel."
          category="Communication"
          status={connected ? 'connected' : 'available'}
          actionLabel={connected ? 'Disconnect' : 'Connect'}
          actionIntent={connected ? 'danger' : 'brand'}
          loading={loading}
          onAction={() => {
            setLoading(true);
            window.setTimeout(() => {
              setConnected((c) => !c);
              setLoading(false);
            }, 1200);
          }}
        />
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickPrimaryFiresHandler: Story = {
  tags: ['!dev'],
  args: {
    logo: <Mail />,
    name: 'Mailchimp',
    actionLabel: 'Connect',
    onAction: fn(),
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Connect' }));
    await expect(args.onAction).toHaveBeenCalledTimes(1);
  },
};

export const ClickSecondaryFiresHandler: Story = {
  tags: ['!dev'],
  args: {
    logo: <Hash />,
    name: 'Hash',
    actionLabel: 'Disconnect',
    secondaryLabel: 'Configure',
    onAction: fn(),
    onSecondary: fn(),
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Configure' }));
    await expect(args.onSecondary).toHaveBeenCalledTimes(1);
    await expect(args.onAction).not.toHaveBeenCalled();
  },
};

export const LoadingDisablesActions: Story = {
  tags: ['!dev'],
  args: {
    logo: <Mail />,
    name: 'Mailchimp',
    actionLabel: 'Connect',
    secondaryLabel: 'Details',
    loading: true,
    onAction: fn(),
    onSecondary: fn(),
  },
  play: async ({ canvas }) => {
    const action = canvas.getByRole('button', { name: 'Connect' });
    const secondary = canvas.getByRole('button', { name: 'Details' });
    await expect(action).toBeDisabled();
    await expect(secondary).toBeDisabled();
  },
};

/** `actionIntent` colors the action button, and the status badge follows the status. */
export const ActionIntentAndStatusColors: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <IntegrationCard
        logo={<Hash />}
        name="Hash"
        status="connected"
        actionLabel="Disconnect"
        actionIntent="danger"
      />
      <IntegrationCard logo={<Mail />} name="Mail" status="available" actionLabel="Connect" />
      <IntegrationCard logo={<Video />} name="Video" status="error" />
      <IntegrationCard logo={<Bell />} name="Bell" status="pending" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Disconnect' })).toHaveClass(
      'bg-red-600',
      'text-white'
    );
    await expect(canvas.getByRole('button', { name: 'Connect' })).toHaveClass('bg-brand-500');
    const badge = (label: string) => canvas.getByText(label).parentElement!;
    await expect(badge('Connected')).toHaveClass('bg-green-100', 'text-green-700');
    await expect(badge('Available')).toHaveClass('bg-gray-100', 'text-gray-700');
    await expect(badge('Error')).toHaveClass('bg-red-100', 'text-red-700');
    await expect(badge('Pending')).toHaveClass('bg-amber-100', 'text-amber-700');
  },
};

/** The category is a small label, and sized in `text-2xs` so it follows the text size setting. */
export const CategoryUsesTheSmallLabelSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { logo: <Mail />, name: 'Mailchimp', category: 'Marketing' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Marketing')).toHaveClass('text-2xs');
  },
};

/** Loading only disables the actions: the description stays on the card. */
export const LoadingKeepsTheDescription: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    logo: <Mail />,
    name: 'Mailchimp',
    description: 'Email marketing platform.',
    actionLabel: 'Connect',
    loading: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Email marketing platform.')).toBeVisible();
  },
};
