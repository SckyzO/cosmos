import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ElementType, ReactNode, Ref } from 'react';
import type { Intent } from './intent';

/**
 * Emphasis: how loud the button is. Its color is the `intent`. `link` is the quietest: an action
 * that looks like a link (see `ButtonProps.variant`).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'link';
/**
 * Meaning: the accent (`brand`, default), a confirmed outcome (`success`), a caution (`warning`)
 * or a destructive action (`danger`).
 */
export type ButtonIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger'>;
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/**
 * Corner radius shape. Default `rounded` (TUI default `rounded-md`).
 * Use `pill` for fully-rounded (TUI "Rounded primary/secondary"), and
 * `circle` (round) or `square` (`rounded-lg`) for an icon-only button as wide as it is tall
 * (TUI "Circular"). An icon-only button needs an `aria-label`. `variant="link"` has no box,
 * so it ignores the shape.
 */
export type ButtonShape = 'rounded' | 'pill' | 'circle' | 'square';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Emphasis. Default `primary`. `link` is an action that looks like a link: underlined text with
   * no fixed height, padding or margin, so `size` only sets the text size. There is no neutral
   * `link` (`ghost` is the gray one), and `Link` stays the anchor for navigation.
   */
  variant?: ButtonVariant;
  /**
   * Meaning. Default `brand`: the accent on `primary`, `soft` and `link`, the neutral gray on
   * `secondary` and `ghost`. `success` turns any variant green, `warning` amber, `danger` red.
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
    // Dark text on the green fill: white on green-500 is about 2.3:1, under 4.5:1.
    success:
      'bg-green-500 hover:bg-green-600 text-gray-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
    // Dark text on the amber fill too (8.31:1), the pair of `Badge` `solid` and `Ribbon`.
    warning:
      'bg-amber-500 hover:bg-amber-600 text-gray-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  },
  secondary: {
    brand:
      'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed',
    success:
      'bg-white text-green-700 border border-green-200 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
    warning:
      'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 dark:bg-gray-800 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'bg-white text-red-700 border border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
  },
  ghost: {
    brand:
      'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed',
    success:
      'text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
    warning:
      'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
  },
  // TUI Plus "Soft buttons" — tinted background, no border, matching text.
  soft: {
    brand:
      'bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20',
    success:
      'bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20',
    warning:
      'bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20',
  },
  // Text only. `success`, `warning` and `danger` have the text colors of `ghost`; `brand` is the
  // accent text, not the gray of `ghost`. Hover goes one step darker in light, lighter in dark.
  link: {
    brand:
      'text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50 disabled:cursor-not-allowed',
    success:
      'text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed',
    warning:
      'text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed',
  },
};

// Text size and the gap to the icon: all `variant="link"` takes from `size`.
const TEXT_CLASS: Record<ButtonSize, string> = {
  xs: 'text-xs gap-1',
  sm: 'text-xs gap-1.5',
  md: 'text-sm gap-2',
  lg: 'text-base gap-2',
  xl: 'text-base gap-2.5',
};

const HEIGHT_CLASS: Record<ButtonSize, string> = {
  xs: 'h-7',
  sm: 'h-8',
  md: 'h-9',
  lg: 'h-11',
  xl: 'h-12',
};

// Horizontal padding, for every shape but `circle` and `square`. Kept apart from HEIGHT_CLASS:
// clsx doesn't dedupe, and a `px-0` next to it lost in the CSS order, which
// squeezed circle icons.
const PADDING_X: Record<ButtonSize, string> = {
  xs: 'px-2',
  sm: 'px-3',
  md: 'px-3.5',
  lg: 'px-5',
  xl: 'px-6',
};

// Width of an icon-only button (`circle` and `square`): the height of its size, with no
// horizontal padding.
const ICON_ONLY_WIDTH: Record<ButtonSize, string> = {
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
  square: 'rounded-lg',
};

// A link has no box: only the radius of its focus ring, and the underline.
const LINK_CLASS = 'rounded-sm underline underline-offset-2';

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
      TEXT_CLASS[size],
      variant === 'link'
        ? LINK_CLASS
        : [
            HEIGHT_CLASS[size],
            SHAPE_CLASS[shape],
            shape === 'circle' || shape === 'square' ? ICON_ONLY_WIDTH[size] : PADDING_X[size],
          ],
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
