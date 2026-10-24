import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, LayoutDashboard, Server, Settings } from 'lucide-react';
import { createRef, useId, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectFocusRing, expectRefFocuses } from '../storybook-helpers';
import { Shell } from './Shell';
import { Sidebar } from './Sidebar';
import { SidebarToggle } from './SidebarToggle';
import { Topbar } from './Topbar';

const meta = {
  title: 'Layout/SidebarToggle',
  component: SidebarToggle,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Nav = () => (
  <>
    <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
    <div className="py-3">
      <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
      <Sidebar.Item icon={Server} label="Servers" />
      <Sidebar.Item icon={Settings} label="Settings" />
    </div>
  </>
);

const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-2xl p-10 text-sm text-[var(--color-text-secondary)]">{children}</div>
);

// A header of the app's own, not a Topbar: the toggle in it takes no props.
const CustomHeader = ({ title }: { title: string }) => (
  <header className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4">
    <SidebarToggle />
    <h1 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h1>
  </header>
);

/** The two looks, `hamburger` for a header and `panel` for the bottom of the sidebar. */
export const Variants: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="flex min-h-screen items-start gap-10 bg-[var(--color-bg-base)] p-6 text-sm text-[var(--color-text-secondary)]">
        <div className="space-y-2">
          <p>hamburger</p>
          <SidebarToggle collapsed={collapsed} onCollapsedChange={setCollapsed} />
        </div>
        <div className="space-y-2">
          <p>panel</p>
          {/* As wide as the sidebar it would sit in. */}
          <div
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-2 transition-[width] duration-300"
            style={{ width: collapsed ? 72 : 264 }}
          >
            <SidebarToggle variant="panel" collapsed={collapsed} onCollapsedChange={setCollapsed} />
          </div>
        </div>
        <p>collapsed = {String(collapsed)}</p>
      </div>
    );
  },
};

/** Inside a Shell, in a header of the app's own: no props, it reads the Shell's state. */
export const InCustomHeader: Story = {
  render: () => (
    <Shell
      topbar={<CustomHeader title="Servers" />}
      sidebar={
        <Sidebar>
          <Nav />
        </Sidebar>
      }
    >
      <Page>
        The toggle in this header is a bare <code>&lt;SidebarToggle /&gt;</code>: the Shell gives it
        the collapsed state.
      </Page>
    </Shell>
  ),
};

/**
 * In the Sidebar's `footer`, next to the Topbar's own toggle: both placements at once, in
 * sync.
 */
export const InSidebarFooter: Story = {
  render: () => (
    <Shell
      topbar={<Topbar pageTitle="Servers" />}
      sidebar={
        <Sidebar footer={<SidebarToggle variant="panel" />}>
          <Nav />
        </Sidebar>
      }
    >
      <Page>
        The Topbar's hamburger is easy to reach; the panel toggle at the bottom of the sidebar is
        where many users look for it. Both move the same Shell state.
      </Page>
    </Shell>
  ),
};

/**
 * Outside a Shell, the host owns the state and passes it with `collapsed` and
 * `onCollapsedChange`; `controls` names the element it collapses.
 */
export const ControlledOutsideShell: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    const sidebarId = useId();
    return (
      <div className="flex h-screen flex-col bg-[var(--color-bg-base)]">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4">
          <SidebarToggle
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            controls={sidebarId}
          />
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Docs</h1>
        </header>
        <div className="flex min-h-0 flex-1">
          <div id={sidebarId}>
            <Sidebar collapsed={collapsed}>
              <Nav />
            </Sidebar>
          </div>
          <main className="flex-1">
            <Page>The host keeps the state: collapsed = {String(collapsed)}.</Page>
          </main>
        </div>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** In a Shell, the toggle says the state with `aria-expanded` and names the nav it collapses. */
export const ShellToggleExposesStateAndTarget: Story = {
  tags: ['!dev', '!autodocs'],
  render: InCustomHeader.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const toggle = canvas.getByRole('button', { name: 'Collapse sidebar' });
    await expect(nav.id).not.toBe('');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('aria-controls', nav.id);
    await expect(toggle).toHaveAttribute('title', 'Collapse sidebar');

    await userEvent.click(toggle);
    await expect(toggle).toHaveAccessibleName('Expand sidebar');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', nav.id);
    await expect(toggle).toHaveAttribute('title', 'Expand sidebar');
  },
};

/** The panel row shows "Collapse" while expanded, and the tooltip only once it is an icon. */
export const PanelShowsItsLabelOrATooltip: Story = {
  tags: ['!dev', '!autodocs'],
  render: Variants.render,
  play: async ({ canvas }) => {
    const [hamburger, panel] = canvas.getAllByRole('button', { name: 'Collapse sidebar' });
    await expect(hamburger).toHaveAttribute('title', 'Collapse sidebar');
    await expect(panel).not.toHaveAttribute('title');
    await expect(panel).toHaveTextContent('Collapse');

    await userEvent.click(panel);
    await expect(hamburger).toHaveAttribute('title', 'Expand sidebar');
    await expect(panel).toHaveAttribute('title', 'Expand sidebar');
    await expect(panel.textContent).toBe('');
  },
};

/** The toggle of a custom header collapses the Shell's sidebar, by click and by keyboard. */
export const CustomHeaderTogglesTheShellSidebar: Story = {
  tags: ['!dev', '!autodocs'],
  render: InCustomHeader.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getBoundingClientRect().width).toBe(264);

    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(72));

    const expand = canvas.getByRole('button', { name: 'Expand sidebar' });
    expand.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(264));
    await expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toHaveFocus();
  },
};

