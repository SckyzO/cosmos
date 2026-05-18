import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { ElementType, InputHTMLAttributes, ReactNode } from 'react';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  description?: string;
  error?: string;
  /** Optional left icon (lucide-react). Ignored when `prefix` is set. */
  icon?: ElementType;
  /** Optional right slot — e.g. unit suffix, validation pill. Ignored when `suffix` is set. */
  rightSlot?: ReactNode;
  /** Slot rendered next to the label text (e.g. a TooltipHelp). */
  labelTrailing?: ReactNode;
  /** Attached prefix addon (e.g. `https://`, `€`, `@`). Renders as a bordered group. */
  prefix?: ReactNode;
  /** Attached suffix addon (e.g. `.com`, `kg`). Renders as a bordered group. */
  suffix?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    description,
    error,
    icon: Icon,
    rightSlot,
    labelTrailing,
    prefix,
    suffix,
    className,
    id,
    ...rest
  },
  ref
) {
  const inputId = id ?? rest.name;
  const hasGroup = prefix !== undefined || suffix !== undefined;
  const borderClass = error
    ? 'border-red-400 focus-within:border-red-500 dark:border-red-500/60'
    : 'border-gray-200 focus-within:border-brand-500 dark:border-gray-700';

  return (
    <label htmlFor={inputId} className="block">
      {label && (
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {labelTrailing}
        </span>
      )}
      {hasGroup ? (
        <div
          className={clsx(
            'flex h-9 w-full items-stretch overflow-hidden rounded-lg border bg-white transition-colors dark:bg-gray-800',
            borderClass
          )}
        >
          {prefix !== undefined && (
            <span className="flex shrink-0 items-center border-r border-inherit bg-gray-50 px-3 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-gray-900 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white',
              className
            )}
            {...rest}
          />
          {suffix !== undefined && (
            <span className="flex shrink-0 items-center border-l border-inherit bg-gray-50 px-3 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              {suffix}
            </span>
          )}
        </div>
      ) : (
        <div className="relative inline-flex h-9 w-full items-center">
          {Icon && (
            <Icon
              aria-hidden
              className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400"
            />
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
      )}
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
