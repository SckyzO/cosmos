import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { createRef, useId, useState } from 'react';
import {
  Bell,
  Box,
  FileText,
  Globe,
  Info,
  LayoutDashboard,
  Layers,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Settings,
  User,
} from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  expectFocusRing,
  expectNoHorizontalOverflow,
  expectRefFocuses,
  mobileViewport,
  transitionsEnd,
} from '../storybook-helpers';
import { Popover } from '../ui/Popover';
import { Shell } from './Shell';
import { Sidebar, type SidebarExpandOnHover } from './Sidebar';
import { SidebarToggle } from './SidebarToggle';
import { Topbar } from './Topbar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  subcomponents: {
    'Sidebar.Brand': Sidebar.Brand,
    'Sidebar.Section': Sidebar.Section,
    'Sidebar.Group': Sidebar.Group,
    'Sidebar.Item': Sidebar.Item,
    'Sidebar.SubMenu': Sidebar.SubMenu,
    SidebarToggle,
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
      <Sidebar.Item label="Tokens" />
      <Sidebar.Item label="Components" />
      <Sidebar.Item label="Templates" />
    </Sidebar.SubMenu>
    <Sidebar.SubMenu icon={Globe} label="Monitoring">
      <Sidebar.Item label="Servers" />
      <Sidebar.Item label="Network" />
      <Sidebar.Item label="Health checks" />
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
  tags: ['!dev', '!autodocs'],
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

// ── Sections, spacing and styles ─────────────────────────────────────────────

const SectionedNav = () => (
  <>
    <Sidebar.Section label="Main">
      <Sidebar.Item icon={LayoutDashboard} label="Dashboard" />
    </Sidebar.Section>
    <Sidebar.Section label="Monitoring">
      <Sidebar.Item icon={Globe} label="World Map" />
      <Sidebar.Item icon={Bell} label="Notifications" active />
    </Sidebar.Section>
    <Sidebar.Section label="Infrastructure">
      <Sidebar.Item label="Servers" />
      <Sidebar.Item icon={Network} label="Network" />
    </Sidebar.Section>
  </>
);

/**
 * Sections are set apart by space and a title, without lines; rows sit 20 px from the edge and
 * are 40 px tall.
 */
export const Sections: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <SectionedNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const brand = canvas.getByText('Cosmos').closest('.h-\\[72px\\]') as HTMLElement;
    await expect(getComputedStyle(brand).borderBottomWidth).toBe('0px');
    const section = canvas.getByText('Monitoring').parentElement as HTMLElement;
    await expect(getComputedStyle(section).borderTopWidth).toBe('0px');
    await expect(getComputedStyle(section).marginTop).toBe('16px');
    const row = canvas.getByRole('button', { name: 'World Map' }).getBoundingClientRect();
    await expect(row.left - nav.getBoundingClientRect().left).toBe(20);
    await expect(row.height).toBe(40);
    await expect(canvas.getByRole('button', { name: 'Notifications' })).toHaveClass(
      'bg-brand-500/10'
    );
  },
};

/** Collapsed, a "···" mark takes each section title's place. */
export const SectionsCollapsed: Story = {
  render: () => (
    <Wrap>
      <Sidebar collapsed>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
        <SectionedNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(canvas.queryByText('Monitoring')).toBeNull();
    await expect(nav.querySelectorAll('div[aria-hidden="true"] > svg')).toHaveLength(3);
    const row = canvas.getByRole('button', { name: 'World Map' }).getBoundingClientRect();
    await expect(row.left - nav.getBoundingClientRect().left).toBe(8);
  },
};

/** `divider` brings back the lines: under the Brand, and above each section. */
export const Dividers: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand
          logo={<Box className="h-5 w-5" />}
          title="Cosmos"
          subtitle="Design system"
          divider
        />
        <Sidebar.Section divider>
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
        </Sidebar.Section>
        <Sidebar.Section label="Account" divider>
          <Sidebar.Item icon={Bell} label="Notifications" />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    </Wrap>
  ),
};

/** `activeStyle="solid"` fills the active row with the accent. */
export const ActiveSolid: Story = {
  render: () => (
    <Wrap>
      <Sidebar activeStyle="solid">
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <SectionedNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Notifications' })).toHaveClass(
      'bg-brand-500',
      'text-white'
    );
  },
};

/** `logoStyle`: the tinted square (default), a filled one, or the logo alone. */
export const LogoStyles: Story = {
  render: () => (
    <div className="w-[264px] bg-[var(--color-bg-panel)]">
      <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Tint" subtitle="Default" />
      <Sidebar.Brand
        logo={<Box className="h-5 w-5" />}
        title="Solid"
        subtitle="logoStyle=solid"
        logoStyle="solid"
      />
      <Sidebar.Brand
        logo={<Box className="text-brand-500 h-7 w-7" />}
        title="None"
        subtitle="logoStyle=none"
        logoStyle="none"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const square = (title: string) =>
      canvas.getByText(title).closest('.h-\\[72px\\]')!.firstElementChild as HTMLElement;
    await expect(square('Tint')).toHaveClass('bg-brand-500/10');
    await expect(square('Solid')).toHaveClass('bg-brand-500', 'text-white');
    await expect(square('None')).not.toHaveClass('rounded-lg');
  },
};

// ── Footers ──────────────────────────────────────────────────────────────────

const FooterNav = () => (
  <>
    <Sidebar.Item icon={User} label="Profile" />
    <Sidebar.Item icon={Settings} label="Settings" />
    <Sidebar.Item icon={Info} label="About" />
  </>
);

/** Navigation rows in the footer, under a line inset 20 px from each edge. */
export const FooterNavigation: Story = {
  render: () => (
    <Wrap>
      <Sidebar footer={<FooterNav />} footerDivider="inset">
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <SectionedNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const profile = canvas.getByRole('button', { name: 'Profile' });
    const footer = profile.parentElement as HTMLElement;
    await expect(getComputedStyle(footer).borderTopWidth).toBe('0px');
    const line = getComputedStyle(footer, '::before');
    await expect(line.left).toBe('20px');
    await expect(line.right).toBe('20px');
    // The footer's own padding and the row margin add up to the rows' 20 px.
    await expect(profile.getBoundingClientRect().left - nav.getBoundingClientRect().left).toBe(20);
  },
};

