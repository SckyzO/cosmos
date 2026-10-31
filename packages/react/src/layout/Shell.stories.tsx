import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bell,
  Box,
  LayoutDashboard,
  Layers,
  Moon,
  Server,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { Shell } from './Shell';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import {
  endOffset,
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
  startOffset,
  transitionsEnd,
} from '../storybook-helpers';

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
      <Sidebar.Item label="Tokens" />
      <Sidebar.Item label="Components" />
    </Sidebar.SubMenu>
    <Sidebar.SubMenu icon={Server} label="Infrastructure">
      <Sidebar.Item label="Servers" />
      <Sidebar.Item label="Documentation" />
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
          endActions={
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

// The floating variant: the sidebar and the page are two cards, 10px from the window and from
// each other, the sidebar with the tight gutter and the edge toggle.
const FloatingShell = (props: Partial<React.ComponentProps<typeof Shell>>) => (
  <Shell
    variant="floating"
    topbar={<Topbar pageTitle="Analytics Dashboard" endActions={<ThemeToggle />} />}
    sidebar={
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <NavItems />
      </Sidebar>
    }
    {...props}
  >
    <PageContent
      title="Dashboard"
      description="The sidebar and the page float as two cards. Click the sidebar's edge to collapse it."
    />
  </Shell>
);

/**
 * `variant="floating"`: the sidebar is a card 10px from the window, and the topbar and the page
 * share a second card beside it. The sidebar's rows come 10px from its edges, and a strip along
 * its edge collapses it on click.
 */
export const Floating: Story = { render: () => <FloatingShell /> };

export const FloatingChecks: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FloatingShell />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const panel = nav.ownerDocument.querySelector('[data-shell-panel]') as HTMLElement;
    const card = nav.getBoundingClientRect();
    const page = panel.getBoundingClientRect();
    // Two cards, 10px from the window's edges and from each other.
    await expect(startOffset(nav, document.documentElement)).toBe(10);
    await expect(card.top).toBe(10);
    await expect(window.innerHeight - card.bottom).toBe(10);
    const rtl = getComputedStyle(nav).direction === 'rtl';
    await expect(Math.round(rtl ? card.left - page.right : page.left - card.right)).toBe(10);
    for (const el of [nav, panel]) {
      await expect(getComputedStyle(el).borderTopWidth).toBe('1px');
      await expect(getComputedStyle(el).borderTopLeftRadius).not.toBe('0px');
    }
    // The tight gutter, from the Shell: 10px inside the card's 1px border.
    await expect(startOffset(canvas.getByRole('button', { name: 'Dashboard' }), nav)).toBe(11);
    // The edge toggle: out of the tab order, collapses on click, expands on the next.
    const edge = nav.querySelector('[data-sidebar-edge]') as HTMLElement;
    await expect(edge.tabIndex).toBe(-1);
    const toggle = canvas.getByRole('button', { name: 'Collapse sidebar' });
    await userEvent.click(edge);
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(72));
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(edge);
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBeGreaterThan(72));
  },
};

/** Below `lg` the sidebar is a drawer and the page fills the window, as in `attached`. */
export const FloatingOnAPhoneFillsTheWindow: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => <FloatingShell />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.ownerDocument.querySelector('[data-shell-panel]')).toBeNull();
    expectNoHorizontalOverflow(canvasElement);
  },
};

/** An attached Shell keeps its sidebar's edge a plain line: no edge toggle unless it asks. */
export const AttachedHasNoEdgeToggle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FloatingShell variant="attached" />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.querySelector('[data-sidebar-edge]')).toBeNull();
    await expect(startOffset(canvas.getByRole('button', { name: 'Dashboard' }), nav)).toBe(20);
  },
};

