import { clsx } from 'clsx';
import { ChevronDown, CircleCheck } from 'lucide-react';
import { useId, type ComponentPropsWithRef } from 'react';
import { useFieldA11y } from './fieldA11y';
import {
  FIELD_ICON_RIGHT,
  FIELD_ICON_SIZE,
  FIELD_PAD_LEFT,
  FIELD_PAD_RIGHT_ICON,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { RequiredMark } from './RequiredMark';

export type SelectOption = { value: string; label: string; disabled?: boolean };

// With the check icon beside the chevron: the icon sits one icon width plus a
// 6px gap left of the chevron, and the text clears both with the chevron's 8px.
const FIELD_ICON_RIGHT_CHECK: Record<FieldSize, string> = {
  sm: 'right-7.5',
  md: 'right-8.5',
  lg: 'right-10',
};

const FIELD_PAD_RIGHT_CHECK: Record<FieldSize, string> = {
  sm: 'pr-13',
  md: 'pr-14.5',
  lg: 'pr-17',
};

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children' | 'size'> & {
  options: SelectOption[];
  label?: string;
  description?: string;
  error?: string;
  /**
   * Message shown once the choice is valid: a green border and message, and a
   * check icon beside the chevron. The message is linked as the description and
   * announced politely when it appears. `error` wins when both are set.
   */
  success?: string;
  /**
   * Height and text size, aligned on Button's. Default `md`. Replaces the native
   * `size` attribute (the number of visible rows), which is omitted from the props.
   */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label, `required` and `aria-required` on the select. */
  required?: boolean;
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
  success,
  placeholder,
  size = 'md',
  required,
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
  const successText = error ? undefined : success || undefined;
  const hasDesc = !!(error || successText || description);
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
          {required && <RequiredMark />}
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
          aria-required={required || undefined}
          required={required}
          className={clsx(
            'appearance-none',
            fieldClass({ size, invalid: !!error, success: !!successText }),
            successText ? FIELD_PAD_RIGHT_CHECK[size] : FIELD_PAD_RIGHT_ICON[size],
            FIELD_PAD_LEFT[size],
            fullWidth && 'w-full',
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
        {successText && (
          <CircleCheck
            aria-hidden
            className={clsx(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400',
              FIELD_ICON_RIGHT_CHECK[size],
              FIELD_ICON_SIZE[size]
            )}
          />
        )}
        <ChevronDown
          className={clsx(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400',
            FIELD_ICON_RIGHT[size],
            FIELD_ICON_SIZE[size]
          )}
        />
      </div>
      {hasDesc && (
        <span
          id={descId}
          aria-live={successText ? 'polite' : undefined}
          className={clsx(
            'mt-1 block text-xs',
            error
              ? 'text-red-700 dark:text-red-400'
              : successText
                ? 'text-green-700 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {successText ?? error ?? description}
        </span>
      )}
    </div>
  );
}
