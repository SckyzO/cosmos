import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Bell, Search, Sun, User } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
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
          onCollapsedChange={setCollapsed}
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
          onCollapsedChange={setCollapsed}
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

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * The hamburger calls `onCollapsedChange` with the next state by click, Enter and Space,
 * and its label follows the state.
 */
export const HamburgerFiresOnCollapsedChange: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: function Render(args) {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Topbar
        {...args}
        pageTitle="Servers"
        sidebarCollapsed={collapsed}
        onCollapsedChange={(next) => {
          args.onCollapsedChange?.(next);
          setCollapsed(next);
        }}
      />
    );
  },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('Servers')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(1);
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
    const expand = canvas.getByRole('button', { name: 'Expand sidebar' });
    await expect(expand).toHaveAttribute('title', 'Expand sidebar');

    expand.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(2);
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(false);
    await expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(3);
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  },
};

/** The hamburger needs both a `sidebarCollapsed` state and an `onCollapsedChange`; `null` hides it. */
export const HamburgerIsHiddenWithoutStateOrHandler: Story = {
  tags: ['!dev', '!autodocs'],
  // A Topbar is a page's banner and a page has one: each of the three sits in a named
  // section, which keeps its <header> from counting as a second banner.
  render: () => (
    <Wrap>
      <section aria-label="No state">
        <Topbar pageTitle="No state" onCollapsedChange={() => {}} />
      </section>
      <section aria-label="State is null">
        <Topbar pageTitle="State is null" sidebarCollapsed={null} onCollapsedChange={() => {}} />
      </section>
      <section aria-label="No handler">
        <Topbar pageTitle="No handler" sidebarCollapsed={false} />
      </section>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const title of ['No state', 'State is null', 'No handler']) {
      await expect(canvas.getByText(title)).toBeVisible();
    }
    await expect(canvas.queryByRole('button', { name: /sidebar/i })).toBeNull();
  },
};

/** Keyboard order follows the layout: hamburger, left actions, center, right actions. */
export const SlotsFollowTheLayoutOrder: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Topbar
        sidebarCollapsed={false}
        onCollapsedChange={() => {}}
        leftActions={<IconBtn icon={Search} label="Left action" />}
        pageTitle="Servers"
        center={<input aria-label="Center search" />}
        rightActions={<IconBtn icon={User} label="Right action" />}
      />
    </Wrap>
  ),
  play: async () => {
    const reached: (string | null | undefined)[] = [];
    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      reached.push(document.activeElement?.getAttribute('aria-label'));
    }
    await expect(reached).toEqual([
      'Collapse sidebar',
      'Left action',
      'Center search',
      'Right action',
    ]);
  },
};

/** An expanded sidebar: the hamburger passes `true`, the state to move to, whatever the host does with it. */
export const HamburgerCollapsesAnExpandedSidebar: Story = {
  tags: ['!dev', '!autodocs'],
  args: { pageTitle: 'Servers', sidebarCollapsed: false, onCollapsedChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(1);
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(true);
  },
};

/** A collapsed sidebar: the hamburger passes `false`. */
export const HamburgerExpandsACollapsedSidebar: Story = {
  tags: ['!dev', '!autodocs'],
  args: { pageTitle: 'Servers', sidebarCollapsed: true, onCollapsedChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(1);
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(false);
  },
};

/** The title is plain text by default, so a composed page keeps the PageHeader as its `h1`. */
export const PageTitleIsPlainTextByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { pageTitle: 'Servers' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('heading')).toBeNull();
    await expect(canvas.getByText('Servers').tagName).toBe('P');
  },
};

/** `as="h1"` gives the title back as the page heading. */
export const PageTitleAsHeading: Story = {
  args: { pageTitle: 'Servers', as: 'h1' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Servers' })).toBeVisible();
  },
};
