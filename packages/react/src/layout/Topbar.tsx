import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export type TopbarProps = {
  /**
   * Left-edge slot — typically the sidebar collapse/expand button.
   * Place a button (e.g. hamburger icon) here that calls your sidebar
   * toggle handler. The site brand belongs in `<Sidebar.Brand />`, not here.
   */
  leftActions?: ReactNode;
  /** Current page title (≠ site name — that lives in Sidebar.Brand). */
  pageTitle?: ReactNode;
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
 * Layout: [leftActions] [pageTitle] [center] [rightActions]
 *
 * Height: 72px. The site brand belongs in `<Sidebar.Brand />` rather than the
 * topbar, matching the rackscope/TailAdmin pattern (collapse button + page
 * title on the left, never the product name).
 */
export const Topbar = ({
  leftActions,
  pageTitle,
  center,
  rightActions,
  className,
}: TopbarProps) => (
  <header
    className={clsx(
      'flex h-[72px] items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 text-[var(--color-text-primary)]',
      className
    )}
  >
    {/* Left: collapse btn + page title */}
    <div className="flex min-w-0 shrink-0 items-center gap-3">
      {leftActions}
      {pageTitle && (
        <h1 className="truncate text-lg font-semibold text-[var(--color-text-primary)]">
          {pageTitle}
        </h1>
      )}
    </div>

    {/* Center: stretches */}
    {center ? <div className="min-w-0 flex-1">{center}</div> : <div className="flex-1" />}

    {/* Right: actions */}
    {rightActions && <div className="flex shrink-0 items-center gap-2">{rightActions}</div>}
  </header>
);
