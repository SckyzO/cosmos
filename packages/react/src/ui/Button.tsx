import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ElementType, ReactNode, Ref } from 'react';
import type { Intent } from './intent';

/** Emphasis: how loud the button is. Its color is the `intent`. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft';
/** Meaning: the accent (`brand`, default) or a destructive action (`danger`). */
export type ButtonIntent = Extract<Intent, 'brand' | 'danger'>;
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/**
 * Corner radius shape. Default `rounded` (TUI default `rounded-md`).
 * Use `pill` for fully-rounded (TUI "Rounded primary/secondary"),
 * `circle` for icon-only square buttons (TUI "Circular").
 */
export type ButtonShape = 'rounded' | 'pill' | 'circle';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Emphasis. Default `primary`. */
  variant?: ButtonVariant;
  /**
   * Meaning. Default `brand`: the accent on `primary` and `soft`, the neutral gray on
   * `secondary` and `ghost`. `danger` turns any variant red.
   */
  intent?: ButtonIntent;
  size?: ButtonSize;
  shape?: ButtonShape;
  icon?: ElementType;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: ReactNode;
  /** Ref to the `<button>`. */
  ref?: Ref<HTMLButtonElement>;
};

const VARIANT_CLASS: Record<ButtonVariant, Record<ButtonIntent, string>> = {
  primary: {
    brand:
      'bg-brand-500 hover:bg-brand-600 text-white shadow-sm disabled:bg-brand-500/50 disabled:cursor-not-allowed',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  },
  secondary: {
    brand:
      'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'bg-white text-red-700 border border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
  },
  ghost: {
    brand:
      'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
  },
  // TUI Plus "Soft buttons" — tinted background, no border, matching text.
  soft: {
    brand:
      'bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20',
  },
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: 'h-7 text-xs gap-1',
  sm: 'h-8 text-xs gap-1.5',
  md: 'h-9 text-sm gap-2',
  lg: 'h-11 text-base gap-2',
  xl: 'h-12 text-base gap-2.5',
};

// Horizontal padding, for every shape but `circle`. Kept apart from SIZE_CLASS:
// clsx doesn't dedupe, and a `px-0` next to it lost in the CSS order, which
// squeezed circle icons.
const PADDING_X: Record<ButtonSize, string> = {
  xs: 'px-2',
  sm: 'px-3',
  md: 'px-3.5',
  lg: 'px-5',
  xl: 'px-6',
};

// Square size when shape='circle', with no horizontal padding.
const CIRCLE_SQUARE: Record<ButtonSize, string> = {
  xs: 'w-7',
  sm: 'w-8',
  md: 'w-9',
  lg: 'w-11',
  xl: 'w-12',
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
  intent = 'brand',
  size = 'md',
  shape = 'rounded',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) => (
  <button
    ref={ref}
    type={type}
    disabled={disabled || loading}
    className={clsx(
      'focus-visible:focus-indicator inline-flex items-center justify-center font-medium transition-colors',
      VARIANT_CLASS[variant][intent],
      SIZE_CLASS[size],
      SHAPE_CLASS[shape],
      shape === 'circle' ? CIRCLE_SQUARE[size] : PADDING_X[size],
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
