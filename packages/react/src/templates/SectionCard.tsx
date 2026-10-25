import { type ComponentType, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';

export type SectionCardIconTone = 'brand' | 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'gray';

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
  /** Section title */
  title: string;
  /**
   * Heading element of the title. Default `h3`; under a page whose `PageHeader` is the `h1`
   * (`as="h1"`), pass `h2` so the levels go up by one.
   */
  as?: 'h2' | 'h3';
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
 * SectionCard — a `Card` (24px padding) with title, optional icon and description, and children.
 *
 * The de-facto building block for grouped content in a page. Use multiple
 * SectionCards stacked vertically (with `space-y-6`) or in a grid.
 */
export const SectionCard = ({
  title,
  as: Heading = 'h3',
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
    <Card padding="lg" className={className}>
      <div className="mb-5 flex items-center gap-3">
        {Icon && (
          <div
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              finalIconBg
            )}
          >
            <Icon className={clsx('h-5 w-5', finalIconColor)} />
          </div>
        )}
        <div>
          <Heading className="text-sm font-semibold text-[var(--color-text-primary)]">
            {title}
          </Heading>
          {desc && <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{desc}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
};