/** The user's profile and the collapse button, under a full-width line. */
export const FooterProfile: Story = {
  render: FullExample.render,
  play: async ({ canvas }) => {
    const footer = canvas.getByText('sckyzo').closest('.shrink-0') as HTMLElement;
    await expect(getComputedStyle(footer).borderTopWidth).toBe('1px');
  },
};

/** Navigation rows in the footer, then the collapse row that `onCollapsedChange` adds. */
export const FooterNavigationAndCollapse: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <Wrap>
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} footer={<FooterNav />}>
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <SectionedNav />
        </Sidebar>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await transitionsEnd(nav);
    await expect(nav.getBoundingClientRect().width).toBe(72);
    // Collapsed, the footer rows are icons named by their label.
    const profile = canvas.getByRole('button', { name: 'Profile' }).getBoundingClientRect();
    await expect(profile.right).toBeLessThanOrEqual(nav.getBoundingClientRect().right - 1);
  },
};

export const SubMenuExpanded: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
        <div className="py-3">
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" />
          <Sidebar.SubMenu icon={Layers} label="Library" defaultOpen>
            <Sidebar.Item label="Tokens" active />
            <Sidebar.Item label="Components" />
            <Sidebar.Item label="Templates" />
          </Sidebar.SubMenu>
          <Sidebar.SubMenu icon={Globe} label="Monitoring">
            <Sidebar.Item label="Servers" />
            <Sidebar.Item label="Network" />
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
      <Sidebar.SubMenu label="Datacenters" defaultOpen>
        <Sidebar.Item label="Paris-1" active onClick={() => onPick?.('Paris-1')} />
        <Sidebar.Item label="Frankfurt-2" onClick={() => onPick?.('Frankfurt-2')} />
      </Sidebar.SubMenu>
      <Sidebar.SubMenu label="Clusters">
        <Sidebar.Item label="prod-eu" onClick={() => onPick?.('prod-eu')} />
        <Sidebar.Item label="staging" onClick={() => onPick?.('staging')} />
      </Sidebar.SubMenu>
      <Sidebar.Item label="DNS zones" onClick={() => onPick?.('DNS zones')} />
    </Sidebar.SubMenu>
    <Sidebar.Item icon={Settings} label="Settings" />
  </div>
);

/**
 * Sub-menus nest, three levels reading best: nested rows show their label alone, smaller at each
 * level, with a guide line on their left.
 */
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
    const left = (name: string) => canvas.getByText(name).getBoundingClientRect().left;
    // The first nested level lines up under the top-level label, the next one 16 px further.
    await expect(left('Datacenters')).toBe(left('Infrastructure'));
    await expect(left('Paris-1') - left('Datacenters')).toBe(16);
    // No icon below the top level, and smaller rows as they go down.
    await expect(
      canvas.getByRole('button', { name: 'Datacenters' }).querySelector('svg.h-5')
    ).toBeNull();
    const height = (name: string) =>
      canvas.getByRole('button', { name }).getBoundingClientRect().height;
    await expect(height('Infrastructure')).toBe(40);
    await expect(height('Datacenters')).toBe(32);
    await expect(height('Paris-1')).toBe(28);
    // A closed sub-menu opens on click, its items one level in.
    await userEvent.click(canvas.getByRole('button', { name: 'Clusters' }));
    await expect(left('prod-eu') - left('Clusters')).toBe(16);
  },
};

// Data from an app, rackscope's infrastructure: sites and rooms have a page of their own (their
// row splits into the label and a chevron), aisles only group racks (muted), racks are pages.
const TreeNav = ({ onNavigate }: { onNavigate?: (page: string) => void }) => (
  <Sidebar.Section label="Infrastructure">
    <Sidebar.SubMenu
      icon={Globe}
      label="Paris HPC Datacenter"
      onClick={() => onNavigate?.('site')}
      defaultOpen
    >
      <Sidebar.SubMenu label="Room A, compute" onClick={() => onNavigate?.('room-a')} defaultOpen>
        <Sidebar.SubMenu label="Aisle Compute Std" defaultOpen>
          <Sidebar.Item label="Compute Rack C01" active onClick={() => onNavigate?.('c01')} />
          <Sidebar.Item label="Compute Rack C02" onClick={() => onNavigate?.('c02')} />
          <Sidebar.Item label="Compute Rack C03" onClick={() => onNavigate?.('c03')} />
        </Sidebar.SubMenu>
        <Sidebar.SubMenu label="Aisle GPU">
          <Sidebar.Item label="GPU Rack G01" onClick={() => onNavigate?.('g01')} />
        </Sidebar.SubMenu>
      </Sidebar.SubMenu>
      <Sidebar.SubMenu label="Room B, services" onClick={() => onNavigate?.('room-b')}>
        <Sidebar.Item label="Storage Rack S01" onClick={() => onNavigate?.('s01')} />
      </Sidebar.SubMenu>
    </Sidebar.SubMenu>
  </Sidebar.Section>
);

/**
 * A tree of four levels. A sub-menu with a page splits its row (the label opens the page, the
 * chevron only toggles), the sub-menus on the way to the active row take the accent, and a
 * nested sub-menu without a page is muted.
 */
export const Tree: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Rackscope" subtitle="Datacenter" />
        <TreeNav />
      </Sidebar>
    </Wrap>
  ),
};

