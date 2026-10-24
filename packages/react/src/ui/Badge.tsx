import { clsx } from 'clsx';
import type { ElementType, ReactNode } from 'react';
import type { Intent } from './intent';

export type BadgeSize = 'sm' | 'md';
export type BadgeAppearance = 'light' | 'solid';

export type BadgeProps = {
  children: ReactNode;
  /** Color of the badge. Default `neutral`. */
  intent?: Intent;
  size?: BadgeSize;
  /**
   * Visual style. `light` (default) = soft tinted bg + colored text. `solid` =
   * filled bg: white text, dark text on the bright `success` and `warning` fills.
   */
  appearance?: BadgeAppearance;
  /** Optional Lucide icon. */
  icon?: ElementType;
  iconPosition?: 'left' | 'right';
  className?: string;
};

const INTENT_LIGHT: Record<Intent, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

// Every text reaches 4.5:1 in the four themes. Ribbon, NotificationsPanel and
// StatefulSaveButton use the same fill per intent.
const INTENT_SOLID: Record<Intent, string> = {
  neutral: 'bg-gray-600 text-white',
  brand: 'bg-brand-500 text-white',
  success: 'bg-green-500 text-gray-900',
  warning: 'bg-amber-500 text-gray-900',
  danger: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-3xs gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
};

const ICON_SIZE: Record<BadgeSize, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
};

export const Badge = ({
  children,
  intent = 'neutral',
  size = 'md',
  appearance = 'light',
  icon: Icon,
  iconPosition = 'left',
  className,
}: BadgeProps) => {
  const intentMap = appearance === 'solid' ? INTENT_SOLID : INTENT_LIGHT;
  const iconClass = ICON_SIZE[size];
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold',
        intentMap[intent],
        SIZE_CLASS[size],
        className
      )}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className={clsx('shrink-0', iconClass)} aria-hidden />
      )}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && (
        <Icon className={clsx('shrink-0', iconClass)} aria-hidden />
      )}
    </span>
  );
};
