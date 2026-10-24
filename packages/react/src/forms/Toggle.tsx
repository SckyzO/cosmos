import { clsx } from 'clsx';
import type { Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { useControllableState } from '../hooks/useControllableState';

export type ToggleProps = FieldA11yProps & {
  /** Checked state, when controlled. */
  checked?: boolean;
  /** Initial checked state, when uncontrolled. Default `false`. */
  defaultChecked?: boolean;
  /** Called with the state to move to. */
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  /** Ref to the switch `<button role="switch">`, the element to focus on a validation error. */
  ref?: Ref<HTMLButtonElement>;
};

export const Toggle = ({
  checked: checkedProp,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  description,
  ref,
  ...a11y
}: ToggleProps) => {
  const fieldA11y = useFieldA11y(a11y, { ownLabel: !!label });
  const [checked, setChecked] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange,
    name: 'Toggle.checked',
  });
  return (
    <label className={clsx('flex items-center gap-3', disabled && 'opacity-50')}>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        {...fieldA11y}
        disabled={disabled}
        onClick={() => !disabled && setChecked(!checked)}
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          checked ? 'bg-brand-500' : 'bg-gray-500 dark:bg-gray-400'
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
};
