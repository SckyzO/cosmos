import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export type TopbarProps = {
  /** Current page title (≠ site name — that lives in `Sidebar.Brand`). */
  pageTitle?: ReactNode;
  /**
   * Whether the sidebar is currently collapsed. Pass alongside `onToggleSidebar`
   * to render a built-in hamburger button. Pass `null` to hide the button
   * entirely (e.g. for pages without a sidebar).
   */
  sidebarCollapsed?: boolean | null;
  /** Callback fired when the built-in hamburger is clicked. */
  onToggleSidebar?: () => void;
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
 * Layout: [hamburger] [leftActions] [pageTitle] [center] [rightActions]
 *
 * The site brand belongs in `<Sidebar.Brand />` — the topbar carries only
 * the sidebar collapse button, the current page title, and contextual
 * actions. Matches the rackscope/TailAdmin pattern.
 *
 * Height: 72px. Background: `var(--color-bg-panel)` with a 500ms
 * background-color transition (eases the dark/light toggle).
 */
export const Topbar = ({
  pageTitle,
  sidebarCollapsed = null,
  onToggleSidebar,
  leftActions,
  center,
  rightActions,
  className,
}: TopbarProps) => (
  <header
    className={clsx(
      'flex h-[72px] items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 text-[var(--color-text-primary)]',
      '[transition:background-color_500ms_ease,border-color_500ms_ease]',
      className
    )}
  >
    {/* Built-in sidebar collapse/expand button — hidden if sidebarCollapsed is null. */}
    {sidebarCollapsed !== null && onToggleSidebar && (
      <button
        type="button"
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        {/* TailAdmin asymmetric hamburger — distinctive 3-line glyph */}
        <svg
          className="fill-current"
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
          />
        </svg>
      </button>
    )}

    {leftActions}

    {pageTitle && (
      <h1 className="truncate text-lg font-semibold text-[var(--color-text-primary)]">
        {pageTitle}
      </h1>
    )}

    {/* Center: stretches */}
    {center ? <div className="min-w-0 flex-1">{center}</div> : <div className="flex-1" />}

    {/* Right: actions */}
    {rightActions && <div className="flex shrink-0 items-center gap-2">{rightActions}</div>}
  </header>
);
