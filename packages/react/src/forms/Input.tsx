import { clsx } from 'clsx';
import { CircleAlert } from 'lucide-react';
import { useId } from 'react';
import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react';
import {
  FIELD_HEIGHT,
  FIELD_ICON_LEFT,
  FIELD_ICON_RIGHT,
  FIELD_ICON_SIZE,
  FIELD_PAD_LEFT,
  FIELD_PAD_LEFT_ICON,
  FIELD_PAD_RIGHT,
  FIELD_PAD_RIGHT_ICON,
  FIELD_PAD_X,
  FIELD_PLACEHOLDER,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { RequiredMark } from './RequiredMark';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  label?: string;
  description?: string;
  error?: string;
  /**
   * Height and text size, aligned on Button's. Default `md`. Replaces the native
   * `size` attribute (a character count), which is omitted from the props.
   */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label, `required` and `aria-required` on the input. */
  required?: boolean;
  /** Optional left icon (lucide-react). Ignored when `prefix` is set. */
  icon?: ElementType;
  /**
   * Draws an alert icon on the right edge while `error` is set, so the state
   * doesn't rest on the border color alone. Default `false`. Ignored when
   * `rightSlot` is set.
   */
  errorIcon?: boolean;
  /**
   * Shows a value that can't be edited: a muted surface instead of the white
   * one. Unlike `disabled`, the field stays focusable and is submitted.
   */
  readOnly?: boolean;
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
  const inputId = id ?? rest.name ?? generatedId;
  const descId = `${inputId}-desc`;
  const hasDesc = !!(error || description);
  const controlProps = {
    readOnly,
    'aria-describedby': hasDesc ? descId : undefined,
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
    required,
  };
  const showErrorIcon = errorIcon && !!error && !rightSlot;
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
            fieldClass({ size, invalid: !!error, within: true, readOnly })
          )}
        >
          {prefix !== undefined && <span className={clsx(addon, 'border-r')}>{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            {...controlProps}
            className={clsx(
              'h-full min-w-0 flex-1 border-0 bg-transparent text-gray-900 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white',
              FIELD_PAD_X[size],
              FIELD_PLACEHOLDER,
              className
            )}
            {...rest}
          />
          {showErrorIcon && (
            <CircleAlert
              aria-hidden
              className={clsx(
                'my-auto mr-3 shrink-0 text-red-600 dark:text-red-400',
                FIELD_ICON_SIZE[size]
              )}
            />
          )}
          {suffix !== undefined && <span className={clsx(addon, 'border-l')}>{suffix}</span>}
        </div>
      ) : (
        <div className={clsx('relative inline-flex w-full items-center', FIELD_HEIGHT[size])}>
          {Icon && (
            <Icon
              aria-hidden
              className={clsx(
                'pointer-events-none absolute text-gray-400',
                FIELD_ICON_LEFT[size],
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
              fieldClass({ size, invalid: !!error, readOnly, fixedHeight: false }),
              FIELD_PLACEHOLDER,
              Icon ? FIELD_PAD_LEFT_ICON[size] : FIELD_PAD_LEFT[size],
              rightSlot
                ? 'pr-16'
                : showErrorIcon
                  ? FIELD_PAD_RIGHT_ICON[size]
                  : FIELD_PAD_RIGHT[size],
              className
            )}
            {...rest}
          />
          {showErrorIcon && (
            <CircleAlert
              aria-hidden
              className={clsx(
                'pointer-events-none absolute text-red-600 dark:text-red-400',
                FIELD_ICON_RIGHT[size],
                FIELD_ICON_SIZE[size]
              )}
            />
          )}
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
