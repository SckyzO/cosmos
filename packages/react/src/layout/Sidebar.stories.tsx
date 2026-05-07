import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Bell,
  Box,
  FileText,
  Globe,
  LayoutDashboard,
  Layers,
  List,
  Network,
  Server,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-[var(--color-bg-base)]">{children}</div>
);

export const FullExample: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Sidebar
          collapsed={collapsed}
          footer={
            <div className="flex items-center gap-2">
              <span className="bg-brand-500/10 text-brand-500 flex h-8 w-8 items-center justify-center rounded-full">
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
                aria-label="Toggle collapse"
                onClick={() => setCollapsed((v) => !v)}
                className="rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          }
        >
          <Sidebar.Brand
            collapsed={collapsed}
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <div className="py-3">
            <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active collapsed={collapsed} />

            <Sidebar.SubMenu icon={Layers} label="Library" collapsed={collapsed} defaultOpen>
              <Sidebar.Item icon={Box} label="Tokens" collapsed={collapsed} depth={1} />
              <Sidebar.Item icon={Layers} label="Components" collapsed={collapsed} depth={1} />
              <Sidebar.Item icon={FileText} label="Templates" collapsed={collapsed} depth={1} />
            </Sidebar.SubMenu>

            <Sidebar.SubMenu icon={Globe} label="Monitoring" collapsed={collapsed}>
              <Sidebar.Item icon={Server} label="Servers" collapsed={collapsed} depth={1} />
              <Sidebar.Item icon={Network} label="Network" collapsed={collapsed} depth={1} />
              <Sidebar.Item
                icon={ShieldCheck}
                label="Health checks"
                collapsed={collapsed}
                depth={1}
              />
            </Sidebar.SubMenu>

            <Sidebar.Section label="Account" collapsed={collapsed}>
              <Sidebar.Item
                icon={Bell}
                label="Notifications"
                collapsed={collapsed}
                badge={
                  !collapsed ? (
                    <span className="bg-brand-500 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white">
                      3
                    </span>
                  ) : undefined
                }
              />
              <Sidebar.Item icon={Settings} label="Settings" collapsed={collapsed} />
            </Sidebar.Section>
          </div>
        </Sidebar>
        <main className="flex-1 p-6 text-[var(--color-text-secondary)]">
          <p>
            Click the <List className="inline h-3 w-3" /> button in the sidebar footer to toggle the
            collapsed state.
          </p>
        </main>
      </Wrap>
    );
  },
};

export const Collapsed: Story = {
  render: () => (
    <Wrap>
      <Sidebar collapsed>
        <Sidebar.Brand collapsed logo={<Box className="h-5 w-5" />} title="Cosmos" />
        <div className="py-3">
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active collapsed />
          <Sidebar.Item icon={Layers} label="Components" collapsed />
          <Sidebar.Item icon={Box} label="Tokens" collapsed />
          <Sidebar.Item icon={FileText} label="Documentation" collapsed />
          <Sidebar.Item icon={Settings} label="Settings" collapsed />
        </div>
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
