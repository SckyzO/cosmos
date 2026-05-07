import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react';

export type PageActionVariant = 'outline' | 'primary' | 'brand-outline' | 'danger-outline';

const VARIANT_CLASS: Record<PageActionVariant, string> = {
  outline:
    'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
  primary:
    'border-transparent bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600',
  'brand-outline':
    'border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 dark:border-brand-700/40 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20',
  'danger-outline':
    'border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10',
};

export type PageActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ElementType;
  variant?: PageActionVariant;
  children?: ReactNode;
};

export const PageActionButton = ({
  icon: Icon,
  variant = 'outline',
  className,
  children,
  type = 'button',
  ...rest
}: PageActionButtonProps) => (
  <button
    type={type}
    className={clsx(
      'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      VARIANT_CLASS[variant],
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
  variant?: PageActionVariant;
};

export const PageActionIconButton = ({
  icon: Icon,
  variant = 'outline',
  className,
  type = 'button',
  ...rest
}: PageActionIconButtonProps) => (
  <button
    type={type}
    className={clsx(
      'flex items-center justify-center rounded-lg border p-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      VARIANT_CLASS[variant],
      className
    )}
    {...rest}
  >
    <Icon className="h-4 w-4" />
  </button>
);
