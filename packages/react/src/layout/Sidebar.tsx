import { createContext, useContext, useState, type ComponentType, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { Popover } from '../ui/Popover';

// ─── Internal context ─────────────────────────────────────────────────────────
// Threads the `collapsed` state from <Sidebar> down to all subcomponents
// (Brand / Item / Group / Section / SubMenu) without forcing the consumer to
// pass it manually to each child.
//
// Subcomponents always allow an explicit `collapsed` prop that wins over the
// context — useful for one-off overrides or stories that mount a child in
// isolation.

const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false });

const useSidebarCollapsed = (override?: boolean): boolean => {
  const ctx = useContext(SidebarContext);
  return override ?? ctx.collapsed;
};

// Nesting level: each Sidebar.SubMenu gives its children its own depth + 1, so
// nested items indent without a `depth` prop.
const SidebarDepthContext = createContext(0);

// Left padding of a row at `depth`, and where the guide line of its children
// sits (under the centre of the row's 20 px icon, inside the 8 px row margin).
const rowPadding = (depth: number) => 12 + depth * 20;
const guideLeft = (depth: number) => 8 + rowPadding(depth) + 10;

// ─── Sidebar root ──────────────────────────────────────────────────────────────

export type SidebarProps = {
  /** Whether the sidebar is in collapsed (icons-only) state. */
  collapsed?: boolean;
  /** Width when expanded (px). Default: 264 */
  width?: number;
  /** Width when collapsed (px). Default: 72 */
  collapsedWidth?: number;
  /** Sidebar content — typically Sidebar.Brand / .Item / .SubMenu / .Group / .Section. */
  children: ReactNode;
  /** Footer content (sticks to bottom — e.g. user profile + collapse btn). */
  footer?: ReactNode;
  /**
   * Renders a collapse button at the very bottom, under `footer`, and fires
   * with the next state when it is clicked. Leave it out when the control
   * lives elsewhere (e.g. the Topbar hamburger).
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Optional className override. */
  className?: string;
};

/**
 * Sidebar — left-side navigation panel.
 *
 * Compound component: brand + items + groups + sub-menus + footer slot.
 * Smooth width transition when `collapsed` toggles. The `collapsed` state
 * is automatically threaded to every subcomponent via React context, so
 * children don't need to receive it as a prop.
 */
const SidebarRoot = ({
  collapsed = false,
  width = 264,
  collapsedWidth = 72,
  children,
  footer,
  onCollapsedChange,
  className,
}: SidebarProps) => (
  <SidebarContext.Provider value={{ collapsed }}>
    <nav
      aria-label="Main navigation"
      style={{ width: collapsed ? collapsedWidth : width }}
      className={clsx(
        'flex h-full flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-bg-panel)]',
        'transition-[width] duration-300 ease-in-out',
        className
      )}
    >
      <div className="flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
      {footer && (
        <div className="shrink-0 overflow-hidden border-t border-[var(--color-border)] p-3">
          {footer}
        </div>
      )}
      {onCollapsedChange && (
        <CollapseButton collapsed={collapsed} onClick={() => onCollapsedChange(!collapsed)} />
      )}
    </nav>
  </SidebarContext.Provider>
);