export const CollapseButtonInSidebar: Story = {
  render: () => (
    <Shell
      collapseControl="sidebar"
      topbar={<Topbar pageTitle="Analytics Dashboard" endActions={<ThemeToggle />} />}
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
};

export const CollapseButtonInSidebarChecks: Story = {
  ...CollapseButtonInSidebar,
  tags: ['!dev', '!autodocs'],
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
      topbar={<Topbar pageTitle="Servers" endActions={<ThemeToggle />} />}
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
        topbar={<Topbar pageTitle="Controlled mode" endActions={<ThemeToggle />} />}
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
    <Shell topbar={<Topbar pageTitle="Documentation" endActions={<ThemeToggle />} />}>
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
    // Labels leave, the items keep their name (and a tooltip on hover and focus).
    await expect(within(nav).queryByText('Dashboard')).toBeNull();
    await expect(within(nav).getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-label',
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

// ─────────────────────────────────────────────────────────────────────────────
// Below `lg`: the sidebar is a drawer
//
// The sidebar leaves the layout. The Topbar shows the hamburger, then the product logo
// (`brand`), and the hamburger opens the sidebar as a 288px panel over a scrim.
// ─────────────────────────────────────────────────────────────────────────────

const AppLogo = () => (
  <span className="flex items-center gap-2">
    <span className="bg-brand-500/10 text-brand-500 flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Box className="size-5" aria-hidden />
    </span>
    <span className="font-bold tracking-tight">Cosmos</span>
  </span>
);

const MobileNav = () => (
  <div className="py-3">
    <Sidebar.Item icon={LayoutDashboard} label="Dashboard" href="#dashboard" active />
    <Sidebar.SubMenu icon={Layers} label="Library">
      <Sidebar.Item label="Tokens" href="#tokens" />
    </Sidebar.SubMenu>
    <Sidebar.Section label="Account">
      <Sidebar.Item icon={Settings} label="Settings" href="#settings" />
    </Sidebar.Section>
  </div>
);

const MobileShell = (props: Partial<React.ComponentProps<typeof Shell>>) => (
  <Shell
    topbar={
      <Topbar
        brand={<AppLogo />}
        pageTitle="Analytics Dashboard"
        endActions={<IconButton icon={User} label="User profile" />}
      />
    }
    sidebar={
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <MobileNav />
      </Sidebar>
    }
    {...props}
  >
    <div className="p-4">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Below the lg breakpoint the sidebar is off screen.
      </p>
    </div>
  </Shell>
);

const mobileDocs = { ...portalDocsParams.full() };

const body = () => within(document.body);
const openDrawer = async () => {
  await userEvent.click(body().getByRole('button', { name: 'Open navigation' }));
  const dialog = await body().findByRole('dialog', { name: 'Navigation menu' });
  await waitFor(() => expect(startOffset(dialog, document.documentElement)).toBe(0));
  return dialog;
};
const expectClosed = async (dialog: HTMLElement) => {
  await waitFor(() => expect(dialog).not.toBeVisible());
  await expect(body().queryByRole('dialog')).toBeNull();
};
const scrim = () =>
  document.body.querySelector<HTMLElement>('div[aria-hidden][class*="bg-gray-500"]')!;

/** At 375px the sidebar is off screen: the Topbar shows the hamburger and the logo. */
export const Mobile: Story = {
  globals: mobileViewport,
  parameters: mobileDocs,
  render: () => <MobileShell />,
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(body().queryByRole('navigation', { name: 'Main navigation' })).toBeNull();
    const bar = canvas.getByRole('banner');
    await expect(within(bar).getByText('Cosmos')).toBeVisible();
    await expect(within(bar).getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  },
};

/** The hamburger opens the sidebar as a panel from the start edge, over a scrim, with a close button. */
export const MobileOpen: Story = {
  globals: mobileViewport,
  parameters: mobileDocs,
  render: () => <MobileShell defaultSidebarOpen />,
};

export const MobileOpenChecks: Story = {
  ...MobileOpen,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const dialog = await body().findByRole('dialog', { name: 'Navigation menu' });
    await waitFor(() => expect(startOffset(dialog, document.documentElement)).toBe(0));
    expectNoHorizontalOverflow();
    await expect(dialog.getBoundingClientRect().width).toBe(288);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(within(dialog).getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Close navigation' })).toBeVisible();
  },
};

/** The host owns the open state: `sidebarOpen` and `onSidebarOpenChange`. */
export const MobileControlled: Story = {
  globals: mobileViewport,
  parameters: mobileDocs,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <MobileShell
        sidebarOpen={open}
        onSidebarOpenChange={setOpen}
        topbar={
          <Topbar
            brand={<AppLogo />}
            endActions={<span className="text-xs">open = {String(open)}</span>}
          />
        }
      />
    );
  },
};

export const MobileControlledChecks: Story = {
  ...MobileControlled,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    await openDrawer();
    await expect(body().getByText('open = true')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body().getByText('open = false')).toBeVisible());
  },
};

