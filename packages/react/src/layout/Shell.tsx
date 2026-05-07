import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export type ShellProps = {
  /** Top header bar (full width) */
  topbar?: ReactNode;
  /** Left sidebar (collapses optional) */
  sidebar?: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Optional className override on the root element */
  className?: string;
};

/**
 * Shell — application root layout.
 *
 * Grid : sidebar (left) + topbar (top) + main content (fills remainder).
 * Slot-based : pass any topbar / sidebar React node. No assumption about
 * routing, theming, or domain.
 *
 * Sticky topbar, scrollable main, sidebar handles its own collapse state.
 */
export const Shell = ({ topbar, sidebar, children, className }: ShellProps) => (
  <div
    className={clsx(
      'flex h-screen w-screen overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-base)]',
      className
    )}
  >
    {sidebar && <aside className="shrink-0">{sidebar}</aside>}
    <div className="flex min-w-0 flex-1 flex-col">
      {topbar && (
        <header className="sticky top-0 z-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)]">
          {topbar}
        </header>
      )}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  </div>
);
