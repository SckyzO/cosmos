import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export type TopbarProps = {
  /** Brand logo or icon (left edge) */
  logo?: ReactNode;
  /** Main title (next to logo) */
  title?: string;
  /** Subtitle below title (small caps recommended) */
  subtitle?: string;
  /** Center area — typically search, breadcrumb, or empty */
  center?: ReactNode;
  /** Right-aligned actions (theme switcher, avatar, ...) */
  rightActions?: ReactNode;
  /** Optional className override */
  className?: string;
};

/**
 * Topbar — application header bar.
 *
 * Three slot zones: left (logo + title + subtitle), center (search/breadcrumb),
 * right (actions). Brand colors come from CSS variables, fonts inherit Cosmos.
 *
 * Height: fixed at h-16 (64px). Increase via className if needed.
 */
export const Topbar = ({ logo, title, subtitle, center, rightActions, className }: TopbarProps) => (
  <div
    className={clsx(
      'flex h-16 items-center gap-4 px-6',
      'text-[var(--color-text-primary)]',
      className,
    )}
  >
    {/* Left zone: logo + title block */}
    <div className="flex shrink-0 items-center gap-3">
      {logo && (
        <span className="text-brand-500 flex h-9 w-9 items-center justify-center">{logo}</span>
      )}
      {(title || subtitle) && (
        <div className="flex flex-col leading-tight">
          {title && (
            <span className="text-base font-bold tracking-tight">
              {title}
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>

    {/* Center zone: stretches between left and right */}
    {center && <div className="min-w-0 flex-1">{center}</div>}
    {!center && <div className="flex-1" />}

    {/* Right zone: actions */}
    {rightActions && <div className="flex shrink-0 items-center gap-2">{rightActions}</div>}
  </div>
);
