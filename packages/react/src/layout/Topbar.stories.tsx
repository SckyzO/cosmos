import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Search, Bell, User, Sun } from 'lucide-react';
import { Topbar } from './Topbar';

const meta = {
  title: 'Layout/Topbar',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-panel)]">{children}</div>
);

const ActionBtn = ({ icon: Icon, label }: { icon: typeof Bell; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
  >
    <Icon className="h-4 w-4" />
  </button>
);

export const WithLogoAndActions: Story = {
  render: () => (
    <Wrap>
      <Topbar
        logo={<Box className="h-6 w-6" />}
        title="Cosmos"
        subtitle="Design System"
        rightActions={
          <>
            <ActionBtn icon={Bell} label="Notifications" />
            <ActionBtn icon={Sun} label="Toggle theme" />
            <ActionBtn icon={User} label="Profile" />
          </>
        }
      />
    </Wrap>
  ),
};

export const WithSearch: Story = {
  render: () => (
    <Wrap>
      <Topbar
        logo={<Box className="h-6 w-6" />}
        title="Cosmos"
        center={
          <div className="mx-auto max-w-md">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="search"
                placeholder="Search components..."
                className="focus:border-brand-500 h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] pr-3 pl-9 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>
          </div>
        }
        rightActions={<ActionBtn icon={User} label="Profile" />}
      />
    </Wrap>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <Wrap>
      <Topbar title="Plain Title" />
    </Wrap>
  ),
};

export const Empty: Story = {
  render: () => (
    <Wrap>
      <Topbar />
    </Wrap>
  ),
};
