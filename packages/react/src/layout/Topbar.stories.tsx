import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Menu, Search, Sun, User } from 'lucide-react';
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

const IconBtn = ({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof Bell;
  label: string;
  active?: boolean;
}) => (
  <button
    type="button"
    aria-label={label}
    className={[
      'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
      active
        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5',
    ].join(' ')}
  >
    <Icon className="h-4 w-4" />
  </button>
);

export const CollapseButtonAndPageTitle: Story = {
  render: () => (
    <Wrap>
      <Topbar
        leftActions={<IconBtn icon={Menu} label="Toggle sidebar" />}
        pageTitle="Analytics Dashboard"
        rightActions={
          <>
            <IconBtn icon={Bell} label="Notifications" />
            <IconBtn icon={Sun} label="Toggle theme" />
            <IconBtn icon={User} label="Profile" />
          </>
        }
      />
    </Wrap>
  ),
};

export const WithCenterSearch: Story = {
  render: () => (
    <Wrap>
      <Topbar
        leftActions={<IconBtn icon={Menu} label="Toggle sidebar" />}
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
  ),
};

export const Minimal: Story = {
  render: () => (
    <Wrap>
      <Topbar leftActions={<IconBtn icon={Menu} label="Toggle sidebar" />} pageTitle="Dashboard" />
    </Wrap>
  ),
};