export const TreeRowsSplitAndTrail: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onNavigate: fn() } as never,
  render: (args) => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand title="Rackscope" />
        <TreeNav onNavigate={(args as unknown as { onNavigate: (p: string) => void }).onNavigate} />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const onNavigate = (args as unknown as { onNavigate: ReturnType<typeof fn> }).onNavigate;
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const fromNav = (el: Element) =>
      el.getBoundingClientRect().left - nav.getBoundingClientRect().left;

    // The trail: the site and the room hold the active rack and take the accent; the aisle too.
    await expect(
      canvas.getByRole('button', { name: 'Paris HPC Datacenter' }).parentElement
    ).toHaveClass('text-brand-600');
    await expect(canvas.getByRole('button', { name: 'Aisle Compute Std' })).toHaveClass(
      'text-brand-600'
    );
    // A nested sub-menu without a page, off the trail, is muted.
    await expect(canvas.getByRole('button', { name: 'Aisle GPU' })).toHaveClass(
      'text-[var(--color-text-muted)]'
    );

    // The active pill starts at its own indent: 16 px per level past the first nested label.
    const rack = canvas.getByRole('button', { name: 'Compute Rack C01' });
    await expect(fromNav(rack)).toBe(86);
    await expect(fromNav(canvas.getByText('Compute Rack C01'))).toBe(96);
    await expect(rack.getBoundingClientRect().height).toBe(26);

    // The chevron only toggles, without opening the page.
    const chevron = canvas.getByRole('button', { name: 'Room B, services sub-menu' });
    await expect(chevron).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('button', { name: 'Storage Rack S01' })).toBeNull();
    await userEvent.click(chevron);
    await expect(chevron).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: 'Storage Rack S01' })).toBeVisible();
    await expect(onNavigate).not.toHaveBeenCalled();
    await userEvent.click(chevron);
    await expect(canvas.queryByRole('button', { name: 'Storage Rack S01' })).toBeNull();

    // The label opens the page and unfolds the list.
    await userEvent.click(canvas.getByRole('button', { name: 'Room B, services' }));
    await expect(onNavigate).toHaveBeenCalledWith('room-b');
    await expect(chevron).toHaveAttribute('aria-expanded', 'true');

    // The chevron names the list it controls.
    await expect(chevron).toHaveAttribute(
      'aria-controls',
      canvas.getByRole('button', { name: 'Storage Rack S01' }).closest('[id]')!.id
    );
  },
};

// ── Content width ────────────────────────────────────────────────────────────

const ROOM_A = 'Room A, compute and storage';
const ROOM_B = 'Room B, GPU and high-density hall';
// Wider than the default maximum (320 px) at its level: the sidebar stops growing, the label ends
// in an ellipsis.
const ROOM_C = 'Room C, GPU and high-density hall, mezzanine';

// Sites hold rooms. Paris is open, with a room that already asks for more than the minimum width;
// Lyon is folded, with a wider one; `longRoom` adds one no width holds, under Paris.
const SitesNav = ({ longRoom = false }: { longRoom?: boolean }) => (
  <Sidebar.Section label="Infrastructure">
    <Sidebar.Item icon={LayoutDashboard} label="Overview" />
    <Sidebar.SubMenu icon={Globe} label="Paris HPC Datacenter" defaultOpen>
      <Sidebar.Item label={ROOM_A} />
      {longRoom && <Sidebar.Item label={ROOM_C} />}
    </Sidebar.SubMenu>
    <Sidebar.SubMenu icon={Globe} label="Lyon Datacenter">
      <Sidebar.Item label={ROOM_B} />
    </Sidebar.SubMenu>
  </Sidebar.Section>
);

const widthOf = (el: Element) => el.getBoundingClientRect().width;

// The width once it has stopped moving: no transition on the nav, and the same over two reads
// a frame apart (the width is set a render after the change that moves it).
const settledWidth = async (nav: Element) => {
  await nav.ownerDocument.fonts.ready;
  let last = -1;
  await waitFor(
    async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const width = widthOf(nav);
      const settled = width === last && nav.getAnimations().length === 0;
      last = width;
      await expect(settled).toBe(true);
    },
    { timeout: 4000 }
  );
  return last;
};

/**
 * The expanded sidebar is as wide as its widest visible row, deep levels included: from `width`
 * (264 px) up to `maxWidth` (320 px). Unfold Lyon and the sidebar widens for its longer room; fold
 * it and it narrows back, never below `width`.
 */
export const WidthFollowsContent: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Rackscope" subtitle="Datacenter" />
        <SitesNav />
      </Sidebar>
    </Wrap>
  ),
};

/**
 * Past `maxWidth` a label ends in an ellipsis, and its row shows the full label in a tooltip on
 * hover and on keyboard focus. Rows whose label shows whole have no tooltip.
 */
export const LongLabelsHitTheMaxWidth: Story = {
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Rackscope" subtitle="Datacenter" />
        <SitesNav longRoom />
      </Sidebar>
    </Wrap>
  ),
};

/** With short labels the expanded sidebar keeps `width`, whatever `maxWidth` allows. */
export const ShortLabelsKeepTheMinimumWidth: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [width, setWidth] = useState(264);
    return (
      <Wrap>
        <Sidebar width={width}>
          <Nav />
        </Sidebar>
        <button type="button" onClick={() => setWidth(300)} className="h-9 self-start">
          Raise width
        </button>
      </Wrap>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(await settledWidth(nav)).toBe(264);
    // `width` is the minimum, so a larger one raises it.
    await userEvent.click(canvas.getByRole('button', { name: 'Raise width' }));
    await waitFor(() => expect(widthOf(nav)).toBe(300), { timeout: 3000 });
    // Nothing is cut, so nothing has a tooltip.
    await expect(
      within(canvasElement.ownerDocument.body).queryAllByRole('tooltip', { hidden: true })
    ).toHaveLength(0);
  },
};

/** Unfolding a sub-menu with a longer label widens the sidebar, folding it narrows it back. */
export const WidthGrowsWithTheUnfoldedRows: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar>
        <SitesNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    // Paris's room asks for more than the 264 px minimum, and less than the 320 px maximum.
    const open = await settledWidth(nav);
    await expect(open).toBeGreaterThan(264);
    await expect(open).toBeLessThan(320);
    // Lyon's room is folded away: it does not count yet.
    await expect(canvas.getByText(ROOM_B)).not.toBeVisible();

    const lyon = canvas.getByRole('button', { name: 'Lyon Datacenter' });
    await userEvent.click(lyon);
    await waitFor(() => expect(widthOf(nav)).toBeGreaterThan(open), { timeout: 3000 });
    const wider = await settledWidth(nav);
    await expect(wider).toBeGreaterThan(open);
    await expect(wider).toBeLessThanOrEqual(320);
    // Whole in the room it asked for: no ellipsis, no tooltip.
    const label = canvas.getByText(ROOM_B);
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    await expect(
      within(canvasElement.ownerDocument.body).queryAllByRole('tooltip', { hidden: true })
    ).toHaveLength(0);

    await userEvent.click(lyon);
    await waitFor(() => expect(widthOf(nav)).toBeLessThan(wider), { timeout: 3000 });
    await expect(await settledWidth(nav)).toBe(open);
  },
};

