import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ElementType, ReactNode, Ref } from 'react';
import type { Intent } from './intent';

/** Emphasis: a bordered `outline` or a filled `primary`. Its color is the `intent`. */
export type PageActionVariant = 'outline' | 'primary';
/** Meaning: the accent or a destructive action. */
export type PageActionIntent = Extract<Intent, 'brand' | 'danger'>;

const OUTLINE_CLASS: Record<PageActionIntent | 'neutral', string> = {
  neutral:
    'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
  brand:
    'border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 dark:border-brand-700/40 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20',
  danger:
    'border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10',
};

const PRIMARY_CLASS: Record<PageActionIntent, string> = {
  brand:
    'border-transparent bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600',
  danger:
    'border-transparent bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
};

// An outline is neutral until it gets an intent; a primary is brand until it gets one.
const variantClass = (variant: PageActionVariant, intent?: PageActionIntent) =>
  variant === 'primary' ? PRIMARY_CLASS[intent ?? 'brand'] : OUTLINE_CLASS[intent ?? 'neutral'];

export type PageActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ElementType;
  /** Emphasis. Default `outline`. */
  variant?: PageActionVariant;
  /**
   * Meaning. `brand` tints an `outline` with the accent, `danger` turns either variant
   * red. Unset keeps a neutral `outline` and a brand `primary`.
   */
  intent?: PageActionIntent;
  children?: ReactNode;
  /** Ref to the `<button>`. */
  ref?: Ref<HTMLButtonElement>;
};

export const PageActionButton = ({
  icon: Icon,
  variant = 'outline',
  intent,
  className,
  children,
  type = 'button',
  ref,
  ...rest
}: PageActionButtonProps) => (
  <button
    ref={ref}
    type={type}
    className={clsx(
      'focus-visible:focus-indicator flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      variantClass(variant, intent),
      className
    )}
    {...rest}
  >
    {Icon && <Icon className="h-4 w-4 shrink-0" />}
    {children}
  </button>
);

export type PageActionIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  icon: ElementType;
  /** Emphasis. Default `outline`. */
  variant?: PageActionVariant;
  /** Meaning, as on `PageActionButton`. */
  intent?: PageActionIntent;
  /** Ref to the `<button>`. */
  ref?: Ref<HTMLButtonElement>;
};

export const PageActionIconButton = ({
  icon: Icon,
  variant = 'outline',
  intent,
  className,
  type = 'button',
  ref,
  ...rest
}: PageActionIconButtonProps) => (
  <button
    ref={ref}
    type={type}
    className={clsx(
      'focus-visible:focus-indicator flex items-center justify-center rounded-lg border p-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      variantClass(variant, intent),
      className
    )}
    {...rest}
  >
    <Icon className="h-4 w-4" />
  </button>
);
