import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export type PageCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * PageCard — full-page outer card.
 *
 * Replaces multiple SectionCards stacked: a single rounded-2xl bordered card
 * that wraps ALL page content. Use for settings, profiles, forms — anything
 * that's hard to read full-width.
 *
 * Combine with `<ContentNarrow>` inside for a centered constrained column.
 */
export const PageCard = ({ children, className }: PageCardProps) => (
  <div
    className={clsx(
      'min-h-[60vh] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-5 py-8 xl:px-10 xl:py-12',
      className
    )}
  >
    {children}
  </div>
);
