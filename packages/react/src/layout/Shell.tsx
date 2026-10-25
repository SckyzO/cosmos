import { useId, useMemo, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { useControllableState } from '../hooks/useControllableState';
import { ShellContext } from './shellContext';

export type ShellProps = {
  /**
   * Top header bar: typically `<Topbar />`, or any header (a `<Navbar>`). Shell
   * passes it no props: a Topbar or a `SidebarToggle` reads the sidebar state
   * from Shell's context.
   */
  topbar?: ReactNode;
  /** Left sidebar: typically `<Sidebar />`, which reads its collapsed state from Shell's context. */
  sidebar?: ReactNode;
  /** Main content area. */
  children: ReactNode;
  /**
   * Optional right-aligned secondary panel — mirrors the TUI Plus "Multi-
   * column" application shell pattern (sidebar + main + secondary). Renders
   * after `children` inside a flex row below the topbar; below `lg` it stacks under `children`.
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
  /**
   * Fired when the user collapses or expands the sidebar, from any toggle in the
   * Shell, with the new collapsed state.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Where the built-in collapse control lives. `topbar` (default): the Topbar's
   * hamburger. `sidebar`: a button at the bottom of the Sidebar, and the
   * Topbar shows no hamburger. For both, or another place, put a
   * `<SidebarToggle />` there (a Topbar's `leftActions`, the Sidebar's
   * `footer`, a custom header): it needs no props in a Shell.
   */
  collapseControl?: 'topbar' | 'sidebar';
  /** Optional className override on the root element. */
  className?: string;
};

/**
 * Shell — application root layout.
 *
 * Owns the sidebar collapsed state and shares it through a context with
 * everything inside: the `Sidebar` (width animation + brand), the `Topbar`
 * (built-in hamburger) and any `SidebarToggle`, wherever it sits. Pass
 * `sidebarCollapsed` to make this controlled, otherwise Shell manages it
 * internally. Composition is automatic, you only need to write
 *
 *     <Shell topbar={<Topbar pageTitle="…" />} sidebar={<Sidebar>…</Sidebar>}>
 *       …
 *     </Shell>
 *
 * The Shell's state is the only one inside it: the Topbar's
 * `sidebarCollapsed` and the Sidebar's `collapsed` are not read there, so a
 * value left on them can't freeze a toggle. Their `onCollapsedChange` still
 * fires when their own button is pressed.
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
  // Every SidebarToggle passes the state to move to.
  const [collapsed, setCollapsed] = useControllableState({
    value: controlledCollapsed,
    defaultValue: defaultSidebarCollapsed,
    onChange: onCollapsedChange,
    name: 'Shell.sidebarCollapsed',
  });
  const navId = useId();
  // Read by the Topbar, the Sidebar and every SidebarToggle in the Shell. Without a
  // sidebar there is nothing to collapse: no context, so a toggle without props shows nothing.
  const shell = useMemo(
    () => ({ collapsed, setCollapsed, navId, collapseControl }),
    [collapsed, setCollapsed, navId, collapseControl]
  );

  return (
    <ShellContext.Provider value={sidebar ? shell : null}>
      <div
        className={clsx(
          'flex h-screen w-screen overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-base)]',
          className
        )}
      >
        {sidebar && <aside className="shrink-0">{sidebar}</aside>}
        <div className="flex min-w-0 flex-1 flex-col">
          {topbar && <div className="shrink-0">{topbar}</div>}
          {/* Below `lg` the secondary panel stacks under main, and the two scroll together. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-auto lg:flex-row lg:overflow-visible">
            <main className="min-w-0 flex-1 lg:overflow-auto">{children}</main>
            {secondary && (
              <aside
                className={clsx(
                  'shrink-0 border-t border-[var(--color-border)] lg:overflow-auto lg:border-t-0 lg:border-l',
                  // `max-lg:` sorts after the plain width utility: full width while stacked.
                  secondaryWidthClassName,
                  'max-lg:w-full'
                )}
              >
                {secondary}
              </aside>
            )}
          </div>
        </div>
      </div>
    </ShellContext.Provider>
  );
};
