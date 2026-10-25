import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { createRef, useState } from 'react';
import {
  Bell,
  Box,
  Building2,
  Cpu,
  FileText,
  Globe,
  LayoutDashboard,
  Layers,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectRefFocuses, transitionsEnd } from '../storybook-helpers';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  subcomponents: {
    'Sidebar.Brand': Sidebar.Brand,
    'Sidebar.Section': Sidebar.Section,
    'Sidebar.Group': Sidebar.Group,
    'Sidebar.Item': Sidebar.Item,
    'Sidebar.SubMenu': Sidebar.SubMenu,
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-[var(--color-bg-base)]">{children}</div>
);

// `collapsed` is provided by Sidebar via context — children pick it up
// automatically (no need to pass `collapsed` to every Sidebar.Item).
const Nav = () => (
  <div className="py-3">
    <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
    <Sidebar.SubMenu icon={Layers} label="Library" defaultOpen>
      <Sidebar.Item icon={Box} label="Tokens" depth={1} />
      <Sidebar.Item icon={Layers} label="Components" depth={1} />
      <Sidebar.Item icon={FileText} label="Templates" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.SubMenu icon={Globe} label="Monitoring">
      <Sidebar.Item icon={Server} label="Servers" depth={1} />
      <Sidebar.Item icon={Network} label="Network" depth={1} />
      <Sidebar.Item icon={ShieldCheck} label="Health checks" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.Section label="Account">
      <Sidebar.Item
        icon={Bell}
        label="Notifications"
        badge={
          <span className="bg-brand-500 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white">
            3
          </span>
        }
      />
      <Sidebar.Item icon={Settings} label="Settings" />
    </Sidebar.Section>
  </div>
);

// Collapsed, the 72 px sidebar only fits one column: the toggle goes under the avatar.
const Footer = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
  <div className={clsx('flex items-center gap-2', collapsed && 'flex-col')}>
    <span className="bg-brand-500/10 text-brand-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
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
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      onClick={onToggle}
      className="rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
    >
      {collapsed ? (
        <PanelLeftOpen className="h-4 w-4" aria-hidden />
      ) : (
        <PanelLeftClose className="h-4 w-4" aria-hidden />
      )}
    </button>
  </div>
);

export const FullExample: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Sidebar
          collapsed={collapsed}
          footer={<Footer collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />}
        >
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <Nav />
        </Sidebar>
        <main className="flex-1 p-6 text-[var(--color-text-secondary)]">
          <p>
            Click the <PanelLeftClose className="inline h-3 w-3" /> button in the sidebar footer to
            toggle collapsed mode. Children re-render automatically via React context.
          </p>
        </main>
      </Wrap>
    );
  },
};

/** `onCollapsedChange` adds a collapse button at the very bottom of the sidebar. */
export const WithCollapseButton: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <Nav />
        </Sidebar>
        <main className="flex-1 p-6 text-[var(--color-text-secondary)]">
          <p>The button at the bottom collapses and expands the sidebar.</p>
        </main>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(72);
    const expand = canvas.getByRole('button', { name: 'Expand sidebar' });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(expand);
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(264);
  },
};

/** Collapsed to 72 px, the footer's toggle stays inside the sidebar. */
export const CollapsedFooterFits: Story = {
  tags: ['!autodocs'],
  render: FullExample.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.click(canvas.getByRole('button', { name: /collapse|expand/i }));
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(72);
    const toggle = canvas.getByRole('button', { name: /collapse|expand/i }).getBoundingClientRect();
    // The nav's right edge is its 1px border.
    await expect(toggle.right).toBeLessThanOrEqual(nav.getBoundingClientRect().right - 1);
  },
};