/** A label longer than the maximum is cut at it, and its row names it in full in a tooltip. */
export const CutLabelShowsItsFullNameInATooltip: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar>
        <SitesNav longRoom />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const tip = (name: string) => body.queryByRole('tooltip', { name, hidden: true });
    await expect(await settledWidth(nav)).toBe(320);

    // The label is cut with an ellipsis; the row that shows another label whole is not.
    const cut = canvas.getByRole('button', { name: ROOM_C });
    const label = within(cut).getByText(ROOM_C);
    await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    const whole = canvas.getByRole('button', { name: ROOM_A });
    await expect(within(whole).getByText(ROOM_A).scrollWidth).toBeLessThanOrEqual(
      within(whole).getByText(ROOM_A).clientWidth
    );
    // The tooltip's wrapper leaves the row where it is: the same indent, margin and height.
    const box = (row: Element) => row.getBoundingClientRect();
    await expect(box(cut).left).toBe(box(whole).left);
    await expect(box(cut).right).toBe(box(whole).right);
    await expect(box(cut).height).toBe(box(whole).height);
    await expect(nav.getBoundingClientRect().right - box(cut).right).toBe(21);
    // Only the cut row has a tooltip.
    await expect(tip(ROOM_C)).not.toBeNull();
    await expect(tip(ROOM_A)).toBeNull();
    await expect(whole).not.toHaveAttribute('aria-describedby');
    await expect(tip(ROOM_C)).toHaveClass('opacity-0');

    // Hover shows it, to the right of the sidebar.
    await userEvent.hover(cut);
    await waitFor(() => expect(tip(ROOM_C)).toHaveClass('opacity-100'));
    await expect(cut).toHaveAttribute('aria-describedby', tip(ROOM_C)!.id);
    await expect(tip(ROOM_C)!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      nav.getBoundingClientRect().right
    );
    await userEvent.unhover(cut);
    await waitFor(() => expect(tip(ROOM_C)).toHaveClass('opacity-0'));

    // So does keyboard focus.
    for (let i = 0; i < 12 && cut !== document.activeElement; i += 1) await userEvent.tab();
    await expect(cut).toHaveFocus();
    await waitFor(() => expect(tip(ROOM_C)).toHaveClass('opacity-100'));
  },
};

const SUB_PLAIN = 'Room D, GPU and high-density hall, mezzanine';
const SUB_SPLIT = 'Room E, storage and backup hall, north mezzanine';

/** A sub-menu's row, plain or split in a label and a chevron, names its cut label like an item. */
export const CutSubMenuLabelsShowTheirFullName: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar>
        <Sidebar.SubMenu icon={Globe} label="Paris HPC Datacenter" defaultOpen>
          <Sidebar.SubMenu label={SUB_PLAIN}>
            <Sidebar.Item label="Rack C01" />
          </Sidebar.SubMenu>
          <Sidebar.SubMenu label={SUB_SPLIT} onClick={() => {}}>
            <Sidebar.Item label="Rack S01" />
          </Sidebar.SubMenu>
        </Sidebar.SubMenu>
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const tip = (name: string) => body.queryByRole('tooltip', { name, hidden: true });
    await expect(
      await settledWidth(canvas.getByRole('navigation', { name: 'Main navigation' }))
    ).toBe(320);

    // The plain trigger shows its tooltip, and still toggles its list.
    const plain = canvas.getByRole('button', { name: SUB_PLAIN });
    await expect(getComputedStyle(within(plain).getByText(SUB_PLAIN)).textOverflow).toBe(
      'ellipsis'
    );
    await userEvent.hover(plain);
    await waitFor(() => expect(tip(SUB_PLAIN)).toHaveClass('opacity-100'));
    await userEvent.unhover(plain);
    await userEvent.click(plain);
    await expect(canvas.getByRole('button', { name: SUB_PLAIN })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(canvas.getByRole('button', { name: 'Rack C01' })).toBeVisible();

    // So does the label of a split row, whose chevron still only toggles.
    const split = canvas.getByRole('button', { name: SUB_SPLIT });
    await userEvent.hover(split);
    await waitFor(() => expect(tip(SUB_SPLIT)).toHaveClass('opacity-100'));
    await userEvent.unhover(split);
    const chevron = canvas.getByRole('button', { name: `${SUB_SPLIT} sub-menu` });
    await userEvent.click(chevron);
    await expect(chevron).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: 'Rack S01' })).toBeVisible();
  },
};

/** A custom `maxWidth` moves the cap, and one equal to `width` gives back a fixed width. */
export const MaxWidthIsHonoured: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [maxWidth, setMaxWidth] = useState(400);
    return (
      <Wrap>
        <Sidebar maxWidth={maxWidth}>
          <SitesNav longRoom />
        </Sidebar>
        <div className="flex gap-2 self-start p-2">
          {[400, 300, 264].map((value) => (
            <button key={value} type="button" onClick={() => setMaxWidth(value)}>
              {`maxWidth ${value}`}
            </button>
          ))}
        </div>
      </Wrap>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const tip = () => body.queryByRole('tooltip', { name: ROOM_C, hidden: true });
    const pick = (value: number) =>
      userEvent.click(canvas.getByRole('button', { name: `maxWidth ${value}` }));

    // 400 px holds the room that 320 px cuts: wider than the default maximum, and no tooltip.
    const roomy = await settledWidth(nav);
    await expect(roomy).toBeGreaterThan(320);
    await expect(roomy).toBeLessThanOrEqual(400);
    await expect(tip()).toBeNull();
    const label = canvas.getByText(ROOM_C);
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);

    // A lower cap holds the sidebar at it, and cuts the room again.
    await pick(300);
    await waitFor(() => expect(widthOf(nav)).toBe(300), { timeout: 3000 });
    await waitFor(() => expect(tip()).not.toBeNull());
    await expect(canvas.getByText(ROOM_C).scrollWidth).toBeGreaterThan(
      canvas.getByText(ROOM_C).clientWidth
    );

    // As low as `width`: the fixed width of before the sidebar followed its content.
    await pick(264);
    await waitFor(() => expect(widthOf(nav)).toBe(264), { timeout: 3000 });

    await pick(400);
    await waitFor(() => expect(widthOf(nav)).toBe(roomy), { timeout: 3000 });
    await waitFor(() => expect(tip()).toBeNull());
  },
};

