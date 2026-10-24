import { useId, useMemo, type ReactElement, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { useControllableState } from '../hooks/useControllableState';
import { ShellContext } from './shellContext';
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
    </ShellContext.Provider>
  );
};
