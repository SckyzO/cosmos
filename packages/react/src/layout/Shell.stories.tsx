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
import { expect, fn, userEvent, within } from 'storybook/test';
import { Shell } from './Shell';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { transitionsEnd } from '../storybook-helpers';

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
// Shell shares the collapsed state through a context: the Topbar's built-in
// hamburger and the Sidebar read it, as would any SidebarToggle placed in the
// Shell. The consumer only writes the markup, no plumbing.
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
// Collapse button at the bottom of the sidebar
//
// `collapseControl="sidebar"` moves the control from the Topbar's hamburger to
// a button under the sidebar's content.
// ─────────────────────────────────────────────────────────────────────────────

export const CollapseButtonInSidebar: Story = {
  render: () => (
    <Shell
      collapseControl="sidebar"
      topbar={<Topbar pageTitle="Analytics Dashboard" rightActions={<ThemeToggle />} />}
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
        description="The collapse button sits at the bottom of the sidebar; the top bar has no hamburger."
      />
    </Shell>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    // One control only, in the sidebar.
    const toggles = canvas.getAllByRole('button', { name: 'Collapse sidebar' });
    await expect(toggles).toHaveLength(1);
    await expect(within(nav).getByRole('button', { name: 'Collapse sidebar' })).toBe(toggles[0]);
    await userEvent.click(toggles[0]);
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(72);
    await userEvent.click(within(nav).getByRole('button', { name: 'Expand sidebar' }));
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(264);
  },
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
        onCollapsedChange={setCollapsed}
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

// ─────────────────────────────────────────────────────────────────────────────
// Interaction tests
// ─────────────────────────────────────────────────────────────────────────────

/** The Topbar's hamburger collapses the sidebar to its icons and gives the width to the content. */
export const HamburgerCollapsesAndExpandsTheSidebar: Story = {
  tags: ['!dev', '!autodocs'],
  render: Default.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const main = canvas.getByRole('main');
    await expect(nav.getBoundingClientRect().width).toBe(264);
    await expect(within(nav).getByText('Dashboard')).toBeVisible();
    const mainWidth = main.getBoundingClientRect().width;

    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(72);
    // Labels leave, the items keep their name as a tooltip.
    await expect(within(nav).queryByText('Dashboard')).toBeNull();
    await expect(within(nav).getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'title',
      'Dashboard'
    );
    await expect(main.getBoundingClientRect().width).toBeCloseTo(mainWidth + 192, 0);

    // From the keyboard, the same button expands it again.
    canvas.getByRole('button', { name: 'Expand sidebar' }).focus();
    await userEvent.keyboard('{Enter}');
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(264);
    await expect(within(nav).getByText('Dashboard')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toHaveFocus();
  },
};

export const StartsCollapsedExpandsOnToggle: Story = {
  tags: ['!dev', '!autodocs'],
  render: StartsCollapsed.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getBoundingClientRect().width).toBe(72);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(264);
  },
};

/** Controlled, Shell reports the toggle but shows only what `sidebarCollapsed` says. */
export const ControlledShellFollowsItsProp: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <Shell
      sidebarCollapsed={false}
      onCollapsedChange={args.onCollapsedChange}
      topbar={<Topbar pageTitle="Frozen" />}
      sidebar={
        <Sidebar>
          <NavItems />
        </Sidebar>
      }
    >
      <PageContent title="Frozen" description="The host never updates its state." />
    </Shell>
  ),
  play: async ({ args, canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(1);
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(true);
    await expect(nav.getBoundingClientRect().width).toBe(264);
    await expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
  },
};

/** When the host applies the reported state, the sidebar follows. */
export const ControlledHostOwnsTheState: Story = {
  tags: ['!dev', '!autodocs'],
  render: Controlled.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(canvas.getByText(/collapsed = false/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(canvas.getByText(/collapsed = true/)).toBeVisible();
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(72);
  },
};

/** Without a sidebar there is nothing to collapse: no navigation, no hamburger. */
export const NoSidebarHasNoHamburger: Story = {
  tags: ['!dev', '!autodocs'],
  render: NoSidebar.render,
  play: async ({ canvas }) => {
    const topbar = within(canvas.getByRole('banner'));
    await expect(topbar.getByText('Documentation')).toBeVisible();
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(canvas.queryByRole('button', { name: /sidebar/i })).toBeNull();
  },
};

/** Uncontrolled, Shell reports the state it moved to: `true` on collapse, `false` on expand. */
export const UncontrolledReportsEachNextState: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <Shell
      {...args}
      topbar={<Topbar pageTitle="Servers" />}
      sidebar={
        <Sidebar>
          <NavItems />
        </Sidebar>
      }
    >
      <PageContent title="Servers" description="Shell owns the collapsed state." />
    </Shell>
  ),
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(false);
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(3);
  },
};

/** With `collapseControl="sidebar"`, the Sidebar's own button reports the next state the same way. */
export const SidebarButtonReportsEachNextState: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn(), collapseControl: 'sidebar' },
  render: (args) => (
    <Shell
      {...args}
      topbar={<Topbar pageTitle="Servers" />}
      sidebar={
        <Sidebar>
          <NavItems />
        </Sidebar>
      }
    >
      <PageContent title="Servers" description="The control lives in the sidebar." />
    </Shell>
  ),
  play: async ({ args, canvas }) => {
    // One button: the Topbar shows no hamburger.
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(false);
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(2);
  },
};