/**
 * Collapsed, the rail keeps `collapsedWidth` whatever the labels need. Expanded from a rail the
 * sidebar was mounted as, it grows to the width of its rows once it has opened.
 */
export const CollapsedWidthIgnoresTheContent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar defaultCollapsed collapsedWidth={80} onCollapsedChange={() => {}}>
        <SitesNav longRoom />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(await settledWidth(nav)).toBe(80);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await waitFor(() => expect(widthOf(nav)).toBe(320), { timeout: 4000 });
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await waitFor(() => expect(widthOf(nav)).toBe(80), { timeout: 3000 });
    // Back to the width it had: its rows are the same.
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await waitFor(() => expect(widthOf(nav)).toBe(320), { timeout: 3000 });
  },
};

/** The width measured at mount shows at once: the sidebar does not grow from `width` on load. */
export const FirstWidthShowsWithoutATransition: Story = {
  tags: ['!dev', '!autodocs'],
  // The story is about the transition: keep it in the story tests.
  parameters: { settleMotion: false },
  render: () => {
    const [shown, setShown] = useState(false);
    return (
      <Wrap>
        <button type="button" onClick={() => setShown(true)} className="h-9 self-start">
          Show sidebar
        </button>
        {shown && (
          <Sidebar>
            <SitesNav />
          </Sidebar>
        )}
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show sidebar' }));
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getAnimations()).toHaveLength(0);
    await expect(widthOf(nav)).toBeGreaterThan(264);
  },
};

/** Collapsed, a sub-menu opens its whole tree in a panel to its right. */
export const CollapsedSubMenuOpensFlyout: Story = {
  tags: ['!dev', '!autodocs'],
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
        <Sidebar.Item label="Servers" />
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
        <Sidebar.Item label="Servers" />
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
        <Sidebar.Item label="Servers" />
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
            <Sidebar.Item label="Tokens" />
          </Sidebar.SubMenu>
          <Sidebar.SubMenu icon={Globe} label="Held menu" open={false} onOpenChange={onOpenChange}>
            <Sidebar.Item label="Servers" />
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
        <Sidebar.Brand title="Acme" divider />
        <Sidebar.Section divider>
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
        </Sidebar.Section>
        <Sidebar.Section label="Account" divider>
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

// ── SidebarToggle ────────────────────────────────────────────────────────────

const ToggleNav = () => (
  <>
    <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
    <div className="py-3">
      <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
      <Sidebar.Item label="Servers" />
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
          <ToggleNav />
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
          <ToggleNav />
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
              <ToggleNav />
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
          <ToggleNav />
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
          <ToggleNav />
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
            <ToggleNav />
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

// ── Expand on hover ──────────────────────────────────────────────────────────

const HoverNav = () => (
  <>
    <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" subtitle="Design system" />
    <div className="py-3">
      <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
      <Sidebar.SubMenu icon={Layers} label="Library">
        <Sidebar.Item label="Tokens" />
        <Sidebar.Item label="Components" />
      </Sidebar.SubMenu>
      <Sidebar.Item icon={Settings} label="Settings" />
    </div>
  </>
);

// Cards from the page's left edge, so the sidebar is seen over them or pushing them.
const HoverPage = () => (
  <div className="p-6">
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6"
        >
          <p className="text-2xs tracking-wider text-[var(--color-text-muted)] uppercase">
            Card {n}
          </p>
          <p className="text-brand-600 dark:text-brand-400 mt-2 text-3xl font-bold">{n * 12}</p>
        </div>
      ))}
    </div>
    <button
      type="button"
      className="focus-visible:focus-indicator mt-6 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
    >
      Page action
    </button>
  </div>
);

type HoverShellProps = Omit<React.ComponentProps<typeof Shell>, 'children' | 'sidebar'> & {
  mode: SidebarExpandOnHover;
  footer?: React.ReactNode;
};

// A Shell with a collapsed sidebar: the page beside it is what shows the mode.
const HoverShell = ({ mode, footer, ...shell }: HoverShellProps) => (
  <Shell
    defaultSidebarCollapsed
    topbar={<Topbar pageTitle="Servers" />}
    sidebar={
      <Sidebar expandOnHover={mode} footer={footer}>
        <HoverNav />
      </Sidebar>
    }
    {...shell}
  >
    <HoverPage />
  </Shell>
);

const RAIL = 72;
const EXPANDED = 264;

const mainNav = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole('navigation', { name: 'Main navigation' });
const navWidth = (nav: HTMLElement) => nav.getBoundingClientRect().width;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The test browser's pointer rests in the page's corner, over the sidebar, and Chromium reports it
// once the page has laid out: a stray hover that would hold the sidebar open. Under load that report
// can come after the test's own unhover, and the sidebar opens again. Every story that hovers or
// focuses the rail sends it away first, so that only what the test does counts.
const settlePointer = async (nav: HTMLElement) => {
  await pause(300);
  await userEvent.unhover(nav);
  await pause(150);
};

// Past the open delay and the width transition: what shows is the rail, or the expanded sidebar.
const expectRail = (nav: HTMLElement) =>
  waitFor(() => {
    expect(navWidth(nav)).toBe(RAIL);
    expect(within(nav).queryByText('Dashboard')).toBeNull();
  });
const expectExpanded = (nav: HTMLElement) =>
  waitFor(() => {
    expect(navWidth(nav)).toBe(EXPANDED);
    expect(within(nav).getByText('Dashboard')).toBeVisible();
  });

/**
 * `expandOnHover="overlay"`: after 150 ms over the collapsed rail, the sidebar opens at its
 * expanded width above the page, with a shadow. The page does not move: the rail keeps its
 * place in the layout. It closes when the pointer leaves. The collapsed state is not touched, so
 * the toggles keep saying "Expand sidebar".
 */
