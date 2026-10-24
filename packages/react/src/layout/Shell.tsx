import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { useControllableState } from '../hooks/useControllableState';
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
  /** Fired when the user collapses or expands the sidebar, with the new collapsed state. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Where the collapse control lives. `topbar` (default): the Topbar's
   * hamburger. `sidebar`: a button at the bottom of the Sidebar, and the
   * Topbar shows no hamburger.
   */
  collapseControl?: 'topbar' | 'sidebar';
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
 * and inject `sidebarCollapsed` + `onCollapsedChange` / `collapsed` props.
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
  onCollapsedChange,
  collapseControl = 'topbar',
  className,
}: ShellProps) => {
  // The Topbar hamburger and the Sidebar button both pass the state to move to.
  const [collapsed, handleCollapsedChange] = useControllableState({
    value: controlledCollapsed,
    defaultValue: defaultSidebarCollapsed,
    onChange: onCollapsedChange,
    name: 'Shell.sidebarCollapsed',
  });

  // Inject collapsed state into the children — keep the consumer-supplied
  // props as overrides so a story can opt out (e.g. `sidebarCollapsed={null}`
  // on the Topbar to hide the hamburger).
  const inSidebar = collapseControl === 'sidebar';
  const enhancedTopbar =
    topbar && sidebar
      ? cloneElement(
          topbar,
          inSidebar
            ? // The control moved to the sidebar: no hamburger unless asked for.
              { sidebarCollapsed: topbar.props.sidebarCollapsed ?? null }
            : {
                sidebarCollapsed: topbar.props.sidebarCollapsed ?? collapsed,
                onCollapsedChange: topbar.props.onCollapsedChange ?? handleCollapsedChange,
              }
        )
      : topbar;

  const enhancedSidebar = sidebar
    ? cloneElement(sidebar, {
        collapsed: sidebar.props.collapsed ?? collapsed,
        ...(inSidebar && {
          onCollapsedChange: sidebar.props.onCollapsedChange ?? handleCollapsedChange,
        }),
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
                secondaryWidthClassName
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
