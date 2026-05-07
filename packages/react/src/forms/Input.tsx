import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { ElementType, InputHTMLAttributes, ReactNode } from 'react';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  description?: string;
  error?: string;
  /** Optional left icon (lucide-react). */
  icon?: ElementType;
  /** Optional right slot — e.g. unit suffix, validation pill. */
  rightSlot?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, description, error, icon: Icon, rightSlot, className, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <div className="relative inline-flex h-9 w-full items-center">
        {Icon && (
          <Icon aria-hidden className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'h-full w-full rounded-lg border bg-white text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white',
            Icon ? 'pl-9' : 'pl-3',
            rightSlot ? 'pr-16' : 'pr-3',
            error
              ? 'border-red-400 focus:border-red-500 dark:border-red-500/60'
              : 'focus:border-brand-500 border-gray-200 dark:border-gray-700',
            className
          )}
          {...rest}
        />
        {rightSlot && (
          <span className="pointer-events-none absolute right-3 text-xs text-gray-400">
            {rightSlot}
          </span>
        )}
      </div>
      {(error || description) && (
        <span
          className={clsx(
            'mt-1 block text-xs',
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? description}
        </span>
      )}
    </label>
  );
});
