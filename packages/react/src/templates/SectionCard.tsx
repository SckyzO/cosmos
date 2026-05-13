import { type ComponentType, type ReactNode } from 'react';
import { clsx } from 'clsx';

export type SectionCardIconTone =
  | 'brand'
  | 'blue'
  | 'violet'
  | 'green'
  | 'amber'
  | 'red'
  | 'gray';

const TONE_CLASSES: Record<SectionCardIconTone, { color: string; bg: string }> = {
  brand: {
    color: 'text-brand-600 dark:text-brand-400',
    bg: 'bg-brand-500/10 dark:bg-brand-500/15',
  },
  blue: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
  },
  violet: {
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
  },
  green: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
  },
  amber: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
  },
  red: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
  },
  gray: {
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-500/10 dark:bg-gray-500/15',
  },
};

export type SectionCardProps = {
  /** Section title (h3) */
  title: string;
  /** Optional description shown below title */
  desc?: string;
  /** Optional icon component (lucide-react or any React component accepting className) */
  icon?: ComponentType<{ className?: string }>;
  /** Preset color theme for the icon (sets text + bg in one shot). */
  iconTone?: SectionCardIconTone;
  /** Tailwind text-* class for the icon. Overridden by `iconTone` when both are set. */
  iconColor?: string;
  /** Tailwind bg-* class for the icon container. Overridden by `iconTone` when both are set. */
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
  iconTone,
  iconColor,
  iconBg,
  children,
  className,
}: SectionCardProps) => {
  const tonePreset = iconTone ? TONE_CLASSES[iconTone] : null;
  const finalIconColor = tonePreset?.color ?? iconColor ?? 'text-[var(--color-text-muted)]';
  const finalIconBg = tonePreset?.bg ?? iconBg ?? 'bg-black/5 dark:bg-white/5';
  return (
    <div
      className={clsx(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        {Icon && (
          <div
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              finalIconBg,
            )}
          >
            <Icon className={clsx('h-5 w-5', finalIconColor)} />
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
};