/** Opening: the hamburger says what it does and what it controls, and the drawer is a modal dialog. */
export const HamburgerOpensTheDrawer: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <MobileShell />,
  play: async () => {
    const hamburger = body().getByRole('button', { name: 'Open navigation' });
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    const dialog = await openDrawer();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(hamburger).toHaveAccessibleName('Close navigation');
    const nav = within(dialog).getByRole('navigation', { name: 'Main navigation' });
    await expect(hamburger).toHaveAttribute('aria-controls', nav.id);
    // The sidebar is expanded and fills the panel; focus moved into it.
    await expect(within(nav).getByText('Dashboard')).toBeVisible();
    await expect(nav.getBoundingClientRect().width).toBeGreaterThanOrEqual(287);
    await expect(dialog).toContainElement(document.activeElement as HTMLElement);
  },
};

/** Escape closes it and focus returns to the hamburger. */
export const EscapeClosesAndFocusReturns: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  args: { onSidebarOpenChange: fn() },
  render: (args) => <MobileShell onSidebarOpenChange={args.onSidebarOpenChange} />,
  play: async ({ args }) => {
    const hamburger = body().getByRole('button', { name: 'Open navigation' });
    const dialog = await openDrawer();
    await userEvent.keyboard('{Escape}');
    await expectClosed(dialog);
    await expect(args.onSidebarOpenChange).toHaveBeenLastCalledWith(false);
    await expect(hamburger).toHaveFocus();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** The scrim, the close button and a click on a link each close it. */
export const ScrimCloseButtonAndLinkClose: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <MobileShell />,
  play: async () => {
    const hamburger = body().getByRole('button', { name: 'Open navigation' });

    let dialog = await openDrawer();
    await userEvent.click(scrim());
    await expectClosed(dialog);
    await expect(hamburger).toHaveFocus();

    dialog = await openDrawer();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close navigation' }));
    await expectClosed(dialog);
    await expect(hamburger).toHaveFocus();

    dialog = await openDrawer();
    // A sub-menu only expands: the drawer stays.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Library' }));
    await expect(dialog).toBeVisible();
    // The link would navigate the test page: keep its default action, not the click.
    const keepPage = (e: Event) => e.preventDefault();
    window.addEventListener('click', keepPage);
    try {
      await userEvent.click(within(dialog).getByRole('link', { name: 'Tokens' }));
    } finally {
      window.removeEventListener('click', keepPage);
    }
    await expectClosed(dialog);
    await expect(hamburger).toHaveFocus();
  },
};

/** The page does not scroll behind the drawer, and scrolls again once it is closed. */
export const BodyScrollIsLockedWhileOpen: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <MobileShell />,
  play: async () => {
    await expect(document.body.style.overflow).toBe('');
    const dialog = await openDrawer();
    await expect(document.body.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');
    await expectClosed(dialog);
    await expect(document.body.style.overflow).toBe('');
  },
};

/** A swipe toward the start edge closes it; a short one springs back. */
export const SwipeTowardStartClosesTheDrawer: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <MobileShell />,
  play: async () => {
    const touch = (clientX: number) => ({
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      clientX,
      clientY: 300,
    });
    // The drawer sits at the start: the swipe goes to the left, or to the right in right to left.
    const toStart = getComputedStyle(document.documentElement).direction === 'rtl' ? 1 : -1;
    const dialog = await openDrawer();
    await fireEvent.pointerDown(dialog, touch(200));
    await fireEvent.pointerMove(dialog, touch(200 + 30 * toStart));
    await new Promise((resolve) => setTimeout(resolve, 250));
    await fireEvent.pointerUp(dialog, touch(200 + 30 * toStart));
    await waitFor(() => expect(startOffset(dialog, document.documentElement)).toBe(0));
    await expect(dialog).toBeVisible();

    await fireEvent.pointerDown(dialog, touch(200));
    await fireEvent.pointerMove(dialog, touch(200 + 140 * toStart));
    await new Promise((resolve) => setTimeout(resolve, 250));
    await fireEvent.pointerUp(dialog, touch(200 + 140 * toStart));
    await expectClosed(dialog);
    await expect(body().getByRole('button', { name: 'Open navigation' })).toHaveFocus();
  },
};

// A controllable stand-in for the `(min-width: 64rem)` query, installed before the Shell mounts,
// to grow the viewport past `lg` in a story.
let desktop = false;
const listeners = new Set<() => void>();
const realMatchMedia = window.matchMedia.bind(window);
const growPastLg = () => {
  desktop = true;
  listeners.forEach((listener) => listener());
};

