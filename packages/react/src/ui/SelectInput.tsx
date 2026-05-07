import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export type SelectInputOption = { label: string; value: string };

export type SelectInputProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectInputOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * SelectInput — styled native select wrapper. Different from `Select` (which
 * adds label/description/error chrome) and from `Dropdown` (which is a
 * non-native menu). Use this when you want a pure value-changing native select
 * with the Cosmos look.
 */
export const SelectInput = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
}: SelectInputProps) => (
  <div className={clsx('relative inline-block', className)}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={clsx(
        'focus:border-brand-500 h-9 appearance-none rounded-lg border border-gray-200 bg-white pr-9 pl-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
  </div>
);
