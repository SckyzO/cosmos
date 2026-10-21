import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { useState } from 'react';
import {
  Bell,
  Box,
  FileText,
  Globe,
  LayoutDashboard,
  Layers,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  subcomponents: {
    'Sidebar.Brand': Sidebar.Brand,
    'Sidebar.Section': Sidebar.Section,
    'Sidebar.Group': Sidebar.Group,
    'Sidebar.Item': Sidebar.Item,
    'Sidebar.SubMenu': Sidebar.SubMenu,
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-[var(--color-bg-base)]">{children}</div>
);

// `collapsed` is provided by Sidebar via context — children pick it up
// automatically (no need to pass `collapsed` to every Sidebar.Item).
const Nav = () => (
  <div className="py-3">
    <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
    <Sidebar.SubMenu icon={Layers} label="Library" defaultOpen>
      <Sidebar.Item icon={Box} label="Tokens" depth={1} />
      <Sidebar.Item icon={Layers} label="Components" depth={1} />
      <Sidebar.Item icon={FileText} label="Templates" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.SubMenu icon={Globe} label="Monitoring">
      <Sidebar.Item icon={Server} label="Servers" depth={1} />
      <Sidebar.Item icon={Network} label="Network" depth={1} />
      <Sidebar.Item icon={ShieldCheck} label="Health checks" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.Section label="Account">
      <Sidebar.Item
        icon={Bell}
        label="Notifications"
        badge={
          <span className="bg-brand-500 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white">
            3
          </span>
        }
      />
      <Sidebar.Item icon={Settings} label="Settings" />
    </Sidebar.Section>
  </div>
);

// Collapsed, the 72 px sidebar only fits one column: the toggle goes under the avatar.
const Footer = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
  <div className={clsx('flex items-center gap-2', collapsed && 'flex-col')}>
    <span className="bg-brand-500/10 text-brand-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
      <User className="h-4 w-4" />
    </span>
    {!collapsed && (
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">sckyzo</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">Admin</p>
      </div>
    )}
    <button
      type="button"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      onClick={onToggle}
      className="rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
    >
      {collapsed ? (
        <PanelLeftOpen className="h-4 w-4" aria-hidden />
      ) : (
        <PanelLeftClose className="h-4 w-4" aria-hidden />
      )}
    </button>
  </div>
);

export const FullExample: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Sidebar
          collapsed={collapsed}
          footer={<Footer collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />}
        >
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <Nav />
        </Sidebar>
        <main className="flex-1 p-6 text-[var(--color-text-secondary)]">
          <p>
            Click the <PanelLeftClose className="inline h-3 w-3" /> button in the sidebar footer to
            toggle collapsed mode. Children re-render automatically via React context.
          </p>
        </main>
      </Wrap>
    );
  },
};

/** `onCollapsedChange` adds a collapse button at the very bottom of the sidebar. */
export const WithCollapseButton: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <Nav />
        </Sidebar>
        <main className="flex-1 p-6 text-[var(--color-text-secondary)]">
          <p>The button at the bottom collapses and expands the sidebar.</p>
        </main>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(72));
    const expand = canvas.getByRole('button', { name: 'Expand sidebar' });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(expand);
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(264));
  },
};

/** Collapsed to 72 px, the footer's toggle stays inside the sidebar. */
export const CollapsedFooterFits: Story = {
  tags: ['!autodocs'],
  render: FullExample.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.click(canvas.getByRole('button', { name: /collapse|expand/i }));
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(72));
    const toggle = canvas.getByRole('button', { name: /collapse|expand/i }).getBoundingClientRect();
    // The nav's right edge is its 1px border.
    await expect(toggle.right).toBeLessThanOrEqual(nav.getBoundingClientRect().right - 1);
  },
};

export const Collapsed: Story = {
  render: () => (
    <Wrap>
      <Sidebar collapsed>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
        <Nav />
      </Sidebar>
    </Wrap>
  ),
};

export const SubMenuExpanded: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <div className="py-3">
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" />
          <Sidebar.SubMenu icon={Layers} label="Library" defaultOpen>
            <Sidebar.Item icon={Box} label="Tokens" depth={1} active />
            <Sidebar.Item icon={Layers} label="Components" depth={1} />
            <Sidebar.Item icon={FileText} label="Templates" depth={1} />
          </Sidebar.SubMenu>
          <Sidebar.SubMenu icon={Globe} label="Monitoring">
            <Sidebar.Item icon={Server} label="Servers" depth={1} />
            <Sidebar.Item icon={Network} label="Network" depth={1} />
          </Sidebar.SubMenu>
        </div>
      </Sidebar>
    </Wrap>
  ),
};