/**
 * The Topbar's toggle, the Sidebar footer's and one in the page all show the Shell's state,
 * whichever is pressed, and the Shell reports each change.
 */
export const TogglesStayInSync: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <Shell
      onCollapsedChange={args.onCollapsedChange}
      topbar={<Topbar pageTitle="Servers" />}
      sidebar={
        <Sidebar footer={<SidebarToggle variant="panel" />}>
          <Nav />
        </Sidebar>
      }
    >
      <Page>
        <SidebarToggle />
      </Page>
    </Shell>
  ),
  play: async ({ args, canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const toggles = () => canvas.getAllByRole('button', { name: /^(Collapse|Expand) sidebar$/ });
    const expectAll = async (expanded: boolean) => {
      for (const toggle of toggles()) {
        await expect(toggle).toHaveAttribute('aria-expanded', String(expanded));
        await expect(toggle).toHaveAttribute('aria-controls', nav.id);
      }
      await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(expanded ? 264 : 72));
    };
    await expect(toggles()).toHaveLength(3);
    await expectAll(true);

    const banner = within(canvas.getByRole('banner'));
    await userEvent.click(banner.getByRole('button', { name: 'Collapse sidebar' }));
    await expectAll(false);
    await userEvent.click(within(nav).getByRole('button', { name: 'Expand sidebar' }));
    await expectAll(true);
    const page = within(canvas.getByRole('main'));
    await userEvent.click(page.getByRole('button', { name: 'Collapse sidebar' }));
    await expectAll(false);

    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(3);
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
  },
};

/**
 * A `sidebarCollapsed` left on the Topbar inside a Shell is not read: its toggle still moves
 * the Shell, and its `onCollapsedChange` hears its own presses.
 */
export const PinnedTopbarPropsDoNotFreezeTheToggle: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <Shell
      topbar={
        <Topbar
          pageTitle="Servers"
          sidebarCollapsed={false}
          onCollapsedChange={args.onCollapsedChange}
        />
      }
      sidebar={
        <Sidebar>
          <Nav />
        </Sidebar>
      }
    >
      <Page>
        <SidebarToggle />
      </Page>
    </Shell>
  ),
  play: async ({ args, canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const banner = within(canvas.getByRole('banner'));
    const page = within(canvas.getByRole('main'));

    await userEvent.click(banner.getByRole('button', { name: 'Collapse sidebar' }));
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(72));
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(1);
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();

    // The page's toggle moves the Shell too; the Topbar shows it, its handler isn't called.
    await userEvent.click(page.getByRole('button', { name: 'Expand sidebar' }));
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(264));
    await expect(banner.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(args.onCollapsedChange).toHaveBeenCalledTimes(1);
  },
};

/** Outside a Shell, the toggle shows the host's state and names the element given in `controls`. */
export const ControlledToggleNamesItsTarget: Story = {
  tags: ['!dev', '!autodocs'],
  render: ControlledOutsideShell.render,
  play: async ({ canvas, canvasElement }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const toggle = canvas.getByRole('button', { name: 'Collapse sidebar' });
    const target = canvasElement.ownerDocument.getElementById(
      toggle.getAttribute('aria-controls') ?? ''
    );
    await expect(target).toContainElement(nav);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    await expect(canvas.getByText(/collapsed = true/)).toBeVisible();
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(72));
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

/**
 * `collapsed` set on a toggle inside a Shell takes over from the Shell: it reports the press
 * and leaves the Shell's sidebar alone.
 */
export const ControlledToggleTakesOverInAShell: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: function Render(args) {
    const panelId = useId();
    return (
      <Shell
        topbar={<Topbar pageTitle="Servers" />}
        sidebar={
          <Sidebar>
            <Nav />
          </Sidebar>
        }
      >
        <Page>
          <section aria-label="Filters" id={panelId}>
            <SidebarToggle
              collapsed={false}
              onCollapsedChange={args.onCollapsedChange}
              controls={panelId}
            />
          </section>
        </Page>
      </Shell>
    );
  },
  play: async ({ args, canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const filters = canvas.getByRole('region', { name: 'Filters' });
    const toggle = within(filters).getByRole('button', { name: 'Collapse sidebar' });
    await expect(toggle).toHaveAttribute('aria-controls', filters.id);

    await userEvent.click(toggle);
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(true);
    await expect(nav.getBoundingClientRect().width).toBe(264);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  },
};

/** With no state to show (outside a Shell, or in one without a sidebar), nothing renders. */
export const RendersNothingWithoutState: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="bg-[var(--color-bg-base)] p-6">
      <SidebarToggle />
      <SidebarToggle variant="panel" onCollapsedChange={() => {}} />
      <Shell>
        <SidebarToggle />
      </Shell>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

const hamburgerRef = createRef<HTMLButtonElement>();
const panelRef = createRef<HTMLButtonElement>();

/** `ref` reaches the button of both variants, which show the focus ring from the keyboard. */
export const ForwardsRefAndShowsTheFocusRing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-start gap-6 bg-[var(--color-bg-base)] p-6">
      <SidebarToggle ref={hamburgerRef} collapsed={false} onCollapsedChange={() => {}} />
      <div className="w-64">
        <SidebarToggle
          ref={panelRef}
          variant="panel"
          collapsed={false}
          onCollapsedChange={() => {}}
        />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const [hamburger, panel] = canvas.getAllByRole('button', { name: 'Collapse sidebar' });
    await expectRefFocuses(hamburgerRef, hamburger);
    await expectRefFocuses(panelRef, panel);
    await expectFocusRing(hamburger);
    await expectFocusRing(panel);
  },
};
