import { clsx } from 'clsx';
import { useId } from 'react';
import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
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

export function Input({
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
  ref,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  const descId = `${inputId}-desc`;
  const hasDesc = !!(error || description);
  const fieldA11y = {
    'aria-describedby': hasDesc ? descId : undefined,
    'aria-invalid': error ? true : undefined,
  };
  const hasGroup = prefix !== undefined || suffix !== undefined;
  const borderClass = error
    ? 'border-red-400 focus-within:field-focus-error dark:border-red-500/60'
    : 'border-gray-200 focus-within:field-focus dark:border-gray-700';

  return (
    <div className="block">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {labelTrailing}
        </label>
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
            {...fieldA11y}
            className={clsx(
              'h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:placeholder:text-gray-400',
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
            {...fieldA11y}
            className={clsx(
              'h-full w-full rounded-lg border bg-white text-sm transition-colors placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
              Icon ? 'pl-9' : 'pl-3',
              rightSlot ? 'pr-16' : 'pr-3',
              error
                ? 'focus:field-focus-error border-red-400 dark:border-red-500/60'
                : 'focus:field-focus border-gray-200 dark:border-gray-700',
              className
            )}
            {...rest}
          />
          {rightSlot && (
            <span className="pointer-events-none absolute right-3 text-xs text-gray-500 dark:text-gray-400">
              {rightSlot}
            </span>
          )}
        </div>
      )}
      {hasDesc && (
        <span
          id={descId}
          className={clsx(
            'mt-1 block text-xs',
            error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? description}
        </span>
      )}
    </div>
  );
}