export const HoverOverlaysThePage: Story = {
  render: () => <HoverShell mode="overlay" />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await settlePointer(nav);
    const main = canvas.getByRole('main');
    const pageLeft = main.getBoundingClientRect().left;
    await expect(navWidth(nav)).toBe(RAIL);

    await userEvent.hover(nav);
    await expectExpanded(nav);
    await transitionsEnd(nav);
    // The page stays where it was, under the sidebar, which is on top of it.
    await expect(main.getBoundingClientRect().left).toBe(pageLeft);
    const box = nav.getBoundingClientRect();
    await expect(nav).toContainElement(
      document.elementFromPoint(box.left + EXPANDED - 24, box.top + 300) as HTMLElement
    );
    await expect(getComputedStyle(nav).boxShadow).not.toBe('none');

    await userEvent.unhover(nav);
    await expectRail(nav);
    await expect(main.getBoundingClientRect().left).toBe(pageLeft);
  },
};

/**
 * `expandOnHover="push"`: the sidebar's width grows over 300 ms, after the same 150 ms, and the
 * page makes room for it, then moves back when the pointer leaves.
 */
export const HoverPushesThePage: Story = {
  render: () => <HoverShell mode="push" />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await settlePointer(nav);
    const main = canvas.getByRole('main');
    await expect(main.getBoundingClientRect().left).toBe(RAIL);

    await userEvent.hover(nav);
    await expectExpanded(nav);
    await waitFor(() => expect(main.getBoundingClientRect().left).toBe(EXPANDED));
    await expect(getComputedStyle(nav).boxShadow).toBe('none');

    await userEvent.unhover(nav);
    await expectRail(nav);
    await waitFor(() => expect(main.getBoundingClientRect().left).toBe(RAIL));
  },
};

/** The pointer must rest on the rail for a moment: right after it arrives, it is still the rail. */
export const HoverOpensAfterTheDelayAndLeavingCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <HoverShell mode="overlay" />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await settlePointer(nav);
    await userEvent.hover(nav);
    await expect(navWidth(nav)).toBe(RAIL);
    await expect(within(nav).queryByText('Dashboard')).toBeNull();
    await expectExpanded(nav);

    await userEvent.unhover(nav);
    await expectRail(nav);
  },
};

/** Crossing the rail on the way to the page opens nothing, in either mode. */
export const CrossingTheRailOpensNothing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <HoverShell mode="push" />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    const main = canvas.getByRole('main');
    await settlePointer(nav);
    await userEvent.hover(nav);
    await pause(40);
    await userEvent.unhover(nav);
    await pause(400);
    await expect(navWidth(nav)).toBe(RAIL);
    await expect(main.getBoundingClientRect().left).toBe(RAIL);
  },
};

/** The keyboard opens it with no delay, Escape closes it, and leaving closes it. */
export const FocusOpensAndEscapeOrLeavingCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <HoverShell mode="overlay" />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    const inNav = () => nav.contains(document.activeElement);
    const leave = async () => {
      for (let i = 0; i < 8 && inNav(); i += 1) await userEvent.tab();
      await expect(inNav()).toBe(false);
      // Past the delay that tells leaving from moving to another element.
      await pause(250);
    };

    await settlePointer(nav);
    // Tab onto the first row: it opens, and focus stays on that row, not on <body>.
    await userEvent.tab();
    await expect(inNav()).toBe(true);
    await expectExpanded(nav);
    await expect(within(nav).getByRole('button', { name: 'Dashboard' })).toHaveFocus();

    // Escape closes it, with focus where it was.
    await userEvent.keyboard('{Escape}');
    await expectRail(nav);
    await expect(within(nav).getByRole('button', { name: 'Dashboard' })).toHaveFocus();

    // It stays closed while focus moves inside, and until focus comes back.
    await userEvent.tab();
    await expect(inNav()).toBe(true);
    await pause(300);
    await expect(navWidth(nav), 'closed while focus moves inside').toBe(RAIL);
    await leave();
    await expect(navWidth(nav), 'closed after focus left').toBe(RAIL);
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await expect(inNav()).toBe(true);
    await expectExpanded(nav);

    // Focus leaving closes it.
    await leave();
    await expectRail(nav);
  },
};

/**
 * Pressing Escape with the pointer inside closes it too, and it stays closed until the pointer
 * leaves and comes back.
 */
export const EscapeClosesUntilThePointerReturns: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <HoverShell mode="push" />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await userEvent.hover(nav);
    await expectExpanded(nav);

    await userEvent.keyboard('{Escape}');
    await expectRail(nav);
    // Still over it: nothing re-opens it.
    await userEvent.hover(within(nav).getByRole('button', { name: 'Settings' }));
    await pause(400);
    await expect(navWidth(nav)).toBe(RAIL);

    await userEvent.unhover(nav);
    await pause(250);
    await userEvent.hover(nav);
    await expectExpanded(nav);
  },
};

const AccountMenu = () => (
  <Popover>
    <Popover.Trigger
      aria-label="Account"
      className="flex size-8 items-center justify-center rounded-full bg-[var(--color-bg-base)] text-[var(--color-text-secondary)]"
    >
      <User className="h-4 w-4" />
    </Popover.Trigger>
    <Popover.Content position="end" aria-label="Account menu">
      <button type="button" className="px-3 py-2 text-sm">
        Sign out
      </button>
    </Popover.Content>
  </Popover>
);

/**
 * A popover open inside the sidebar takes the first Escape, as the top overlay: the sidebar stays
 * open, and the second Escape closes it.
 */
export const EscapeGoesToAnOpenPopoverFirst: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <HoverShell mode="overlay" footer={<AccountMenu />} />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await userEvent.hover(nav);
    await expectExpanded(nav);

    await userEvent.click(within(nav).getByRole('button', { name: 'Account' }));
    const signOut = await within(document.body).findByRole('button', { name: 'Sign out' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(signOut).not.toBeVisible());
    // The popover took it. The pointer is still over the sidebar, which is open.
    await pause(250);
    await expect(navWidth(nav)).toBe(EXPANDED);

    await userEvent.keyboard('{Escape}');
    await expectRail(nav);
  },
};

