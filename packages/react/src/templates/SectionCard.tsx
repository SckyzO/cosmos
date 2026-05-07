import { type ComponentType, type ReactNode } from 'react';
import { clsx } from 'clsx';

export type SectionCardProps = {
  /** Section title (h3) */
  title: string;
  /** Optional description shown below title */
  desc?: string;
  /** Optional icon component (lucide-react or any React component accepting className) */
  icon?: ComponentType<{ className?: string }>;
  /** Tailwind class string for the icon color (default: muted) */
  iconColor?: string;
  /** Tailwind class string for the icon background container */
  iconBg?: string;
  /** Card content */
  children?: ReactNode;
  className?: string;
};

/**
 * SectionCard — white card with title, optional icon and description, and children.
 *
 * The de-facto building block for grouped content in a page. Use multiple
 * SectionCards stacked vertically (with `space-y-6`) or in a grid.
 */
export const SectionCard = ({
  title,
  desc,
  icon: Icon,
  iconColor = 'text-[var(--color-text-muted)]',
  iconBg = 'bg-black/5 dark:bg-white/5',
  children,
  className,
}: SectionCardProps) => (
  <div
    className={clsx(
      'rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6',
      className
    )}
  >
    <div className="mb-5 flex items-center gap-3">
      {Icon && (
        <div
          className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconBg)}
        >
          <Icon className={clsx('h-5 w-5', iconColor)} />
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{desc}</p>}
      </div>
    </div>
    {children}
  </div>
);
