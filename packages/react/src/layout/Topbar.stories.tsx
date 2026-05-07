import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Bell, Search, Sun, User } from 'lucide-react';
import { Topbar } from './Topbar';

const meta = {
  title: 'Layout/Topbar',
  component: Topbar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Topbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)]">{children}</div>
);

const IconBtn = ({ icon: Icon, label }: { icon: typeof Bell; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
  >
    <Icon className="h-4 w-4" />
  </button>
);

export const WithHamburger: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Topbar
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          pageTitle="Analytics Dashboard"
          rightActions={
            <>
              <IconBtn icon={Bell} label="Notifications" />
              <IconBtn icon={Sun} label="Toggle theme" />
              <IconBtn icon={User} label="Profile" />
            </>
          }
        />
        <p className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
          Click the hamburger to toggle: collapsed = {String(collapsed)}
        </p>
      </Wrap>
    );
  },
};

export const WithCenterSearch: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Topbar
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          pageTitle="Servers"
          center={
            <div className="mx-auto max-w-md">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search servers..."
                  className="focus:border-brand-500 h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] pr-3 pl-9 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                />
              </div>
            </div>
          }
          rightActions={<IconBtn icon={User} label="Profile" />}
        />
      </Wrap>
    );
  },
};

export const WithoutHamburger: Story = {
  render: () => (
    <Wrap>
      <Topbar pageTitle="Documentation" rightActions={<IconBtn icon={User} label="Profile" />} />
      <p className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
        Pass <code>sidebarCollapsed=&#123;null&#125;</code> (or omit it) to hide the hamburger —
        useful for pages without a sidebar.
      </p>
    </Wrap>
  ),
};
