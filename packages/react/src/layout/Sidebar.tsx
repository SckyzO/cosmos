import { useState, type ComponentType, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Sidebar root ──────────────────────────────────────────────────────────────

export type SidebarProps = {
  /** Whether the sidebar is in collapsed (icons-only) state */
  collapsed?: boolean;
  /** Width when expanded (px). Default: 264 */
  width?: number;
  /** Width when collapsed (px). Default: 64 */
  collapsedWidth?: number;
  /** Sidebar content — typically Sidebar.Item / Sidebar.Group / Sidebar.Section */
  children: ReactNode;
  /** Footer content (sticks to bottom — e.g. user profile) */
  footer?: ReactNode;
  /** Optional className override */
  className?: string;
};

/**
 * Sidebar — left-side navigation panel.
 *
 * Slot-based: accepts any children, but Sidebar.Item / Sidebar.Group /
 * Sidebar.Section / Sidebar.Footer give a consistent look.
 *
 * Smooth width transition when collapsed prop toggles.
 * Height fills the parent (use inside Shell which constrains to h-screen).
 */
const SidebarRoot = ({
  collapsed = false,
  width = 264,
  collapsedWidth = 64,
  children,
  footer,
  className,
}: SidebarProps) => (
  <nav
    aria-label="Main navigation"
    style={{ width: collapsed ? collapsedWidth : width }}
    className={clsx(
      'flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-panel)]',
      'transition-[width] duration-300 ease-in-out',
      className,
    )}
  >
    <div className="flex-1 overflow-y-auto py-3">{children}</div>
    {footer && (
      <div className="shrink-0 border-t border-[var(--color-border)] p-3">{footer}</div>
    )}
  </nav>
);

// ─── Sidebar.Item ─────────────────────────────────────────────────────────────

export type SidebarItemProps = {
  /** Icon component (lucide-react or any React component accepting className) */
  icon: ComponentType<{ className?: string }>;
  /** Item label */
  label: string;
  /** Whether the item is active (highlighted) */
  active?: boolean;
  /** Link target — renders an <a> if set, otherwise a <button> */
  href?: string;
  /** Click handler (if not using href) */
  onClick?: () => void;
  /** Optional badge (count, "new", etc.) shown right of label */
  badge?: ReactNode;
  /** Whether the parent sidebar is collapsed (passed automatically by parent if used inside Sidebar) */
  collapsed?: boolean;
  /** Indentation depth (for nested items inside groups). Default: 0 */
  depth?: number;
};

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  href,
  onClick,
  badge,
  collapsed = false,
  depth = 0,
}: SidebarItemProps) => {
  const baseClass = clsx(
    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    'mx-2',
    active
      ? 'bg-brand-500/10 text-brand-500'
      : 'text-[var(--color-text-secondary)] hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/5',
  );
  const style = depth > 0 ? { paddingLeft: 12 + depth * 20 } : undefined;

  const content = (
    <>
      <Icon className={clsx('h-5 w-5 shrink-0', active && 'text-brand-500')} />
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
      <a href={href} className={baseClass} style={style} aria-current={active ? 'page' : undefined}>
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(baseClass, 'w-[calc(100%-1rem)] text-left')}
      style={style}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </button>
  );
};

// ─── Sidebar.Group ────────────────────────────────────────────────────────────

export type SidebarGroupProps = {
  /** Group header label */
  label: string;
  /** Initial open/closed state */
  defaultOpen?: boolean;
  /** Whether parent sidebar is collapsed */
  collapsed?: boolean;
  /** Group items (typically Sidebar.Item) */
  children: ReactNode;
};

const SidebarGroup = ({ label, defaultOpen = true, collapsed = false, children }: SidebarGroupProps) => {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    // In collapsed mode, just render items inline (no group header).
    return <div className="my-1">{children}</div>;
  }

  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-[calc(100%-1rem)] items-center gap-2 px-3 py-1.5 mx-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
};

// ─── Sidebar.Section ──────────────────────────────────────────────────────────
// Visual separator + optional label, no collapse logic (always visible).

export type SidebarSectionProps = {
  label?: string;
  children: ReactNode;
};

const SidebarSection = ({ label, children }: SidebarSectionProps) => (
  <div className="my-2 border-t border-[var(--color-border)] pt-2">
    {label && (
      <p className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

// ─── Compound exports ─────────────────────────────────────────────────────────

type SidebarComponent = typeof SidebarRoot & {
  Item: typeof SidebarItem;
  Group: typeof SidebarGroup;
  Section: typeof SidebarSection;
};

export const Sidebar = SidebarRoot as SidebarComponent;
Sidebar.Item = SidebarItem;
Sidebar.Group = SidebarGroup;
Sidebar.Section = SidebarSection;
