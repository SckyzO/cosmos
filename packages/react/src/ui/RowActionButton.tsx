import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type RowActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  hideChevron?: boolean;
};

/**
 * RowActionButton — compact action button for the right edge of table rows
 * or list items. Defaults to a chevron-right indicator suggesting navigation.
 */
export const RowActionButton = ({
  children = 'View',
  hideChevron = false,
  className,
  type = 'button',
  ...rest
}: RowActionButtonProps) => (
  <button
    type={type}
    className={clsx(
      'hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:border-brand-700/50 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors dark:border-gray-700 dark:text-gray-400',
      className
    )}
    {...rest}
  >
    {children}
    {!hideChevron && <ChevronRight className="h-3.5 w-3.5" />}
  </button>
);
