import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, ArrowRight, Bell, Mail, MessageSquare, Server, Zap } from 'lucide-react';
import { expect } from 'storybook/test';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { Button } from './Button';
import { IconBox } from './IconBox';

const meta = {
  title: 'Layout/Card',
  component: Card,
  subcomponents: {
    'Card.Header': Card.Header,
    'Card.Body': Card.Body,
    'Card.Footer': Card.Footer,
    'Card.Image': Card.Image,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Card content' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Plain: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold">Simple card</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            A flat container with default padding.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold">Larger padding</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Use <code>padding=&quot;lg&quot;</code> when content needs more breathing room.
          </p>
        </Card>
      </div>
    </Wrap>
  ),
};

export const Composed: Story = {
  render: () => (
    <Wrap>
      <Card padding="none" className="max-w-md">
        <Card.Header>
          <h3 className="text-sm font-semibold">Connection settings</h3>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Card.Header>
        <Card.Body>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure how the agent connects to your Prometheus endpoint.
          </p>
        </Card.Body>
        <Card.Footer>
          <Button variant="secondary" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </Card.Footer>
      </Card>
    </Wrap>
  ),
};

const gradientImage = (from: string, to: string, label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
       <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
       <rect width="640" height="360" fill="url(%23g)"/>
       <text x="50%" y="55%" font-family="sans-serif" font-size="48" font-weight="700" fill="white" text-anchor="middle" opacity="0.9">${label}</text>
     </svg>`
  );

export const WithImage: Story = {
  render: () => (
    <Wrap>
      <Card padding="none" className="max-w-sm">
        <Card.Image src={gradientImage('%236366f1', '%23a855f7', 'Cosmos')} alt="Cosmos cover" />
        <Card.Body>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Design system v1</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tailwind 4 tokens, React 19 components and ApexCharts wrappers.
          </p>
        </Card.Body>
      </Card>
    </Wrap>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Wrap>
      <Card padding="none" className="flex max-w-2xl flex-row">
        <Card.Image
          src={gradientImage('%2310b981', '%2306b6d4', 'Server')}
          alt="Server cover"
          aspectRatio="aspect-square"
          wrapperClassName="w-40 shrink-0"
        />
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Production datacenter
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            64 nodes · 12 racks · Frankfurt
          </p>
          <p className="mt-2 flex-1 text-sm text-gray-700 dark:text-gray-300">
            Active monitoring on every node — scrape every 15 s.
          </p>
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" size="sm" icon={ArrowRight} iconPosition="right">
              Open
            </Button>
          </div>
        </div>
      </Card>
    </Wrap>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="lg">
          <IconBox icon={Server} color="blue" />
          <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">128 servers</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Across 3 datacenters</p>
        </Card>
        <Card padding="lg">
          <IconBox icon={Zap} color="amber" />
          <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">42 GW/h</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Peak this month</p>
        </Card>
        <Card padding="lg">
          <IconBox icon={Bell} color="red" />
          <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">7 alerts</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">2 critical, 5 warnings</p>
        </Card>
      </div>
    </Wrap>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card interactive padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Hover me</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Lifts on hover. Wrap in your router&apos;s Link to navigate.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Static card</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No hover affordance.</p>
        </Card>
      </div>
    </Wrap>
  ),
};

export const ImageGallery: Story = {
  render: () => {
    const data = [
      { from: '%236366f1', to: '%23a855f7', title: 'Cosmos' },
      { from: '%2310b981', to: '%2306b6d4', title: 'Servers' },
      { from: '%23f59e0b', to: '%23ef4444', title: 'Alerts' },
    ];
    return (
      <Wrap>
        <div className="grid gap-4 sm:grid-cols-3">
          {data.map((d) => (
            <Card key={d.title} interactive padding="none">
              <Card.Image src={gradientImage(d.from, d.to, d.title)} alt={`${d.title} cover`} />
              <Card.Body>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{d.title}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Description for {d.title.toLowerCase()}.
                </p>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ImageRendersImg: Story = {
  render: () => (
    <Card padding="none">
      <Card.Image src={gradientImage('%236366f1', '%23a855f7', 'X')} alt="cover" />
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('cover')).toBeInTheDocument();
  },
};

// TUI Plus pattern "Card, edge-to-edge on mobile" — flush corners on mobile,
// rounded + bordered at `sm` and up. Resize the Storybook viewport below
// 640px to see the effect.
export const EdgeToEdgeMobile: Story = {
  render: () => (
    <Card edgeToEdgeMobile padding="lg">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        On mobile (&lt; 640px) this card touches both viewport edges with only top/bottom borders.
        From the <code>sm</code> breakpoint and above it gains rounded corners and a full border.
      </p>
    </Card>
  ),
};

export const EdgeToEdgeAddsBorderY: Story = {
  render: () => (
    <Card edgeToEdgeMobile padding="md">
      x
    </Card>
  ),
  play: async ({ canvasElement }) => {
    // Card root is the first child of the storybook canvas.
    const el = canvasElement.querySelector('div.overflow-hidden');
    await expect(el).not.toBeNull();
    await expect(el?.className ?? '').toMatch(/border-y/);
    await expect(el?.className ?? '').toMatch(/sm:rounded-2xl/);
  },
};

// ── Flowbite-inspired patterns ───────────────────────────────────────────────
// Compositions modeled on https://flowbite.com/docs/components/card/ adapted to
// Cosmos primitives. Card itself is unchanged — these stories illustrate how to
// assemble title + media + actions for the most common product flows. Excluded
// on purpose: e-commerce, pricing, testimonial, crypto (outside the monitoring
// audience).

export const WithCTA: Story = {
  // Heading + description + primary action — the most common "feature card"
  // layout. Matches Flowbite's "Card with Button".
  render: () => (
    <Wrap>
      <Card padding="lg" className="max-w-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Deploy your first exporter
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Cosmos ships a Prometheus-style exporter for every supported service. Pick one and
          we&apos;ll generate a kubectl manifest.
        </p>
        <Button variant="primary" icon={ArrowRight} iconPosition="right">
          Browse exporters
        </Button>
      </Card>
    </Wrap>
  ),
};

export const WithLink: Story = {
  // Heading + description + inline arrow link. Matches Flowbite's "Card with Link".
  render: () => (
    <Wrap>
      <Card padding="lg" className="max-w-sm">
        <IconBox
          icon={Zap}
          color="text-brand-500"
          bg="bg-brand-500/10"
          size="md"
          className="mb-3"
        />
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          What&apos;s new in v0.1.0
        </h3>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          DatePicker range mode, Clipboard composition patterns, and a redesigned welcome page —
          read the full changelog.
        </p>
        <a
          href="#"
          className="text-brand-500 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Read changelog <ArrowRight className="h-4 w-4" />
        </a>
      </Card>
    </Wrap>
  ),
};

export const UserProfile: Story = {
  // Avatar + name + role + action buttons. Matches Flowbite's "User Profile Card".
  // Useful as a teammate card in admin / team-management screens.
  render: () => (
    <Wrap>
      <Card padding="lg" className="max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Avatar size="xl" name="Jane Doe" />
          <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">Jane Doe</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Senior SRE · Platform Team</p>
          <div className="mt-5 flex gap-2">
            <Button variant="primary" icon={Mail} size="sm">
              Message
            </Button>
            <Button variant="secondary" icon={MessageSquare} size="sm">
              View profile
            </Button>
          </div>
        </div>
      </Card>
    </Wrap>
  ),
};

export const CenteredCTA: Story = {
  // Heading + description + dual action buttons, all centered. Matches Flowbite's
  // "Call to Action Card".
  render: () => (
    <Wrap>
      <Card padding="lg" className="mx-auto max-w-md text-center">
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Ready to deploy?
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Cosmos will generate the manifests, push to your cluster, and start scraping in under a
          minute.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary">Preview manifest</Button>
          <Button variant="primary" icon={ArrowRight} iconPosition="right">
            Deploy now
          </Button>
        </div>
      </Card>
    </Wrap>
  ),
};

export const WithList: Story = {
  // Header with "View all" link + list of rows with icon + label + metric.
  // Matches Flowbite's "Card with List".
  render: () => {
    const rows = [
      { icon: Server, label: 'node-exporter', metric: '32 nodes' },
      { icon: Activity, label: 'prometheus', metric: '12.4k series/s' },
      { icon: Bell, label: 'alertmanager', metric: '3 firing' },
      { icon: Zap, label: 'cosmos-agent', metric: '99.97% uptime' },
    ];
    return (
      <Wrap>
        <Card padding="none" className="max-w-md">
          <Card.Header>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top exporters</h3>
            <a
              href="#"
              className="text-brand-500 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Card.Header>
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <li
                  key={r.label}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <span className="bg-brand-500/10 text-brand-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate font-mono text-sm text-gray-900 dark:text-gray-100">
                    {r.label}
                  </span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {r.metric}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </Wrap>
    );
  },
};

export const WithTabs: Story = {
  // Card with an internal tab navigation row sitting in the Header. Composition
  // pattern, no extra component needed — Card.Header + lightweight tab buttons.
  // Matches Flowbite's "Card with Nav Tabs" without pulling in a full Tabs widget.
  render: () => {
    const tabs = ['Overview', 'Alerts', 'Logs'];
    const active = 0;
    return (
      <Wrap>
        <Card padding="none" className="max-w-md">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            {tabs.map((t, i) => (
              <button
                key={t}
                type="button"
                className={
                  i === active
                    ? 'text-brand-500 border-brand-500 -mb-px border-b-2 px-4 py-2.5 text-sm font-medium'
                    : 'border-b-2 border-transparent px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-4">
            <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              Cluster health
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All 32 nodes reporting · 0 alerts firing · last scrape 12s ago.
            </p>
          </div>
        </Card>
      </Wrap>
    );
  },
};
