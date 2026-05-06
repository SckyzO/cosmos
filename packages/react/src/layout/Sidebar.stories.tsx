import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  LayoutDashboard,
  Layers,
  Box,
  FileText,
  Settings,
  Bell,
  User,
} from 'lucide-react';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-[var(--color-bg-base)]">{children}</div>
);

export const Expanded: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
        <Sidebar.Group label="Library">
          <Sidebar.Item icon={Layers} label="Components" />
          <Sidebar.Item icon={Box} label="Tokens" />
        </Sidebar.Group>
        <Sidebar.Section label="Resources">
          <Sidebar.Item icon={FileText} label="Documentation" />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    </Wrap>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <Wrap>
      <Sidebar collapsed>
        <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active collapsed />
        <Sidebar.Item icon={Layers} label="Components" collapsed />
        <Sidebar.Item icon={Box} label="Tokens" collapsed />
        <Sidebar.Item icon={FileText} label="Documentation" collapsed />
        <Sidebar.Item icon={Settings} label="Settings" collapsed />
      </Sidebar>
    </Wrap>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Wrap>
      <Sidebar
        footer={
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">sckyzo</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">Admin</p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
        <Sidebar.Item icon={Layers} label="Components" />
        <Sidebar.Item icon={Settings} label="Settings" />
      </Sidebar>
    </Wrap>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Item
          icon={Bell}
          label="Notifications"
          badge={
            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              3
            </span>
          }
        />
        <Sidebar.Item
          icon={FileText}
          label="Tasks"
          badge={
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
              new
            </span>
          }
        />
        <Sidebar.Item icon={Settings} label="Settings" />
      </Sidebar>
    </Wrap>
  ),
};
