import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  options: SelectOption[];
  label?: string;
  description?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, label, description, error, className, id, ...rest },
  ref
) {
  const selectId = id ?? rest.name;
  return (
    <label htmlFor={selectId} className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
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