export const Collapsed: Story = {
  render: () => (
    <Wrap>
      <Sidebar collapsed>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
        <Nav />
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

// Three levels: Infrastructure › Datacenters › Paris-1. Nested Sidebar.SubMenu
// and Sidebar.Item indent from their nesting, no `depth` prop needed.
const ThreeLevelNav = ({ onPick }: { onPick?: (label: string) => void }) => (
  <div className="py-3">
    <Sidebar.Item icon={LayoutDashboard} label="Dashboard" />
    <Sidebar.SubMenu icon={Network} label="Infrastructure" defaultOpen>
      <Sidebar.SubMenu icon={Building2} label="Datacenters" defaultOpen>
        <Sidebar.Item icon={Server} label="Paris-1" active onClick={() => onPick?.('Paris-1')} />
        <Sidebar.Item icon={Server} label="Frankfurt-2" onClick={() => onPick?.('Frankfurt-2')} />
      </Sidebar.SubMenu>
      <Sidebar.SubMenu icon={Cpu} label="Clusters">
        <Sidebar.Item icon={Box} label="prod-eu" onClick={() => onPick?.('prod-eu')} />
        <Sidebar.Item icon={Box} label="staging" onClick={() => onPick?.('staging')} />
      </Sidebar.SubMenu>
      <Sidebar.Item icon={Globe} label="DNS zones" onClick={() => onPick?.('DNS zones')} />
    </Sidebar.SubMenu>
    <Sidebar.Item icon={Settings} label="Settings" />
  </div>
);

/** Sub-menus nest up to three levels: each level indents, with a guide line. */
export const ThreeLevelMenu: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <ThreeLevelNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const left = (name: string) =>
      canvas.getByRole('button', { name }).querySelector('svg')!.getBoundingClientRect().left;
    // Each level sits one step (20 px) further right.
    await expect(left('Datacenters') - left('Infrastructure')).toBe(20);
    await expect(left('Paris-1') - left('Datacenters')).toBe(20);
    // A closed sub-menu opens on click, its items one level in.
    await userEvent.click(canvas.getByRole('button', { name: 'Clusters' }));
    await expect(left('prod-eu') - left('Clusters')).toBe(20);
  },
};

/** Collapsed, a sub-menu opens its whole tree in a panel to its right. */
export const CollapsedSubMenuOpensFlyout: Story = {
  tags: ['!autodocs'],
  args: { onPick: fn() } as never,
  render: (args) => (
    <Wrap>
      <Sidebar collapsed>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
        <ThreeLevelNav onPick={(args as unknown as { onPick: (l: string) => void }).onPick} />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ args, canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Infrastructure' }));
    const body = within(canvasElement.ownerDocument.body);
    const panel = within(body.getByRole('dialog', { name: 'Infrastructure' }));
    // The tree shows expanded, with labels, from the top level.
    await userEvent.click(panel.getByRole('button', { name: 'Paris-1' }));
    await expect((args as unknown as { onPick: unknown }).onPick).toHaveBeenCalledWith('Paris-1');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** A sub-menu's trigger opens and closes its items, by click or keyboard, and says which. */
export const SubMenuTogglesItsItems: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar>
        <Nav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const library = canvas.getByRole('button', { name: 'Library' });
    const monitoring = canvas.getByRole('button', { name: 'Monitoring' });
    // Library starts open (`defaultOpen`), Monitoring closed.
    await expect(library).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: 'Tokens' })).toBeVisible();
    await expect(monitoring).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('button', { name: 'Servers' })).toBeNull();

    await userEvent.click(monitoring);
    await expect(monitoring).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: 'Servers' })).toBeVisible();
    await userEvent.click(library);
    await expect(library).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('button', { name: 'Tokens' })).toBeNull();

    // Enter and Space work too.
    library.focus();
    await userEvent.keyboard('{Enter}');
    await expect(library).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: 'Tokens' })).toBeVisible();
    await userEvent.keyboard(' ');
    await expect(library).toHaveAttribute('aria-expanded', 'false');
  },
};

// Two groups: Workspace starts open (the default), Archive closed.
const GroupedNav = ({ collapsed }: { collapsed?: boolean }) => (
  <Wrap>
    <Sidebar collapsed={collapsed}>
      <Sidebar.Group label="Workspace">
        <Sidebar.Item icon={Server} label="Servers" />
      </Sidebar.Group>
      <Sidebar.Group label="Archive" defaultOpen={false}>
        <Sidebar.Item icon={FileText} label="Old reports" />
      </Sidebar.Group>
    </Sidebar>
  </Wrap>
);

