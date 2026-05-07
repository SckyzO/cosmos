import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Box,
  LayoutDashboard,
  Layers,
  Settings,
  FileText,
  Bell,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Shell } from './Shell';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Shell',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Reusable mock content for the main area
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
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
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
    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
  >
    <Icon className="h-4 w-4" />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Story 1: Full layout with sidebar + topbar + content
// ─────────────────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Shell
        topbar={
          <Topbar
            logo={<Box className="h-6 w-6" />}
            title="Cosmos"
            subtitle="Design System"
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
          <Sidebar collapsed={collapsed}>
            <Sidebar.Item
              icon={LayoutDashboard}
              label="Dashboard"
              active
              collapsed={collapsed}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Sidebar.Group label="Library" collapsed={collapsed}>
              <Sidebar.Item icon={Layers} label="Components" collapsed={collapsed} />
              <Sidebar.Item icon={Box} label="Tokens" collapsed={collapsed} />
            </Sidebar.Group>
            <Sidebar.Section label="Resources">
              <Sidebar.Item icon={FileText} label="Documentation" collapsed={collapsed} />
              <Sidebar.Item icon={Settings} label="Settings" collapsed={collapsed} />
            </Sidebar.Section>
          </Sidebar>
        }
      >
        <PageContent
          title="Dashboard"
          description="Click the Dashboard item in the sidebar to toggle collapsed state."
        />
      </Shell>
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 2: Collapsed sidebar (icons only)
// ─────────────────────────────────────────────────────────────────────────────

export const CollapsedSidebar: Story = {
  render: () => (
    <Shell
      topbar={
        <Topbar logo={<Box className="h-6 w-6" />} title="Cosmos" rightActions={<ThemeToggle />} />
      }
      sidebar={
        <Sidebar collapsed>
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active collapsed />
          <Sidebar.Item icon={Layers} label="Components" collapsed />
          <Sidebar.Item icon={Box} label="Tokens" collapsed />
          <Sidebar.Item icon={FileText} label="Documentation" collapsed />
          <Sidebar.Item icon={Settings} label="Settings" collapsed />
        </Sidebar>
      }
    >
      <PageContent title="Components" description="Sidebar in collapsed mode shows icons only." />
    </Shell>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 3: Without sidebar (topbar + main)
// ─────────────────────────────────────────────────────────────────────────────

export const NoSidebar: Story = {
  render: () => (
    <Shell
      topbar={
        <Topbar
          logo={<Box className="h-6 w-6" />}
          title="Cosmos"
          subtitle="Documentation"
          rightActions={<ThemeToggle />}
        />
      }
    >
      <PageContent
        title="Documentation"
        description="A simpler layout for marketing or docs pages — no sidebar."
      />
    </Shell>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 4: Minimal (no topbar, no sidebar — just content)
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
