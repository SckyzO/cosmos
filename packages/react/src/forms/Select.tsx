import { clsx } from 'clsx';
import { ChevronDown, CircleCheck } from 'lucide-react';
import { useId, type ComponentPropsWithRef } from 'react';
import { useFieldA11y } from './fieldA11y';
import {
  FIELD_ICON_END,
  FIELD_ICON_SIZE,
  FIELD_PAD_START,
  FIELD_PAD_END_ICON,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { FieldMessage } from './FieldMessage';
import { RequiredMark } from './RequiredMark';

export type SelectOption = { value: string; label: string; disabled?: boolean };

// The open list. A browser that can draw it itself (`appearance: base-select`, Chromium) gives it
// the look of the field listboxes (Combobox): the same panel, rows of `py-row-8 px-3`, a check
// mark on the picked one, the accent on the row under the pointer or the keyboard. The closed
// control keeps the one every browser shows, so its chevron stays ours and the text stays on the
// middle of the field. Any other browser keeps its native list, and none of these classes apply.
// Tailwind reads whole class names, so each one is written out.
const BASE_SELECT = [
  'not-supports-[appearance:base-select]:appearance-none',
  // The closed control: a flex row like the others, the text centred, the browser's own arrow off.
  'supports-[appearance:base-select]:[appearance:base-select]',
  'supports-[appearance:base-select]:inline-flex',
  'supports-[appearance:base-select]:items-center',
  'supports-[appearance:base-select]:[&::picker-icon]:hidden',
  // The panel, as FIELD_LISTBOX_PANEL draws it, 6px under the field. `dark:` comes before the
  // pseudo-element: the selector reads `.x:where(.dark *)::picker(select)`.
  'supports-[appearance:base-select]:[&::picker(select)]:[appearance:base-select]',
  'supports-[appearance:base-select]:[&::picker(select)]:my-1.5',
  'supports-[appearance:base-select]:[&::picker(select)]:max-h-60',
  'supports-[appearance:base-select]:[&::picker(select)]:overflow-auto',
  'supports-[appearance:base-select]:[&::picker(select)]:rounded-lg',
  'supports-[appearance:base-select]:[&::picker(select)]:border',
  'supports-[appearance:base-select]:[&::picker(select)]:border-gray-200',
  'supports-[appearance:base-select]:[&::picker(select)]:bg-white',
  'supports-[appearance:base-select]:[&::picker(select)]:py-1',
  'supports-[appearance:base-select]:[&::picker(select)]:shadow-lg',
  'supports-[appearance:base-select]:dark:[&::picker(select)]:border-gray-700',
  'supports-[appearance:base-select]:dark:[&::picker(select)]:bg-gray-800',
].join(' ');

// One row of that list. The check mark is Lucide's, as a mask so it takes the row's colour, and
// only the picked row has one.
const BASE_SELECT_OPTION = [
  'supports-[appearance:base-select]:flex',
  'supports-[appearance:base-select]:items-center',
  'supports-[appearance:base-select]:gap-2',
  'supports-[appearance:base-select]:px-3',
  'supports-[appearance:base-select]:py-row-8',
  'supports-[appearance:base-select]:text-gray-900',
  'supports-[appearance:base-select]:dark:text-gray-100',
  'supports-[appearance:base-select]:cursor-pointer',
  'supports-[appearance:base-select]:enabled:hover:bg-brand-500',
  'supports-[appearance:base-select]:enabled:hover:text-white',
  'supports-[appearance:base-select]:focus-visible:bg-brand-500',
  'supports-[appearance:base-select]:focus-visible:text-white',
  'supports-[appearance:base-select]:focus-visible:outline-hidden',
  'supports-[appearance:base-select]:disabled:cursor-not-allowed',
  'supports-[appearance:base-select]:disabled:opacity-50',
  'supports-[appearance:base-select]:[&::checkmark]:order-1',
  'supports-[appearance:base-select]:[&::checkmark]:ms-auto',
  'supports-[appearance:base-select]:[&::checkmark]:size-4',
  "supports-[appearance:base-select]:[&::checkmark]:content-['']",
  'supports-[appearance:base-select]:[&::checkmark]:bg-current',
  'supports-[appearance:base-select]:[&::checkmark]:[mask:url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27black%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27M20%206%209%2017l-5-5%27/%3E%3C/svg%3E)_center/contain_no-repeat]',
  'supports-[appearance:base-select]:[&:not(:checked)::checkmark]:hidden',
].join(' ');

// With the check icon beside the chevron: the icon sits one icon width plus a
// 6px gap before the chevron, and the text clears both with the chevron's 8px.
const FIELD_ICON_END_CHECK: Record<FieldSize, string> = {
  sm: 'inset-e-7.5',
  md: 'inset-e-8.5',
  lg: 'inset-e-10',
};

const FIELD_PAD_END_CHECK: Record<FieldSize, string> = {
  sm: 'pe-13',
  md: 'pe-14.5',
  lg: 'pe-17',
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
 * The open list belongs to the browser. Where the browser can draw it from CSS
 * (`appearance: base-select`, Chromium for now) it takes the look of the
 * Combobox list, with rows as tall as its own and a check mark on the picked
 * one; everywhere else it stays the native list, and on a phone the native
 * picker. For a list that looks the same in every browser, use `Combobox`.
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
            BASE_SELECT,
            fieldClass({ size, invalid: !!error, success: !!successText }),
            successText ? FIELD_PAD_END_CHECK[size] : FIELD_PAD_END_ICON[size],
            FIELD_PAD_START[size],
            fullWidth && 'w-full',
            className
          )}
          {...rest}
          defaultValue={defaultValue}
        >
          {placeholder && (
            <option value="" disabled className={BASE_SELECT_OPTION}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className={BASE_SELECT_OPTION}
            >
              {opt.label}
            </option>
          ))}
        </select>
        {successText && (
          <CircleCheck
            aria-hidden
            className={clsx(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400',
              FIELD_ICON_END_CHECK[size],
              FIELD_ICON_SIZE[size]
            )}
          />
        )}
        <ChevronDown
          className={clsx(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400',
            FIELD_ICON_END[size],
            FIELD_ICON_SIZE[size]
          )}
        />
      </div>
      <FieldMessage
        show={hasDesc}
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
      </FieldMessage>
    </div>
  );
}