// Bottom row: "Collapse" with its icon, or the expand icon alone when collapsed.
const CollapseButton = ({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) => {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <div className="shrink-0 border-t border-[var(--color-border)] py-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : undefined}
        className={clsx(
          'focus-visible:ring-brand-500 mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 dark:hover:bg-white/5',
          collapsed ? 'justify-center px-2' : 'px-3'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        {!collapsed && <span>Collapse</span>}
      </button>
    </div>
  );
};

// ─── Sidebar.Brand ────────────────────────────────────────────────────────────
// Header row at the top of the sidebar — logo + product name + optional subtitle.
// Animates with the collapse state: in collapsed mode only the logo is visible.

export type SidebarBrandProps = {
  /** Logo node — typically a small icon, lucide component, or img. */
  logo?: ReactNode;
  /** Product / app name. */
  title: string;
  /** Optional smaller subtitle below the title. */
  subtitle?: string;
  /** href to navigate when the brand is clicked. */
  href?: string;
  /** click handler (alternative to href). */
  onClick?: () => void;
  /** Override the inherited collapsed state (defaults to `useContext`). */
  collapsed?: boolean;
};

const SidebarBrand = ({
  logo,
  title,
  subtitle,
  href,
  onClick,
  collapsed: collapsedProp,
}: SidebarBrandProps) => {
  const collapsed = useSidebarCollapsed(collapsedProp);
  const inner = (
    <>
      {logo && (
        <div className="bg-brand-500/10 text-brand-500 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          {logo}
        </div>
      )}
      <div
        className={clsx(
          'min-w-0 overflow-hidden text-left transition-[max-width,opacity] duration-300',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'
        )}
      >
        <p className="truncate text-base font-bold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </p>
        {subtitle && <p className="truncate text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
    </>
  );

  const baseClass =
    'flex h-[72px] shrink-0 items-center gap-3 px-4 border-b border-[var(--color-border)]';

  if (href) {
    return (
      <a href={href} className={baseClass}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={clsx(baseClass, 'w-full text-left')}>
        {inner}
      </button>
    );
  }
  return <div className={baseClass}>{inner}</div>;
};

// ─── Sidebar.Item ─────────────────────────────────────────────────────────────

export type SidebarItemProps = {
  /** Icon component (lucide-react or any React component accepting className). */
  icon: ComponentType<{ className?: string }>;
  /** Item label. */
  label: string;
  /** Whether the item is active (highlighted). */
  active?: boolean;
  /** Link target — renders an `<a>` if set, otherwise a `<button>`. */
  href?: string;
  /** Click handler (if not using href). */
  onClick?: () => void;
  /** Optional badge (count, "new"…) shown right of label. Hidden when collapsed. */
  badge?: ReactNode;
  /** Override the inherited collapsed state. */
  collapsed?: boolean;
  /**
   * Indentation depth. Defaults to the nesting level: 0 at the top, one more
   * inside each Sidebar.SubMenu.
   */
  depth?: number;
};

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  href,
  onClick,
  badge,
  collapsed: collapsedProp,
  depth: depthProp,
}: SidebarItemProps) => {
  const collapsed = useSidebarCollapsed(collapsedProp);
  const contextDepth = useContext(SidebarDepthContext);
  const depth = depthProp ?? contextDepth;
  const baseClass = clsx(
    'group mx-2 flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors',
    collapsed ? 'justify-center px-2' : 'px-3',
    active
      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
      : 'text-[var(--color-text-secondary)] hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/5'
  );
  const style = !collapsed && depth > 0 ? { paddingLeft: rowPadding(depth) } : undefined;

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        title={collapsed ? label : undefined}
        className={baseClass}
        style={style}
        aria-current={active ? 'page' : undefined}
        data-sidebar-item=""
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={clsx(baseClass, 'w-[calc(100%-1rem)] text-left')}
      style={style}
      aria-current={active ? 'page' : undefined}
      data-sidebar-item=""
    >
      {content}
    </button>
  );
};

// ─── Sidebar.SubMenu ──────────────────────────────────────────────────────────
// Expandable menu — clicking the trigger toggles a list of nested items. Sub-
// menus nest (up to three levels reads well): each level indents its rows and
// draws a guide line under them. In collapsed mode the trigger is icon-only and
// opens the whole tree in a panel to its right.

export type SidebarSubMenuProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** Initial open state. */
  defaultOpen?: boolean;
  /** Override the inherited collapsed state. */
  collapsed?: boolean;
  /** Whether any child item is active. */
  active?: boolean;
  /** Optional badge shown right of label (hidden when collapsed). */
  badge?: ReactNode;
  /** Nested items: Sidebar.Item, or another Sidebar.SubMenu for a deeper level. */
  children: ReactNode;
};