/** A group's header shows and hides its items. */
export const GroupTogglesItsItems: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GroupedNav />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Servers' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Old reports' })).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvas.getByRole('button', { name: 'Old reports' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Workspace' }));
    await expect(canvas.queryByRole('button', { name: 'Servers' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Workspace' }));
    await expect(canvas.getByRole('button', { name: 'Servers' })).toBeVisible();
  },
};

/** A group's header says whether its items are shown, as a sub-menu's trigger does. */
export const GroupHeaderExposesItsState: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GroupedNav />,
  play: async ({ canvas }) => {
    const workspace = canvas.getByRole('button', { name: 'Workspace' });
    const archive = canvas.getByRole('button', { name: 'Archive' });
    // Workspace starts open (the default), Archive closed.
    await expect(workspace).toHaveAttribute('aria-expanded', 'true');
    await expect(archive).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(archive);
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(workspace);
    await expect(workspace).toHaveAttribute('aria-expanded', 'false');
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
  },
};

/** Collapsed, the group headers go and their items stay, whether the group was open or not. */
export const CollapsedGroupsShowTheirItemsFlat: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GroupedNav collapsed />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Workspace' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Archive' })).toBeNull();
    // Even the group that starts closed: its items are all one tap away.
    await expect(canvas.getByRole('button', { name: 'Servers' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Old reports' })).toBeVisible();
  },
};

/** `active` sets `aria-current` on the item, a link when it has an `href`, a button otherwise. */
export const ActiveItemIsTheCurrentPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onPick: fn() } as never,
  render: (args) => (
    <Wrap>
      <Sidebar>
        <Sidebar.Item icon={LayoutDashboard} label="Dashboard" href="#dashboard" active />
        <Sidebar.Item icon={Server} label="Servers" href="#servers" />
        <Sidebar.Item
          icon={Settings}
          label="Settings"
          onClick={(args as unknown as { onPick: () => void }).onPick}
        />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const current = canvas.getByRole('link', { name: 'Dashboard' });
    await expect(current).toHaveAttribute('href', '#dashboard');
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('link', { name: 'Servers' })).not.toHaveAttribute('aria-current');
    const settings = canvas.getByRole('button', { name: 'Settings' });
    await expect(settings).not.toHaveAttribute('aria-current');
    await userEvent.click(settings);
    await expect((args as unknown as { onPick: unknown }).onPick).toHaveBeenCalledTimes(1);
  },
};

/** Collapsed, an item keeps its name for assistive technology and drops its label, badge and the brand text. */
export const CollapsedItemsAreIconOnly: Story = {
  tags: ['!dev', '!autodocs'],
  render: Collapsed.render,
  play: async ({ canvas }) => {
    const dashboard = canvas.getByRole('button', { name: 'Dashboard' });
    await expect(dashboard).toHaveAttribute('aria-label', 'Dashboard');
    await expect(dashboard).not.toHaveAttribute('title');
    await expect(dashboard.textContent).toBe('');
    // The Notifications badge and the Account section label leave with the text.
    await expect(canvas.getByRole('button', { name: 'Notifications' }).textContent).toBe('');
    await expect(canvas.queryByText('Account')).toBeNull();
    await expect(canvas.getByText('Cosmos')).not.toBeVisible();
  },
};

/** Collapsed, a leaf item names itself in a tooltip on hover and on keyboard focus, links included. */
export const CollapsedItemShowsTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
  render: () => (
    <Wrap>
      <Sidebar collapsed>
        <div className="py-3">
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" href="#dashboard" active />
          <Sidebar.Item icon={Box} label="Tokens" onClick={() => {}} />
        </div>
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const tip = (name: string) => body.getByRole('tooltip', { name, hidden: true });
    const link = canvas.getByRole('link', { name: 'Dashboard' });
    const button = canvas.getByRole('button', { name: 'Tokens' });
    // Not shown until the item is reached.
    await expect(tip('Dashboard')).toHaveClass('opacity-0');
    // Keyboard: Tab focuses the link and shows its tooltip, to the right of the sidebar.
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await waitFor(() => expect(tip('Dashboard')).toHaveClass('opacity-100'));
    await expect(link).toHaveAttribute('aria-describedby', tip('Dashboard').id);
    await expect(tip('Dashboard').getBoundingClientRect().left).toBeGreaterThanOrEqual(
      canvas.getByRole('navigation', { name: 'Main navigation' }).getBoundingClientRect().right
    );
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(tip('Tokens')).toHaveClass('opacity-100'));
    await expect(tip('Dashboard')).toHaveClass('opacity-0');
    // Pointer: hover shows it too.
    await userEvent.unhover(button);
    button.blur();
    await userEvent.hover(link);
    await waitFor(() => expect(tip('Dashboard')).toHaveClass('opacity-100'));
  },
};

const brandLinkRef = createRef<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>();
const brandButtonRef = createRef<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>();
const brandPlainRef = createRef<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>();
const itemLinkRef = createRef<HTMLAnchorElement | HTMLButtonElement>();
const itemButtonRef = createRef<HTMLAnchorElement | HTMLButtonElement>();