/** Growing past `lg` closes the drawer, unlocks the page and puts the sidebar back in the layout. */
export const GrowingPastLgClosesTheDrawer: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  beforeEach: () => {
    desktop = false;
    listeners.clear();
    window.matchMedia = (query: string) =>
      query === '(min-width: 64rem)'
        ? ({
            media: query,
            get matches() {
              return desktop;
            },
            addEventListener: (_: string, listener: () => void) => listeners.add(listener),
            removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
          } as unknown as MediaQueryList)
        : realMatchMedia(query);
    return () => {
      window.matchMedia = realMatchMedia;
    };
  },
  args: { onSidebarOpenChange: fn() },
  render: (args) => <MobileShell onSidebarOpenChange={args.onSidebarOpenChange} />,
  play: async ({ args, canvas }) => {
    await openDrawer();
    await expect(document.body.style.overflow).toBe('hidden');
    growPastLg();
    await waitFor(() => expect(args.onSidebarOpenChange).toHaveBeenLastCalledWith(false));
    await expect(body().queryByRole('dialog')).toBeNull();
    await expect(document.body.style.overflow).toBe('');
    // The sidebar is in the layout, with the collapse hamburger; no logo in the Topbar.
    await expect(canvas.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
    await expect(within(canvas.getByRole('banner')).queryByText('Cosmos')).toBeNull();
  },
};

/** The drawer is always expanded, whatever the desktop collapsed state, and has no bottom toggle. */
export const DrawerIgnoresTheCollapsedState: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <MobileShell defaultSidebarCollapsed collapseControl="sidebar" />,
  play: async () => {
    // `collapseControl="sidebar"` puts no toggle in the drawer: the Topbar hamburger opens it.
    const dialog = await openDrawer();
    const nav = within(dialog).getByRole('navigation', { name: 'Main navigation' });
    await expect(within(nav).getByText('Dashboard')).toBeVisible();
    await expect(within(nav).queryByRole('button', { name: /collapse|expand/i })).toBeNull();
  },
};

/** Controlled: the Shell reports the state to move to and shows it once the host passes it back. */
export const ControlledOpenFollowsItsProp: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  args: { sidebarOpen: false, onSidebarOpenChange: fn() },
  render: (args) => <MobileShell {...args} />,
  play: async ({ args }) => {
    await userEvent.click(body().getByRole('button', { name: 'Open navigation' }));
    await expect(args.onSidebarOpenChange).toHaveBeenLastCalledWith(true);
    // The host did not pass it back: still closed.
    await expect(body().queryByRole('dialog')).toBeNull();
  },
};

/** From `lg` up the open state does nothing: the sidebar stays in the layout, no drawer. */
export const DesktopIgnoresTheOpenState: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <MobileShell defaultSidebarOpen />,
  play: async ({ canvas }) => {
    await expect(body().queryByRole('dialog')).toBeNull();
    await expect(canvas.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
    await expect(document.body.style.overflow).toBe('');
    // The Topbar logo is for the screens where the sidebar's own brand is out of sight.
    await expect(within(canvas.getByRole('banner')).queryByText('Cosmos')).toBeNull();
  },
};

// ── Boxed container ──────────────────────────────────────────────────────────

const BoxedShell = (props: Partial<React.ComponentProps<typeof Shell>>) => (
  <Shell
    container="boxed"
    topbar={<Topbar pageTitle="Analytics Dashboard" />}
    sidebar={
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <NavItems />
      </Sidebar>
    }
    {...props}
  >
    <PageContent
      title="Dashboard"
      description="The topbar, the sidebar and the content sit in a column of at most 1440px, centred; the page background shows on both sides."
    />
  </Shell>
);

const desktopViewport = { viewport: { value: 'desktop', isRotated: false } } as const;

/** `container="boxed"` on a 1920px window: a 1440px column, the page background on both sides. */
export const Boxed: Story = {
  globals: desktopViewport,
  render: () => <BoxedShell />,
};

/** Narrower than the column (1280px here), the boxed Shell fills the window like the fluid one. */
export const BoxedFillsANarrowWindow: Story = {
  render: () => <BoxedShell />,
};

/** Below `lg` the boxed Shell is the phone layout: a topbar, the page, the drawer. */
export const BoxedMobile: Story = {
  globals: mobileViewport,
  parameters: mobileDocs,
  render: () => <BoxedShell />,
};

export const BoxedMobileChecks: Story = {
  ...BoxedMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  },
};

