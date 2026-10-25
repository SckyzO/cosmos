import { type ReactNode } from 'react';
import { clsx } from 'clsx';
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
  /** Extra slot rendered between the hamburger and the page title. */
  leftActions?: ReactNode;
  /** Center area — typically search, breadcrumb, or empty. */
  center?: ReactNode;
  /** Right-aligned actions — theme switcher, notifications, avatar… */
  rightActions?: ReactNode;
  /** Optional className override. */
  className?: string;
};

/**
 * Topbar — application header bar.
 *
 * Layout: [toggle] [leftActions] [pageTitle] [center] [rightActions]
 *
 * The site brand belongs in `<Sidebar.Brand />` — the topbar carries only
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
  leftActions,
  center,
  rightActions,
  className,
}: TopbarProps) => {
  const shell = useShell();
  // Inside a Shell, the toggle follows the Shell's state, so a `sidebarCollapsed` set there
  // can't freeze it; outside, it needs the host's state and handler.
  const showToggle =
    sidebarCollapsed !== null &&
    (shell
      ? shell.collapseControl === 'topbar'
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

      {leftActions}

      {pageTitle && (
        <TitleTag className="truncate text-lg font-semibold text-[var(--color-text-primary)]">
          {pageTitle}
        </TitleTag>
      )}

      {/* Center: stretches */}
      {center ? <div className="min-w-0 flex-1">{center}</div> : <div className="flex-1" />}

      {/* Right: actions */}
      {rightActions && <div className="flex shrink-0 items-center gap-2">{rightActions}</div>}
    </header>
  );
};
