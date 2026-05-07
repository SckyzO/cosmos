import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bell,
  Box,
  FileText,
  LayoutDashboard,
  Layers,
  Moon,
  Server,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Shell } from './Shell';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Shell',
  component: Shell,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

const PageContent = ({ title, description }: { title: string; description: string }) => (
  <div className="max-w-4xl p-10">
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>
    <div className="mt-8 grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6"
        >
          <p className="text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
            Card {n}
          </p>
          <p className="text-brand-500 mt-2 text-3xl font-bold">{n * 12}</p>
        </div>
      ))}
    </div>
  </div>
);

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);
  return (
    <button
      type="button"
      onClick={() => {
        setIsDark((v) => !v);
        document.documentElement.classList.toggle('dark');
      }}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
      aria-label="Toggle theme"
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
};

const IconButton = ({ icon: Icon, label }: { icon: typeof Bell; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
  >
    <Icon className="h-4 w-4" />
  </button>
);

const NavItems = () => (
  <div className="py-3">
    <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
    <Sidebar.SubMenu icon={Layers} label="Library" defaultOpen>
      <Sidebar.Item icon={Box} label="Tokens" depth={1} />
      <Sidebar.Item icon={Layers} label="Components" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.SubMenu icon={Server} label="Infrastructure">
      <Sidebar.Item icon={Server} label="Servers" depth={1} />
      <Sidebar.Item icon={FileText} label="Documentation" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.Section label="Account">
      <Sidebar.Item icon={Settings} label="Settings" />
    </Sidebar.Section>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Story 1: Default — Shell owns the sidebar collapsed state
//
// Shell automatically threads `sidebarCollapsed` + `onToggleSidebar` into the
// Topbar (built-in hamburger) and `collapsed` into the Sidebar. The consumer
// only writes the markup, no plumbing.
// ─────────────────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Shell
      topbar={
        <Topbar
          pageTitle="Analytics Dashboard"
          rightActions={
            <>
              <IconButton icon={Bell} label="Notifications" />
              <ThemeToggle />
              <IconButton icon={User} label="User profile" />
            </>
          }
        />
      }
      sidebar={
        <Sidebar>
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <NavItems />
        </Sidebar>
      }
    >
      <PageContent
        title="Dashboard"
        description="Click the built-in hamburger button in the topbar to toggle the sidebar collapsed state. Shell wires it up automatically."
      />
    </Shell>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 2: Sidebar collapsed by default (uncontrolled)
// ─────────────────────────────────────────────────────────────────────────────

export const StartsCollapsed: Story = {
  render: () => (
    <Shell
      defaultSidebarCollapsed
      topbar={<Topbar pageTitle="Servers" rightActions={<ThemeToggle />} />}
      sidebar={
        <Sidebar>
          <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
          <NavItems />
        </Sidebar>
      }
    >
      <PageContent
        title="Servers"
        description="Sidebar starts collapsed. Click the hamburger to expand."
      />
    </Shell>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 3: Controlled mode — caller owns the state
// ─────────────────────────────────────────────────────────────────────────────

export const Controlled: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Shell
        sidebarCollapsed={collapsed}
        onSidebarToggle={setCollapsed}
        topbar={<Topbar pageTitle="Controlled mode" rightActions={<ThemeToggle />} />}
        sidebar={
          <Sidebar>
            <Sidebar.Brand
              logo={<Box className="h-5 w-5" />}
              title="Cosmos"
              subtitle="Design system"
            />
            <NavItems />
          </Sidebar>
        }
      >
        <PageContent
          title="Controlled"
          description={`The host owns the state and can persist it (collapsed = ${String(collapsed)}).`}
        />
      </Shell>
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 4: Without sidebar (topbar + main only) — no hamburger rendered
// ─────────────────────────────────────────────────────────────────────────────

export const NoSidebar: Story = {
  render: () => (
    <Shell topbar={<Topbar pageTitle="Documentation" rightActions={<ThemeToggle />} />}>
      <PageContent
        title="Documentation"
        description="A simpler layout for marketing or docs pages — no sidebar, no hamburger."
      />
    </Shell>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 5: Minimal (no topbar, no sidebar — just content)
// ─────────────────────────────────────────────────────────────────────────────

export const Minimal: Story = {
  render: () => (
    <Shell>
      <PageContent
        title="Minimal Shell"
        description="Just the content area. Useful for fullscreen pages, login screens, etc."
      />
    </Shell>
  ),
};
