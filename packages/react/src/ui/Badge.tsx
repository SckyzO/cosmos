import { clsx } from 'clsx';
import type { ElementType, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';
export type BadgeAppearance = 'light' | 'solid';

export type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Visual style. `light` (default) = soft tinted bg + colored text. `solid` = filled bg + white text. */
  appearance?: BadgeAppearance;
  /** Optional Lucide icon. */
  icon?: ElementType;
  iconPosition?: 'left' | 'right';
  className?: string;
};

const VARIANT_LIGHT: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

const VARIANT_SOLID: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-600 text-white dark:bg-gray-500',
  brand: 'bg-brand-500 text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
};

const ICON_SIZE: Record<BadgeSize, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
};

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  appearance = 'light',
  icon: Icon,
  iconPosition = 'left',
  className,
}: BadgeProps) => {
  const variantMap = appearance === 'solid' ? VARIANT_SOLID : VARIANT_LIGHT;
  const iconClass = ICON_SIZE[size];
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold',
        variantMap[variant],
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
