import { clsx } from 'clsx';
import type { ElementType } from 'react';

export type IconBoxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

// The box in px: 24, 28, 32, 40, 48, 56 and 64. The corners grow in steps, not with every size.
const BOX_SIZE: Record<IconBoxSize, string> = {
  xs: 'h-6 w-6 rounded-md',
  sm: 'h-7 w-7 rounded-md',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-10 w-10 rounded-xl',
  xl: 'h-12 w-12 rounded-xl',
  '2xl': 'h-14 w-14 rounded-2xl',
  '3xl': 'h-16 w-16 rounded-2xl',
};

const ICON_SIZE: Record<IconBoxSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
  '2xl': 'h-7 w-7',
  '3xl': 'h-8 w-8',
};

export type IconBoxProps = {
  icon: ElementType;
  /** Seven steps, `xs` (24px) to `3xl` (64px), `md` (32px) by default. */
  size?: IconBoxSize;
  /** Tailwind background classes — default neutral gray. */
  bg?: string;
  /** Tailwind text color classes — default neutral gray. */
  color?: string;
  className?: string;
};

/**
 * IconBox — icon wrapped in a rounded square with configurable color theme.
 * Useful for resource avatars in lists and cards.
 */
export const IconBox = ({
  icon: Icon,
  size = 'md',
  bg = 'bg-gray-100 dark:bg-gray-800',
  color = 'text-gray-500 dark:text-gray-400',
  className,
}: IconBoxProps) => (
  <div className={clsx('flex shrink-0 items-center justify-center', BOX_SIZE[size], bg, className)}>
    <Icon className={clsx(ICON_SIZE[size], color)} />
  </div>
);
