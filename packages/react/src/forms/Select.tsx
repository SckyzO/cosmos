import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useId, type ComponentPropsWithRef } from 'react';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children'> & {
  options: SelectOption[];
  label?: string;
  description?: string;
  error?: string;
};

export function Select({
  options,
  label,
  description,
  error,
  className,
  id,
  ref,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? rest.name ?? generatedId;
  const descId = `${selectId}-desc`;
  const hasDesc = !!(error || description);
  return (
    <div className="block">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-describedby={hasDesc ? descId : undefined}
          aria-invalid={error ? true : undefined}
          className={clsx(
            'h-9 w-full appearance-none rounded-lg border bg-white pr-9 pl-3 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white',
            error
              ? 'border-red-400 focus:border-red-500 dark:border-red-500/60'
              : 'focus:border-brand-500 border-gray-200 dark:border-gray-700',
            className
          )}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
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