/**
 * Expanding on hover does not move the collapsed state: no `onCollapsedChange`, and every toggle
 * still says the sidebar is collapsed.
 */
export const HoverKeepsTheShellCollapsed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <HoverShell
      mode="overlay"
      onCollapsedChange={args.onCollapsedChange}
      footer={<SidebarToggle variant="panel" />}
    />
  ),
  play: async ({ args, canvas }) => {
    const nav = mainNav(canvas);
    await settlePointer(nav);
    const toggles = () => canvas.getAllByRole('button', { name: /^(Collapse|Expand) sidebar$/ });
    const expectCollapsedToggles = async () => {
      await expect(toggles()).toHaveLength(2);
      for (const toggle of toggles()) {
        await expect(toggle).toHaveAccessibleName('Expand sidebar');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      }
    };
    await expectCollapsedToggles();

    await userEvent.hover(nav);
    await expectExpanded(nav);
    await expectCollapsedToggles();
    await userEvent.unhover(nav);
    await expectRail(nav);
    await expectCollapsedToggles();
    await expect(args.onCollapsedChange).not.toHaveBeenCalled();
  },
};

/** Outside a Shell too: a controlled `collapsed` stays, and `onCollapsedChange` is not called. */
export const HoverKeepsAControlledSidebarCollapsed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <Wrap>
      <Sidebar collapsed expandOnHover="push" onCollapsedChange={args.onCollapsedChange}>
        <HoverNav />
      </Sidebar>
      <main className="flex-1">
        <HoverPage />
      </main>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const nav = mainNav(canvas);
    await settlePointer(nav);
    const toggle = () => canvas.getByRole('button', { name: /^(Collapse|Expand) sidebar$/ });
    await userEvent.hover(nav);
    await expectExpanded(nav);
    await expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.unhover(nav);
    await expectRail(nav);
    await expect(args.onCollapsedChange).not.toHaveBeenCalled();
  },
};

/**
 * The toggle works under the pointer: pressed while the sidebar is open on hover, it keeps it
 * open for good; pressed again, it shows the rail at once, even with the pointer still over it,
 * and the next hover opens it again.
 */
export const ToggleUnderThePointerPinsThenShowsTheRail: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onCollapsedChange: fn() },
  render: (args) => (
    <HoverShell
      mode="overlay"
      onCollapsedChange={args.onCollapsedChange}
      footer={<SidebarToggle variant="panel" />}
    />
  ),
  play: async ({ args, canvas }) => {
    const nav = mainNav(canvas);
    await userEvent.hover(nav);
    await expectExpanded(nav);

    await userEvent.click(within(nav).getByRole('button', { name: 'Expand sidebar' }));
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(false);
    const collapse = within(nav).getByRole('button', { name: 'Collapse sidebar' });
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    // Open for good: no longer over the page, its shadow fades out.
    await waitFor(() => expect(getComputedStyle(nav).boxShadow).toBe('none'));
    await expect(navWidth(nav)).toBe(EXPANDED);

    await userEvent.click(collapse);
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
    await expectRail(nav);
    await pause(400);
    await expect(navWidth(nav)).toBe(RAIL);

    await userEvent.unhover(nav);
    await pause(250);
    await userEvent.hover(nav);
    await expectExpanded(nav);
    await userEvent.unhover(nav);
    await expectRail(nav);
  },
};

/** The default is off: the rail stays a rail under the pointer and under focus. */
export const RailStaysARailByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <HoverShell mode={false} />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await userEvent.hover(nav);
    await userEvent.tab();
    await expect(nav).toContainElement(document.activeElement as HTMLElement);
    await pause(400);
    await expect(navWidth(nav)).toBe(RAIL);
    await expect(within(nav).queryByText('Dashboard')).toBeNull();
  },
};

/** Below `lg` there is no hover to expand on: the standalone rail stays a rail. */
export const BelowLgNothingExpands: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar collapsed expandOnHover="overlay">
        <HoverNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await userEvent.hover(nav);
    await userEvent.tab();
    await pause(500);
    await expect(navWidth(nav)).toBe(RAIL);
    await expect(within(nav).queryByText('Dashboard')).toBeNull();
  },
};

// A device with no hover (a touch screen), whatever its width: the media query says so.
const realMatchMedia = window.matchMedia.bind(window);

/** A pointer that cannot hover (a touch screen) never expands it, at any width. */
export const TouchScreenNothingExpands: Story = {
  tags: ['!dev', '!autodocs'],
  beforeEach: () => {
    window.matchMedia = (query: string) =>
      query.includes('(hover: hover)')
        ? ({
            media: query,
            matches: false,
            addEventListener: () => {},
            removeEventListener: () => {},
          } as unknown as MediaQueryList)
        : realMatchMedia(query);
    return () => {
      window.matchMedia = realMatchMedia;
    };
  },
  render: () => <HoverShell mode="push" />,
  play: async ({ canvas }) => {
    const nav = mainNav(canvas);
    await userEvent.hover(nav);
    await userEvent.tab();
    await pause(500);
    await expect(navWidth(nav)).toBe(RAIL);
    await expect(canvas.getByRole('main').getBoundingClientRect().left).toBe(RAIL);
  },
};

/**
 * The Shell's drawer is already expanded: the option changes nothing there, and the sidebar
 * stays a panel that fills the drawer, not an overlay of its own.
 */
export const DrawerIgnoresExpandOnHover: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <HoverShell mode="overlay" defaultSidebarOpen />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Navigation menu' });
    await waitFor(() => expect(dialog.getBoundingClientRect().left).toBe(0));
    const nav = within(dialog).getByRole('navigation', { name: 'Main navigation' });
    const width = navWidth(nav);
    // The panel's width, less a pixel.
    await expect(width).toBeGreaterThanOrEqual(dialog.getBoundingClientRect().width - 1);
    await userEvent.hover(nav);
    await pause(500);
    await expect(navWidth(nav)).toBe(width);
    await expect(getComputedStyle(nav).position).not.toBe('absolute');
    await expect(getComputedStyle(nav).boxShadow).toBe('none');
    await expect(within(nav).getByText('Dashboard')).toBeVisible();
  },
};

// ── Compact rail ─────────────────────────────────────────────────────────────