export const BoxedCentersTheColumn: Story = {
  tags: ['!dev', '!autodocs'],
  globals: desktopViewport,
  render: () => <BoxedShell />,
  play: async ({ canvas }) => {
    const width = document.documentElement.clientWidth;
    await expect(width).toBeGreaterThan(1440);
    const left = (width - 1440) / 2;
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const bar = canvas.getByRole('banner');
    const main = canvas.getByRole('main');
    // The sidebar starts at the column's edge (less its 1px hairline), the topbar ends at the other.
    const page = document.documentElement;
    await expect(startOffset(nav, page)).toBeCloseTo(left + 1, 0);
    await expect(endOffset(bar, page)).toBeCloseTo(left + 1, 0);
    await expect(endOffset(main, page)).toBeCloseTo(left + 1, 0);
    // The two sides are the page itself: its background, and nothing of the Shell's panels.
    const root = document.elementFromPoint(left / 2, 300) as HTMLElement;
    await expect(root.contains(nav)).toBe(true);
    await expect(getComputedStyle(root).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    await expect(document.elementFromPoint(width - left / 2, 300)).toBe(root);
    // A hairline marks each edge of the column.
    const column = nav.closest('div[class*="max-w-"]') as HTMLElement;
    await expect(column.getBoundingClientRect().width).toBe(1440);
    await expect(getComputedStyle(column).borderLeftWidth).toBe('1px');
    await expect(getComputedStyle(column).borderRightWidth).toBe('1px');
  },
};

export const BoxedFillsTheWindowUnder1440: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <BoxedShell />,
  play: async ({ canvas }) => {
    const width = document.documentElement.clientWidth;
    await expect(width).toBeLessThanOrEqual(1440);
    await expect(
      startOffset(
        canvas.getByRole('navigation', { name: 'Main navigation' }),
        document.documentElement
      )
    ).toBe(0);
    await expect(endOffset(canvas.getByRole('banner'), document.documentElement)).toBe(0);
    expectNoHorizontalOverflow();
    const column = canvas
      .getByRole('navigation', { name: 'Main navigation' })
      .closest('div[class*="max-w-"]') as HTMLElement;
    await expect(getComputedStyle(column).borderLeftWidth).toBe('0px');
  },
};

/** `fluid`, the default, spans any window: nothing is centred. */
export const FluidSpansTheWholeWindow: Story = {
  tags: ['!dev', '!autodocs'],
  globals: desktopViewport,
  render: () => <BoxedShell container="fluid" />,
  play: async ({ canvas }) => {
    await expect(endOffset(canvas.getByRole('banner'), document.documentElement)).toBe(0);
    await expect(
      startOffset(
        canvas.getByRole('navigation', { name: 'Main navigation' }),
        document.documentElement
      )
    ).toBe(0);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * Where the page reads right to left the sidebar is on the right, with its edge on the left. The
 * drawer of the phone layout opens from the right too (`MobileOpen`, in the direction pass).
 */
export const SidebarSitsAtTheStartEdge: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { ...desktopViewport, direction: 'rtl' },
  render: () => <BoxedShell container="fluid" />,
  play: async ({ canvas }) => {
    const page = document.documentElement;
    await expect(getComputedStyle(page).direction).toBe('rtl');
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(startOffset(nav, page)).toBe(0);
    await expect(getComputedStyle(nav).borderLeftWidth).toBe('1px');
    await expect(getComputedStyle(nav).borderRightWidth).toBe('0px');
    // The topbar's title starts at the start edge of the page column, beside the sidebar.
    const bar = canvas.getByRole('banner');
    const title = canvas.getByText('Analytics Dashboard');
    await expect(startOffset(title, bar)).toBeLessThan(endOffset(title, bar));
  },
};

/** The secondary panel is at the end of the line, with its edge on the side that faces the page. */
export const SecondaryPanelSitsAtTheEndEdge: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { ...desktopViewport, direction: 'rtl' },
  render: () => (
    <Shell secondary={<p className="p-4">Details</p>}>
      <PageContent title="Dashboard" description="The page." />
    </Shell>
  ),
  play: async ({ canvas }) => {
    const page = document.documentElement;
    const secondary = canvas.getByText('Details').closest('aside') as HTMLElement;
    await expect(endOffset(secondary, page)).toBe(0);
    await expect(getComputedStyle(secondary).borderRightWidth).toBe('1px');
    await expect(getComputedStyle(secondary).borderLeftWidth).toBe('0px');
  },
};
