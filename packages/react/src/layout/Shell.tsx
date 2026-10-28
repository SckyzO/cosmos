import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Drawer } from '../ui/Drawer';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useControllableState } from '../hooks/useControllableState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ShellContext } from './shellContext';

/**
 * How the Shell spans the window: `fluid` (the whole width) or `boxed` (a column of at most
 * 1440px, centred).
 */
export type ShellContainer = 'fluid' | 'boxed';

export type ShellProps = {
  /**
   * `fluid` (default): the topbar, the sidebar and the content take the whole window.
   * `boxed`: they sit together in a centred column of at most 1440px, with the page background
   * on both sides and a hairline on the column's edges once the window is wider. Below 1440px
   * the two are the same. The sidebar's drawer, below `lg`, is not part of the column.
   */
  container?: ShellContainer;
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
   * `<SidebarToggle />` there (a Topbar's `startActions`, the Sidebar's
   * `footer`, a custom header): it needs no props in a Shell.
   */
  collapseControl?: 'topbar' | 'sidebar';
  /** Initial open state of the sidebar drawer, below `lg`. Default: `false`. */
  defaultSidebarOpen?: boolean;
  /**
   * Whether the sidebar drawer is open, when you control it. Below `lg` the sidebar is off
   * screen and opens as a drawer; the collapsed state does not apply there, and this state does
   * not apply from `lg` up. When set, `defaultSidebarOpen` is ignored.
   */
  sidebarOpen?: boolean;
  /**
   * Fired when the sidebar drawer opens or closes (a toggle, the scrim, the close button, Escape,
   * a click on a `Sidebar.Item`, or the viewport growing past `lg`), with the new open state.
   */
  onSidebarOpenChange?: (open: boolean) => void;
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
 * The Shell owns two sidebar states: collapsed from `lg` up (the rail) and open below `lg`,
 * where the sidebar leaves the layout and the toggle opens it as a 288px drawer over a scrim
 * (`sidebarOpen`). It closes on the scrim, the close button, Escape, a swipe toward the left
 * edge, a click on a `Sidebar.Item` and when the viewport grows past `lg`.
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
  container = 'fluid',
  defaultSidebarOpen = false,
  sidebarOpen: controlledOpen,
  onSidebarOpenChange,
  className,
}: ShellProps) => {
  // Every SidebarToggle passes the state to move to.
  const [collapsed, setCollapsed] = useControllableState({
    value: controlledCollapsed,
    defaultValue: defaultSidebarCollapsed,
    onChange: onCollapsedChange,
    name: 'Shell.sidebarCollapsed',
  });
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultSidebarOpen,
    onChange: onSidebarOpenChange,
    name: 'Shell.sidebarOpen',
  });
  // The desktop layout is the server's, so the markup most visitors get does not change.
  const isMobile = !useMediaQuery('(min-width: 64rem)', true);
  const drawerOpen = isMobile && open;
  useBodyScrollLock(drawerOpen);
  // Growing past `lg` closes the drawer: its state would otherwise be open again on the way back.
  const wasMobile = useRef(isMobile);
  useEffect(() => {
    if (wasMobile.current && !isMobile && open) setOpen(false);
    wasMobile.current = isMobile;
  }, [isMobile, open, setOpen]);
  const navId = useId();
  // Read by the Topbar, the Sidebar and every SidebarToggle in the Shell. Without a
  // sidebar there is nothing to collapse: no context, so a toggle without props shows nothing.
  const shell = useMemo(
    () => ({ collapsed, setCollapsed, isMobile, open, setOpen, navId, collapseControl }),
    [collapsed, setCollapsed, isMobile, open, setOpen, navId, collapseControl]
  );

  const layout = (
    <>
      {sidebar &&
        (isMobile ? (
          // Off screen until opened. The Drawer brings the portal, scrim, focus trap, Escape
          // and the slide; the Sidebar fills its 288px panel, always expanded.
          <Drawer
            open={drawerOpen}
            onClose={() => setOpen(false)}
            side="start"
            size="sm"
            swipeToClose
            ariaLabel="Navigation menu"
          >
            {sidebar}
          </Drawer>
        ) : (
          <aside className="shrink-0">{sidebar}</aside>
        ))}
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
    </>
  );

  return (
    <ShellContext.Provider value={sidebar ? shell : null}>
      <div
        className={clsx(
          'flex h-screen w-screen overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-base)]',
          container === 'boxed' && 'justify-center',
          className
        )}
      >
        {container === 'boxed' ? (
          // The column's hairlines only show where the page background does: the window is
          // wider than the column.
          <div className="flex h-full w-full max-w-[1440px] min-w-0 border-[var(--color-border)] min-[1441px]:border-x">
            {layout}
          </div>
        ) : (
          layout
        )}
      </div>
    </ShellContext.Provider>
  );
};