const COMPACT_LONG = 'Infrastructure monitoring';

const CompactNav = () => (
  <div className="py-2">
    <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
    <Sidebar.Item icon={Server} label="Servers" />
    <Sidebar.Item
      icon={Bell}
      label="Notifications"
      badge={<span className="size-2 rounded-full bg-red-500" />}
    />
    <Sidebar.Item icon={Network} label={COMPACT_LONG} />
    <Sidebar.SubMenu icon={Layers} label="Library">
      <Sidebar.Item label="Tokens" />
      <Sidebar.Item label="Components" />
      <Sidebar.Item label="Templates" />
    </Sidebar.SubMenu>
    <Sidebar.Section label="Account">
      <Sidebar.Item icon={Settings} label="Settings" />
    </Sidebar.Section>
  </div>
);

/**
 * `variant="compact"`: an 88 px rail with the label under each icon, on two lines at most (the
 * full name shows in a tooltip when it is cut). A sub-menu opens in a flyout.
 */
export const Compact: Story = {
  render: () => (
    <Wrap>
      <Sidebar variant="compact">
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
        <CompactNav />
      </Sidebar>
      <main className="flex-1 p-6 text-[var(--color-text-secondary)]">
        <p>The compact rail has one width: it has no collapsed state.</p>
      </main>
    </Wrap>
  ),
};

/** In a Shell the rail has no collapse control: the Topbar keeps no hamburger on desktop. */
export const CompactInShell: Story = {
  render: () => (
    <Shell
      collapseControl="sidebar"
      topbar={<Topbar pageTitle="Dashboard" />}
      sidebar={
        <Sidebar variant="compact">
          <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
          <CompactNav />
        </Sidebar>
      }
    >
      <div className="p-6 text-[var(--color-text-secondary)]">Page content</div>
    </Shell>
  ),
};

/** Below `lg` the sidebar is the Shell's drawer, expanded: the compact variant gives way to it. */
export const CompactMobile: Story = {
  ...CompactInShell,
  globals: mobileViewport,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  },
};

export const CompactLabelsWrapAndNeverOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  render: Compact.render,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getBoundingClientRect().width).toBe(88);
    const navBox = nav.getBoundingClientRect();
    for (const label of ['Dashboard', 'Servers', 'Notifications', COMPACT_LONG, 'Library']) {
      const text = within(nav).getByText(label);
      const style = getComputedStyle(text);
      // Centred under the icon, on a button row as on a link row.
      await expect(style.textAlign).toBe('center');
      // Two lines at most, and nothing wider than the box.
      await expect(text.getBoundingClientRect().height).toBeLessThanOrEqual(
        2 * parseFloat(style.lineHeight) + 1
      );
      await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
      const row = text.closest('a, button') as HTMLElement;
      const box = row.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(navBox.left);
      await expect(box.right).toBeLessThanOrEqual(navBox.right);
      await expect(parseFloat(style.fontSize)).toBeLessThan(12);
    }
    // A short label stays on one line; the long one wraps to two.
    const oneLine = within(nav).getByText('Servers').getBoundingClientRect().height;
    await expect(
      within(nav).getByText(COMPACT_LONG).getBoundingClientRect().height
    ).toBeGreaterThan(oneLine * 1.5);
    // Icon above the label.
    const icon = within(nav).getByText('Servers').closest('a, button')!.querySelector('svg')!;
    await expect(icon.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      within(nav).getByText('Servers').getBoundingClientRect().top
    );
    // The collapse controls are not there.
    await expect(canvas.queryByRole('button', { name: /collapse|expand/i })).toBeNull();
  },
};

/** The tooltip carries the full name of a label the clamp cuts, and of no other. */
export const CompactTooltipOnlyWhenCut: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar variant="compact">
        <Sidebar.Item icon={Server} label="Servers" href="#servers" />
        <Sidebar.Item
          icon={Network}
          label="Infrastructure monitoring and capacity planning"
          href="#long"
        />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const long = 'Infrastructure monitoring and capacity planning';
    const tip = (name: string) => body.queryByRole('tooltip', { name, hidden: true });
    const cut = canvas.getByRole('link', { name: long });
    const whole = canvas.getByRole('link', { name: 'Servers' });
    const label = within(cut).getByText(long);
    await expect(label.scrollHeight).toBeGreaterThan(label.clientHeight);
    await expect(tip(long)).not.toBeNull();
    await expect(tip('Servers')).toBeNull();
    await expect(whole).not.toHaveAttribute('aria-describedby');
    await userEvent.hover(cut);
    await waitFor(() => expect(tip(long)).toHaveClass('opacity-100'));
    await userEvent.unhover(cut);
    await waitFor(() => expect(tip(long)).toHaveClass('opacity-0'));
    // Keyboard focus shows it too.
    for (let i = 0; i < 4 && cut !== document.activeElement; i += 1) await userEvent.tab();
    await expect(cut).toHaveFocus();
    await waitFor(() => expect(tip(long)).toHaveClass('opacity-100'));
  },
};

/** A sub-menu of the compact rail opens its tree in a flyout, expanded, and Escape closes it. */
export const CompactSubMenuOpensInAFlyout: Story = {
  tags: ['!dev', '!autodocs'],
  render: Compact.render,
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    const trigger = within(nav).getByRole('button', { name: 'Library' });
    await userEvent.click(trigger);
    const flyout = await body.findByRole('dialog', { name: 'Library' });
    await expect(within(flyout).getByText('Components')).toBeVisible();
    // It opens beside the row, not over it, and the rail keeps its width.
    await expect(flyout.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      trigger.getBoundingClientRect().right
    );
    await expect(nav.getBoundingClientRect().width).toBe(88);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Library' })).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/** The compact rail has no hover expansion and no bottom button, whatever the props say. */
export const CompactIgnoresCollapseProps: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Sidebar
        variant="compact"
        collapsed
        expandOnHover="overlay"
        onCollapsedChange={() => {}}
        width={320}
      >
        <CompactNav />
      </Sidebar>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.hover(nav);
    await pause(400);
    await expect(nav.getBoundingClientRect().width).toBe(88);
    await expect(within(nav).getByText('Dashboard')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /collapse|expand/i })).toBeNull();
  },
};
