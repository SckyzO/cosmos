import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
};

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

export const Badge = ({ children, variant = 'neutral', size = 'md', className }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full font-semibold',
      VARIANT_CLASS[variant],
      SIZE_CLASS[size],
      className
    )}
  >
    {children}
  </span>
);
