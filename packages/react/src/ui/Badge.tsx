import { clsx } from 'clsx';
import type { ElementType, ReactNode } from 'react';
import type { Intent } from './intent';

export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeShape = 'pill' | 'rounded';
export type BadgeAppearance = 'light' | 'solid' | 'outline' | 'dot';

export type BadgeProps = {
  children: ReactNode;
  /** Color of the badge. Default `neutral`. */
  intent?: Intent;
  /** `sm`, `md` (default) or `lg`, the largest, for a badge that has to carry weight next to a heading. */
  size?: BadgeSize;
  /** Corners. `pill` (default) is fully rounded; `rounded` is a rounded rectangle (`rounded-md`), for a tag-like badge. */
  shape?: BadgeShape;
  /**
   * Visual style. `light` (default) = soft tinted bg + colored text. `solid` =
   * filled bg: white text, dark text on the bright `success` and `warning` fills. `outline` =
   * no fill, a colored border and text. `dot` = no fill, neutral text led by a dot of the
   * intent color: for a status in a dense list, where a filled pill would shout.
   */
  appearance?: BadgeAppearance;
  /** Optional Lucide icon. */
  icon?: ElementType;
  iconPosition?: 'left' | 'right';
  className?: string;
};

const INTENT_LIGHT: Record<Intent, string> = {
  // A translucent fill, not gray-800: the badge sits on gray-800 cards and panels, where a gray-800
  // fill vanished.
  neutral: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

const INTENT_OUTLINE: Record<Intent, string> = {
  neutral: 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
  brand: 'border-brand-300 text-brand-700 dark:border-brand-500/50 dark:text-brand-400',
  success: 'border-green-300 text-green-700 dark:border-green-500/50 dark:text-green-400',
  warning: 'border-amber-300 text-amber-700 dark:border-amber-500/50 dark:text-amber-400',
  danger: 'border-red-300 text-red-700 dark:border-red-500/50 dark:text-red-400',
  info: 'border-blue-300 text-blue-700 dark:border-blue-500/50 dark:text-blue-400',
};

const DOT_COLOR: Record<Intent, string> = {
  neutral: 'bg-gray-400 dark:bg-gray-500',
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
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
  lg: 'px-3 py-1 text-sm gap-1.5',
};

const SHAPE_CLASS: Record<BadgeShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-md',
};

const ICON_SIZE: Record<BadgeSize, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
};

export const Badge = ({
  children,
  intent = 'neutral',
  size = 'md',
  shape = 'pill',
  appearance = 'light',
  icon: Icon,
  iconPosition = 'left',
  className,
}: BadgeProps) => {
  const intentClass =
    appearance === 'solid'
      ? INTENT_SOLID[intent]
      : appearance === 'outline'
        ? clsx('border', INTENT_OUTLINE[intent])
        : appearance === 'dot'
          ? 'border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'
          : INTENT_LIGHT[intent];
  const iconClass = ICON_SIZE[size];
  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold',
        SHAPE_CLASS[shape],
        intentClass,
        SIZE_CLASS[size],
        className
      )}
    >
      {appearance === 'dot' && (
        <span
          aria-hidden
          className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', DOT_COLOR[intent])}
        />
      )}
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
