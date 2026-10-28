import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Ellipsis } from 'lucide-react';
import { Menu } from '../ui/Menu';
import { useShell } from './shellContext';
import { SidebarToggle } from './SidebarToggle';

export type TopbarProps = {
  /** Current page title (≠ site name — that lives in `Sidebar.Brand`). */
  pageTitle?: ReactNode;
  /**
   * Element of `pageTitle`. Default `p`: plain text, so the page's own heading (a
   * `PageHeader`) is its only `h1`. Pass `h1` when the Topbar carries the page's heading.
   */
  as?: 'h1' | 'p' | 'span';
  /**
   * Outside a `Shell`: whether the sidebar is collapsed. Pass it with `onCollapsedChange`
   * to render the built-in toggle (a `SidebarToggle`). Inside a Shell, leave it out: the
   * toggle shows where the Shell puts its control (`collapseControl="topbar"`, the default)
   * and follows the Shell's state, so a value here is not read. `null` hides the toggle in
   * both cases (e.g. for pages without a sidebar).
   */
  sidebarCollapsed?: boolean | null;
  /**
   * Fired when the built-in toggle is pressed, with the collapsed state the sidebar should
   * take: `!sidebarCollapsed`. Like `Sidebar.onCollapsedChange`. Inside a Shell, it is called
   * after the Shell moves, never instead.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * The product logo (or name), right after the hamburger. Inside a `Shell` it shows only while
   * the sidebar is off screen (below `lg`), where `Sidebar.Brand` isn't visible; outside a Shell
   * it always shows. Keep it compact: it shares the bar with the hamburger and the actions.
   */
  brand?: ReactNode;
  /** Extra slot rendered between the hamburger and the page title. */
  leftActions?: ReactNode;
  /** Center area — typically search, breadcrumb, or empty. */
  center?: ReactNode;
  /** Right-aligned actions — theme switcher, notifications, avatar… */
  rightActions?: ReactNode;
  /**
   * `Menu.Item`s (or `Menu.Group`s) for the actions that do not fit a phone. Below `sm` the
   * Topbar shows a "More" menu with them, before `rightActions`; from `sm` up the menu is gone.
   * Hide the matching actions of `rightActions` below `sm` (`max-sm:hidden`) and keep there only
   * what must stay in reach, such as the profile menu.
   */
  moreActions?: ReactNode;
  /** Optional className override. */
  className?: string;
};

/**
 * Topbar — application header bar.
 *
 * Layout: [toggle] [brand] [leftActions] [pageTitle] [center] [rightActions]
 *
 * The site brand belongs in `<Sidebar.Brand />`; the `brand` prop repeats the logo here while
 * the sidebar is off screen (below `lg` in a Shell). Otherwise the topbar carries only
 * the sidebar collapse button (a `SidebarToggle`, `hamburger` variant), the
 * current page title, and contextual actions. Matches the rackscope/TailAdmin
 * pattern.
 *
 * Height: 72px. Background: `var(--color-bg-panel)` with a 500ms
 * background-color transition (eases the dark/light toggle).
 */
export const Topbar = ({
  pageTitle,
  as: TitleTag = 'p',
  sidebarCollapsed,
  onCollapsedChange,
  brand,
  leftActions,
  center,
  rightActions,
  moreActions,
  className,
}: TopbarProps) => {
  const shell = useShell();
  // Inside a Shell, the toggle follows the Shell's state, so a `sidebarCollapsed` set there
  // can't freeze it; outside, it needs the host's state and handler.
  const showToggle =
    sidebarCollapsed !== null &&
    (shell
      ? // Below `lg` the sidebar has no toggle of its own: the hamburger opens its drawer.
        shell.collapseControl === 'topbar' || shell.isMobile
      : sidebarCollapsed !== undefined && onCollapsedChange !== undefined);

  return (
    <header
      className={clsx(
        'flex h-[72px] items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 text-[var(--color-text-primary)]',
        '[transition:background-color_500ms_ease,border-color_500ms_ease]',
        className
      )}
    >
      {showToggle && (
        <SidebarToggle
          collapsed={shell ? undefined : (sidebarCollapsed ?? undefined)}
          onCollapsedChange={onCollapsedChange}
        />
      )}

      {brand && (!shell || shell.isMobile) && (
        <div className="flex min-w-0 shrink items-center">{brand}</div>
      )}

      {leftActions}

      {pageTitle && (
        // Below `sm` the page shows its own title: the Topbar keeps the width for actions.
        <TitleTag className="hidden truncate text-lg font-semibold text-[var(--color-text-primary)] sm:block">
          {pageTitle}
        </TitleTag>
      )}

      {/* Center: stretches */}
      {center ? <div className="min-w-0 flex-1">{center}</div> : <div className="flex-1" />}

      {/* Right: actions */}
      {(rightActions || moreActions) && (
        <div className="flex shrink-0 items-center gap-2">
          {moreActions && (
            <div className="sm:hidden">
              <Menu align="end">
                <Menu.Trigger
                  aria-label="More actions"
                  className="h-ctrl-40 w-ctrl-40 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Ellipsis className="h-4 w-4" aria-hidden />
                </Menu.Trigger>
                <Menu.Content aria-label="More actions">{moreActions}</Menu.Content>
              </Menu>
            </div>
          )}
          {rightActions}
        </div>
      )}
    </header>
  );
};
