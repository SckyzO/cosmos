import { clsx } from 'clsx';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { useId } from 'react';
import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react';
import {
  FIELD_HEIGHT,
  FIELD_ICON_START,
  FIELD_ICON_END,
  FIELD_ICON_SIZE,
  FIELD_PAD_START,
  FIELD_PAD_START_ICON,
  FIELD_PAD_END,
  FIELD_PAD_END_ICON,
  FIELD_PAD_X,
  FIELD_PLACEHOLDER,
  FIELD_PLAINTEXT,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { RequiredMark } from './RequiredMark';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  label?: string;
  description?: string;
  error?: string;
  /**
   * Message shown once the value is valid (a free username, an accepted code):
   * a green border and message, and a check icon on the end edge, which
   * `rightSlot` replaces. The message is linked as the description and
   * announced politely when it appears. `error` wins when both are set.
   */
  success?: string;
  /**
   * Height and text size, aligned on Button's. Default `md`. Replaces the native
   * `size` attribute (a character count), which is omitted from the props.
   */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label, `required` and `aria-required` on the input. */
  required?: boolean;
  /** Optional icon at the start edge (lucide-react). Ignored when `prefix` is set. */
  icon?: ElementType;
  /**
   * Draws an alert icon on the end edge while `error` is set, so the state
   * doesn't rest on the border color alone. Default `false`. Ignored when
   * `rightSlot` is set.
   */
  errorIcon?: boolean;
  /**
   * Shows a value that can't be edited: a muted surface instead of the white
   * one. Unlike `disabled`, the field stays focusable and is submitted.
   */
  readOnly?: boolean;
  /** Optional slot on the end edge — e.g. unit suffix, validation pill. Ignored when `suffix` is set. */
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
  success,
  size = 'md',
  required,
  icon: Icon,
  errorIcon = false,
  readOnly,
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
  // HTML keeps `dir="auto"` off password fields, so how a hidden value aligns says nothing of
  // what is typed: it keeps the page's direction until it is shown.
  const plaintext = rest.type !== 'password' && FIELD_PLAINTEXT;
  const inputId = id ?? rest.name ?? generatedId;
  const descId = `${inputId}-desc`;
  const successText = error ? undefined : success || undefined;
  const hasDesc = !!(error || successText || description);
  const controlProps = {
    readOnly,
    'aria-describedby': hasDesc ? descId : undefined,
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
    required,
  };
  const showErrorIcon = errorIcon && !!error && !rightSlot;
  const showSuccessIcon = !!successText && !rightSlot;
  // The state icon of the end edge: the alert while in error, the check on success.
  const StateIcon = showErrorIcon ? CircleAlert : showSuccessIcon ? CircleCheck : null;
  const stateIconColor = showErrorIcon
    ? 'text-red-600 dark:text-red-400'
    : 'text-green-600 dark:text-green-400';
  const hasGroup = prefix !== undefined || suffix !== undefined;
  const addon = clsx(
    'flex shrink-0 items-center border-inherit bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400',
    FIELD_PAD_X[size]
  );

  return (
    <div className="block">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {required ? (
            <span>
              {label}
              <RequiredMark />
            </span>
          ) : (
            label
          )}
          {labelTrailing}
        </label>
      )}
      {hasGroup ? (
        <div
          className={clsx(
            'flex w-full items-stretch overflow-hidden',
            fieldClass({ size, invalid: !!error, success: !!successText, within: true, readOnly })
          )}
        >
          {prefix !== undefined && (
            <span className={clsx(addon, 'border-e')}>
              <bdi>{prefix}</bdi>
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            {...controlProps}
            className={clsx(
              'h-full min-w-0 flex-1 border-0 bg-transparent text-gray-900 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white',
              FIELD_PAD_X[size],
              FIELD_PLACEHOLDER,
              plaintext,
              className
            )}
            {...rest}
          />
          {StateIcon && (
            <StateIcon
              aria-hidden
              className={clsx('my-auto me-3 shrink-0', stateIconColor, FIELD_ICON_SIZE[size])}
            />
          )}
          {suffix !== undefined && (
            <span className={clsx(addon, 'border-s')}>
              <bdi>{suffix}</bdi>
            </span>
          )}
        </div>
      ) : (
        <div className={clsx('relative inline-flex w-full items-center', FIELD_HEIGHT[size])}>
          {Icon && (
            <Icon
              aria-hidden
              className={clsx(
                'pointer-events-none absolute text-gray-400',
                FIELD_ICON_START[size],
                FIELD_ICON_SIZE[size]
              )}
            />
          )}
          <input
            ref={ref}
            id={inputId}
            {...controlProps}
            className={clsx(
              'h-full w-full',
              fieldClass({
                size,
                invalid: !!error,
                success: !!successText,
                readOnly,
                fixedHeight: false,
              }),
              FIELD_PLACEHOLDER,
              plaintext,
              Icon ? FIELD_PAD_START_ICON[size] : FIELD_PAD_START[size],
              rightSlot ? 'pe-16' : StateIcon ? FIELD_PAD_END_ICON[size] : FIELD_PAD_END[size],
              className
            )}
            {...rest}
          />
          {StateIcon && (
            <StateIcon
              aria-hidden
              className={clsx(
                'pointer-events-none absolute',
                stateIconColor,
                FIELD_ICON_END[size],
                FIELD_ICON_SIZE[size]
              )}
            />
          )}
          {rightSlot && (
            <span className="inset-e-3 pointer-events-none absolute text-xs text-gray-500 dark:text-gray-400">
              {rightSlot}
            </span>
          )}
        </div>
      )}
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
