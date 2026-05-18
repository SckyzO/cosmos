import { cloneElement, useState, type ReactElement, type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { TopbarProps } from './Topbar';
import type { SidebarProps } from './Sidebar';

export type ShellProps = {
  /** Top header bar — typically `<Topbar />`. */
  topbar?: ReactElement<TopbarProps>;
  /** Left sidebar — typically `<Sidebar />`. */
  sidebar?: ReactElement<SidebarProps>;
  /** Main content area. */
  children: ReactNode;
  /**
   * Optional right-aligned secondary panel — mirrors the TUI Plus "Multi-
   * column" application shell pattern (sidebar + main + secondary). Renders
   * after `children` inside a flex row below the topbar.
   */
  secondary?: ReactNode;
  /** Width class for the secondary panel. Default `w-80` (320px). */
  secondaryWidthClassName?: string;
  /** Initial collapsed state of the sidebar. Default: `false`. */
  defaultSidebarCollapsed?: boolean;
  /**
   * If you control the collapsed state externally (e.g. from a router or a
   * playlist context), pass it here. When set, Shell becomes a controlled
   * component and `defaultSidebarCollapsed` is ignored.
   */
  sidebarCollapsed?: boolean;
  /** Fired whenever the collapsed state toggles. */
  onSidebarToggle?: (collapsed: boolean) => void;
  /** Optional className override on the root element. */
  className?: string;
};

/**
 * Shell — application root layout.
 *
 * Owns the sidebar collapsed state and threads it down to both the
 * `Topbar` (built-in hamburger button) and the `Sidebar` (width animation
 * + brand). Pass `sidebarCollapsed` to make this controlled, otherwise
 * Shell manages it internally.
 *
 * Composition is automatic: clone the topbar/sidebar elements you pass in
 * and inject `sidebarCollapsed` + `onToggleSidebar` / `collapsed` props.
 * You only need to write
 *
 *     <Shell topbar={<Topbar pageTitle="…" />} sidebar={<Sidebar>…</Sidebar>}>
 *       …
 *     </Shell>
 */
export const Shell = ({
  topbar,
  sidebar,
  children,
  secondary,
  secondaryWidthClassName = 'w-80',
  defaultSidebarCollapsed = false,
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle,
  className,
}: ShellProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultSidebarCollapsed);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggle = () => {
    const next = !collapsed;
    if (controlledCollapsed === undefined) setInternalCollapsed(next);
    onSidebarToggle?.(next);
  };

  // Inject collapsed state into the children — keep the consumer-supplied
  // props as overrides so a story can opt out (e.g. `sidebarCollapsed={null}`
  // on the Topbar to hide the hamburger).
  const enhancedTopbar =
    topbar && sidebar
      ? cloneElement(topbar, {
          sidebarCollapsed: topbar.props.sidebarCollapsed ?? collapsed,
          onToggleSidebar: topbar.props.onToggleSidebar ?? handleToggle,
        })
      : topbar;

  const enhancedSidebar = sidebar
    ? cloneElement(sidebar, {
        collapsed: sidebar.props.collapsed ?? collapsed,
      })
    : sidebar;

  return (
    <div
      className={clsx(
        'flex h-screen w-screen overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-base)]',
        className
      )}
    >
      {enhancedSidebar && <aside className="shrink-0">{enhancedSidebar}</aside>}
      <div className="flex min-w-0 flex-1 flex-col">
        {enhancedTopbar && <div className="shrink-0">{enhancedTopbar}</div>}
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto">{children}</main>
          {secondary && (
            <aside
              className={clsx(
                'shrink-0 overflow-auto border-l border-[var(--color-border)]',
                secondaryWidthClassName,
              )}
            >
              {secondary}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