/**
 * The refs get the root of Brand and Item: an `<a>` with `href`, a `<button>`
 * with `onClick`, and for a Brand with neither a plain `<div>`.
 */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Sidebar>
      <Sidebar.Brand ref={brandLinkRef} title="Linked brand" href="#brand" />
      <Sidebar.Brand ref={brandButtonRef} title="Pressed brand" onClick={() => {}} />
      <Sidebar.Brand ref={brandPlainRef} title="Plain brand" />
      <Sidebar.Item ref={itemLinkRef} icon={Server} label="Linked item" href="#item" />
      <Sidebar.Item ref={itemButtonRef} icon={Server} label="Pressed item" onClick={() => {}} />
    </Sidebar>
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(brandLinkRef, canvas.getByRole('link', { name: /Linked brand/ }));
    await expectRefFocuses(brandButtonRef, canvas.getByRole('button', { name: /Pressed brand/ }));
    // The plain Brand is a <div>: not focusable, so only the element is checked.
    await expect(brandPlainRef.current).toBeInstanceOf(HTMLDivElement);
    await expect(brandPlainRef.current).toContainElement(canvas.getByText('Plain brand'));
    await expectRefFocuses(itemLinkRef, canvas.getByRole('link', { name: /Linked item/ }));
    await expectRefFocuses(itemButtonRef, canvas.getByRole('button', { name: /Pressed item/ }));
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

export const UncontrolledFromDefaultCollapsed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <Wrap>
      <Sidebar defaultCollapsed onCollapsedChange={args.onCollapsedChange}>
        <Sidebar.Item icon={Server} label="Servers" />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(false);
    await expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
    await expect(canvas.getByText('Servers')).toBeVisible();
  },
};

export const ControlledCollapsedOnlyReports: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <Wrap>
      <Sidebar collapsed defaultCollapsed={false} onCollapsedChange={args.onCollapsedChange}>
        <Sidebar.Item icon={Server} label="Servers" />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(false);
    await expect(canvas.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    await expect(canvas.queryByText('Servers')).toBeNull();
  },
};

// ── Open state (#151) ────────────────────────────────────────────────────────
// `open` / `defaultOpen` / `onOpenChange`, only `undefined` meaning uncontrolled.
// `defaultOpen` starts it open and it closes on its own; held at a fixed `open`,
// it reports what the user asks for and keeps the state it is given.

export const SubMenuAndGroupOpenState: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() } as never,
  render: (args) => {
    const onOpenChange = (args as unknown as { onOpenChange: (open: boolean) => void })
      .onOpenChange;
    return (
      <Wrap>
        <Sidebar>
          <Sidebar.SubMenu icon={Layers} label="Own menu" onOpenChange={onOpenChange}>
            <Sidebar.Item icon={Box} label="Tokens" />
          </Sidebar.SubMenu>
          <Sidebar.SubMenu icon={Globe} label="Held menu" open={false} onOpenChange={onOpenChange}>
            <Sidebar.Item icon={Server} label="Servers" />
          </Sidebar.SubMenu>
          <Sidebar.Group label="Own group" onOpenChange={onOpenChange}>
            <Sidebar.Item icon={FileText} label="Reports" />
          </Sidebar.Group>
          <Sidebar.Group label="Held group" open onOpenChange={onOpenChange}>
            <Sidebar.Item icon={Network} label="Network" />
          </Sidebar.Group>
        </Sidebar>
      </Wrap>
    );
  },
  play: async ({ args, canvas }) => {
    const onOpenChange = (args as unknown as { onOpenChange: ReturnType<typeof fn> }).onOpenChange;

    // Uncontrolled: they move and report.
    await userEvent.click(canvas.getByRole('button', { name: 'Own menu' }));
    await expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole('button', { name: 'Tokens' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Own group' }));
    await expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(canvas.queryByRole('button', { name: 'Reports' })).toBeNull();

    // Held: they report and keep the state they are given.
    await userEvent.click(canvas.getByRole('button', { name: 'Held menu' }));
    await expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole('button', { name: 'Held menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Held group' }));
    await expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(canvas.getByRole('button', { name: 'Network' })).toBeVisible();
    await expect(onOpenChange).toHaveBeenCalledTimes(4);
  },
};

/**
 * A section right under the Brand draws no line of its own: the Brand's bottom
 * border already separates them. The next section still opens with its line.
 */
export const SectionUnderTheBrandDrawsNoSecondLine: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand title="Acme" />
        <Sidebar.Section>
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
        </Sidebar.Section>
        <Sidebar.Section label="Account">
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const brand = canvas.getByText('Acme').closest('[data-sidebar-brand]') as HTMLElement;
    const first = canvas.getByRole('button', { name: 'Dashboard' }).parentElement
      ?.parentElement as HTMLElement;
    const second = canvas.getByText('Account').parentElement as HTMLElement;
    await expect(getComputedStyle(brand).borderBottomWidth).toBe('1px');
    await expect(first.previousElementSibling).toBe(brand);
    await expect(getComputedStyle(first).borderTopWidth).toBe('0px');
    await expect(getComputedStyle(first).marginTop).toBe('0px');
    await expect(getComputedStyle(second).borderTopWidth).toBe('1px');
  },
};
