import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3 text-sm gap-2',
  lg: 'h-11 px-4 text-base gap-2',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
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
      'focus-visible:ring-brand-500/40 inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2',
      VARIANT_CLASS[variant],
      SIZE_CLASS[size],
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