const SUBMENU_ROW = (active: boolean) =>
  clsx(
    'group mx-2 flex w-[calc(100%-1rem)] items-center rounded-lg py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
      : 'text-[var(--color-text-secondary)] hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/5'
  );

const SidebarSubMenu = ({
  icon: Icon,
  label,
  defaultOpen = false,
  collapsed: collapsedProp,
  active = false,
  badge,
  children,
}: SidebarSubMenuProps) => {
  const collapsed = useSidebarCollapsed(collapsedProp);
  const depth = useContext(SidebarDepthContext);
  const [open, setOpen] = useState(defaultOpen || active);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  // Collapsed mode: an icon-only trigger opening the tree in a panel to its
  // right, rendered expanded and from the top level. Picking an item closes it.
  if (collapsed) {
    return (
      <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
        <Popover.Trigger
          title={label}
          aria-label={label}
          className={clsx(SUBMENU_ROW(active), 'justify-center px-2')}
        >
          <Icon className="h-5 w-5 shrink-0" />
        </Popover.Trigger>
        <Popover.Content position="right" aria-label={label} width="w-64" className="p-2!">
          <SidebarContext.Provider value={{ collapsed: false }}>
            <SidebarDepthContext.Provider value={0}>
              <p className="px-3 pt-1 pb-2 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                {label}
              </p>
              <div
                className="-mx-2 space-y-0.5"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[data-sidebar-item]'))
                    setFlyoutOpen(false);
                }}
              >
                {children}
              </div>
            </SidebarDepthContext.Provider>
          </SidebarContext.Provider>
        </Popover.Content>
      </Popover>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx(SUBMENU_ROW(active), 'gap-3 px-3 text-left')}
        style={depth > 0 ? { paddingLeft: rowPadding(depth) } : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {badge && <span className="shrink-0">{badge}</span>}
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="relative mt-0.5 space-y-0.5">
          <span
            aria-hidden
            className="absolute top-0 bottom-0 w-px bg-[var(--color-border)]"
            style={{ left: guideLeft(depth) }}
          />
          <SidebarDepthContext.Provider value={depth + 1}>{children}</SidebarDepthContext.Provider>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar.Group ────────────────────────────────────────────────────────────
// Collapsible labelled group — header with chevron + items list. In collapsed
// mode, the header is hidden and children render flat.

export type SidebarGroupProps = {
  label: string;
  defaultOpen?: boolean;
  collapsed?: boolean;
  children: ReactNode;
};

const SidebarGroup = ({
  label,
  defaultOpen = true,
  collapsed: collapsedProp,
  children,
}: SidebarGroupProps) => {
  const collapsed = useSidebarCollapsed(collapsedProp);
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return <div className="my-1">{children}</div>;
  }

  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mx-2 flex w-[calc(100%-1rem)] items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase hover:text-[var(--color-text-secondary)]"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
};

// ─── Sidebar.Section ──────────────────────────────────────────────────────────
// Visual separator + optional non-collapsible label. Label hides automatically
// when the sidebar is collapsed.

export type SidebarSectionProps = {
  label?: string;
  collapsed?: boolean;
  children: ReactNode;
};

const SidebarSection = ({ label, collapsed: collapsedProp, children }: SidebarSectionProps) => {
  const collapsed = useSidebarCollapsed(collapsedProp);
  return (
    <div className="my-2 border-t border-[var(--color-border)] pt-2">
      {label && !collapsed && (
        <p className="px-5 py-1.5 text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
          {label}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};

// ─── Compound exports ─────────────────────────────────────────────────────────

type SidebarComponent = typeof SidebarRoot & {
  Brand: typeof SidebarBrand;
  Item: typeof SidebarItem;
  Group: typeof SidebarGroup;
  Section: typeof SidebarSection;
  SubMenu: typeof SidebarSubMenu;
};

export const Sidebar = SidebarRoot as SidebarComponent;
Sidebar.Brand = SidebarBrand;
Sidebar.Item = SidebarItem;
Sidebar.Group = SidebarGroup;
Sidebar.Section = SidebarSection;
Sidebar.SubMenu = SidebarSubMenu;
