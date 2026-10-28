import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Bell, Search, Settings, Sun, User } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Topbar } from './Topbar';
import { Menu } from '../ui/Menu';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';

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
          endActions={
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
                <Search className="inset-s-3 absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search servers..."
                  className="focus:border-brand-500 h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] ps-9 pe-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                />
              </div>
            </div>
          }
          endActions={<IconBtn icon={User} label="Profile" />}
        />
      </Wrap>
    );
  },
};

export const WithoutHamburger: Story = {
  render: () => (
    <Wrap>
      <Topbar pageTitle="Documentation" endActions={<IconBtn icon={User} label="Profile" />} />
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

/**
 * `brand`: the product logo right after the hamburger. Outside a Shell it always shows; inside
 * one it shows only while the sidebar is off screen (see `Layout/Shell` › Mobile).
 */
export const WithBrand: Story = {
  render: () => (
    <Wrap>
      <Topbar
        sidebarCollapsed={false}
        onCollapsedChange={() => {}}
        brand={<span className="font-bold tracking-tight">Cosmos</span>}
        pageTitle="Analytics Dashboard"
        endActions={<IconBtn icon={User} label="Profile" />}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const brand = canvas.getByText('Cosmos');
    await expect(brand).toBeVisible();
    // Right after the hamburger, before the page title.
    const hamburger = canvas.getByRole('button', { name: 'Collapse sidebar' });
    await expect(hamburger.compareDocumentPosition(brand)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    await expect(brand.compareDocumentPosition(canvas.getByText('Analytics Dashboard'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  },
};

/** Keyboard order follows the layout: hamburger, start actions, center, end actions. */
export const SlotsFollowTheLayoutOrder: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Topbar
        sidebarCollapsed={false}
        onCollapsedChange={() => {}}
        startActions={<IconBtn icon={Search} label="Start action" />}
        pageTitle="Servers"
        center={<input aria-label="Center search" />}
        endActions={<IconBtn icon={User} label="End action" />}
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
      'Start action',
      'Center search',
      'End action',
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
    await expect(canvas.getByText('Servers').parentElement?.tagName).toBe('P');
  },
};

/** `as="h1"` gives the title back as the page heading. */
export const PageTitleAsHeading: Story = {
  tags: ['!dev'],
  args: { pageTitle: 'Servers', as: 'h1' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Servers' })).toBeVisible();
  },
};

// ── Narrow screens (#291) ────────────────────────────────────────────────────

const MobileTopbar = ({ onSelect }: { onSelect?: () => void }) => (
  <Wrap>
    <Topbar
      sidebarCollapsed={false}
      onCollapsedChange={() => {}}
      pageTitle="Analytics Dashboard"
      moreActions={
        <>
          <Menu.Item icon={Bell} onSelect={onSelect}>
            Notifications
          </Menu.Item>
          <Menu.Item icon={Sun}>Toggle theme</Menu.Item>
        </>
      }
      endActions={
        <>
          <span className="flex gap-2 max-sm:hidden">
            <IconBtn icon={Bell} label="Notifications" />
            <IconBtn icon={Sun} label="Toggle theme" />
            <IconBtn icon={Settings} label="Settings" />
          </span>
          <IconBtn icon={User} label="Profile" />
        </>
      }
    />
  </Wrap>
);

/**
 * Below `sm` the page title goes (the page has its own heading) and the actions marked with
 * `max-sm:hidden` move into the "More actions" menu given as `moreActions`.
 */
export const Mobile: Story = {
  globals: mobileViewport,
  parameters: { ...portalDocsParams.lg(), layout: 'fullscreen' },
  render: () => <MobileTopbar onSelect={fn()} />,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByRole('banner'));
    await expect(canvas.getByText('Analytics Dashboard')).not.toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Settings' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Profile' })).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
    const menu = within(document.body);
    await expect(await menu.findByRole('menuitem', { name: 'Notifications' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Toggle theme' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu.queryByRole('menu')).toBeNull());
  },
};

/** From `sm` up the title and the actions are back, and the "More" menu is gone. */
export const MoreMenuIsMobileOnly: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <MobileTopbar />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Analytics Dashboard')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Settings' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'More actions' })).toBeNull();
  },
};
