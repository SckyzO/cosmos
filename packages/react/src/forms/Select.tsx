import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useId, type ComponentPropsWithRef } from 'react';
import { useFieldA11y } from './fieldA11y';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children'> & {
  options: SelectOption[];
  label?: string;
  description?: string;
  error?: string;
  /**
   * Hint shown while nothing is picked: a disabled option with an empty value,
   * listed first. A Select without `value` or `defaultValue` starts on it; a
   * controlled one shows it while `value` is `''`.
   */
  placeholder?: string;
  /**
   * Fill the width of the parent. Default `true`. `false` makes the control as
   * wide as its widest option, inline with its siblings (a Select in a FormRow
   * or a toolbar).
   */
  fullWidth?: boolean;
};

/**
 * Select — styled native `<select>`. `onChange` receives the native change
 * event and `ref` the `<select>`, like any native field. `className` goes to
 * the `<select>` itself.
 *
 * `label`, `description` and `error` are rendered around it and wired through
 * `htmlFor` and `aria-describedby`. Without a `label`, it takes its name and
 * description from the enclosing FormRow instead, like the other bare controls;
 * a row description or an `aria-describedby` you pass is read after the
 * `description` or `error`, never in place of it.
 */
export function Select({
  options,
  label,
  description,
  error,
  placeholder,
  fullWidth = true,
  className,
  id,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? rest.name ?? generatedId;
  const descId = `${selectId}-desc`;
  const hasDesc = !!(error || description);
  const fieldA11y = useFieldA11y(
    { 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy },
    { ownLabel: !!label }
  );
  // The message under the select, then whatever the caller or the row adds.
  const describedByIds =
    [hasDesc ? descId : undefined, fieldA11y['aria-describedby']].filter(Boolean).join(' ') ||
    undefined;
  // A disabled first option is skipped by the browser's initial selection:
  // without a default value the placeholder would never show.
  const defaultValue =
    rest.defaultValue ?? (placeholder && rest.value === undefined ? '' : undefined);
  return (
    <div className={fullWidth ? 'block' : 'inline-block'}>
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
          aria-label={fieldA11y['aria-label']}
          aria-labelledby={fieldA11y['aria-labelledby']}
          aria-describedby={describedByIds}
          aria-invalid={error ? true : undefined}
          className={clsx(
            'h-9 appearance-none rounded-lg border bg-white pr-9 pl-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white',
            fullWidth && 'w-full',
            error
              ? 'focus:field-focus-error border-red-400 dark:border-red-500/60'
              : 'focus:field-focus border-gray-200 dark:border-gray-700',
            className
          )}
          {...rest}
          defaultValue={defaultValue}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
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
