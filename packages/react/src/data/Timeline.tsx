import { clsx } from 'clsx';
import type { ElementType, ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';

export type TimelineItem = {
  id: string;
  /** Label or rendered title for the entry. */
  title: ReactNode;
  /** Optional secondary line under the title. */
  description?: ReactNode;
  /** Time label — e.g. "5m ago", "2026-05-07 14:32". */
  time?: ReactNode;
  /** Lucide icon for `dot` variant (small accent). */
  icon?: ElementType;
  /** Initials/name for `avatar` variant. */
  avatarName?: string;
  /** Optional image URL for `avatar` variant. */
  avatarSrc?: string;
};

export type TimelineVariant = 'dot' | 'avatar' | 'card';

export type TimelineProps = {
  items: TimelineItem[];
  variant?: TimelineVariant;
  className?: string;
};

const Dot = ({ icon: Icon }: { icon?: ElementType }) => (
  <span className="bg-brand-500 relative z-10 flex h-3 w-3 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900">
    {Icon && <Icon className="h-2 w-2 text-white" />}
  </span>
);

export const Timeline = ({ items, variant = 'dot', className }: TimelineProps) => (
  <ol
    className={clsx(
      'relative space-y-4',
      variant !== 'card' && 'border-l border-gray-200 pl-6 dark:border-gray-800',
      className
    )}
  >
    {items.map((item) => {
      if (variant === 'card') {
        return (
          <li
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                )}
              </div>
              {item.time && (
                <span className="shrink-0 font-mono text-[10px] text-gray-400 uppercase">
                  {item.time}
                </span>
              )}
            </div>
          </li>
        );
      }
      return (
        <li key={item.id} className="relative">
          <span className="absolute top-0.5 -left-[1.85rem]">
            {variant === 'avatar' ? (
              <Avatar size="xs" name={item.avatarName} src={item.avatarSrc} />
            ) : (
              <Dot icon={item.icon} />
            )}
          </span>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
          {item.description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
          )}
          {item.time && (
            <p className="mt-0.5 font-mono text-[10px] text-gray-400 uppercase">{item.time}</p>
          )}
        </li>
      );
    })}
  </ol>
);
