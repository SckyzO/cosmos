import { clsx } from 'clsx';

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
};

export const Toggle = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: ToggleProps) => (
  <label className={clsx('flex items-center gap-3', disabled && 'opacity-50')}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        checked ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
    {(label || description) && (
      <span className="min-w-0 flex-1">
        {label && (
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        )}
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </span>
    )}
  </label>
);
