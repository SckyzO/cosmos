import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/**
 * Corner radius shape. Default `rounded` (TUI default `rounded-md`).
 * Use `pill` for fully-rounded (TUI "Rounded primary/secondary"),
 * `circle` for icon-only square buttons (TUI "Circular").
 */
export type ButtonShape = 'rounded' | 'pill' | 'circle';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  icon?: ElementType;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 hover:bg-brand-600 text-white shadow-sm disabled:bg-brand-500/50 disabled:cursor-not-allowed',
  secondary:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  // TUI Plus "Soft buttons" — tinted background, no border, matching text.
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  xl: 'h-12 px-6 text-base gap-2.5',
};

// Square padding when shape='circle' — overrides horizontal px from SIZE_CLASS.
const CIRCLE_SQUARE: Record<ButtonSize, string> = {
  xs: 'w-7 px-0',
  sm: 'w-8 px-0',
  md: 'w-9 px-0',
  lg: 'w-11 px-0',
  xl: 'w-12 px-0',
};

const SHAPE_CLASS: Record<ButtonShape, string> = {
  rounded: 'rounded-lg',
  pill: 'rounded-full',
  circle: 'rounded-full',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-5 w-5',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={clsx(
      'focus-visible:ring-brand-500/40 inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2',
      VARIANT_CLASS[variant],
      SIZE_CLASS[size],
      SHAPE_CLASS[shape],
      shape === 'circle' && CIRCLE_SQUARE[size],
      className
    )}
    {...rest}
  >
    {Icon && iconPosition === 'left' && !loading && <Icon className={ICON_SIZE[size]} />}
    {loading && (
      <span
        aria-hidden
        className={clsx(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          ICON_SIZE[size]
        )}
      />
    )}
    {children}
    {Icon && iconPosition === 'right' && !loading && <Icon className={ICON_SIZE[size]} />}
  </button>
);
