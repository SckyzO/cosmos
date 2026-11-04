import { clsx } from 'clsx';
import {
  useId,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactNode,
} from 'react';
import type { EditedField, FieldEdit } from './cardFormat';
import { useFieldA11y } from './fieldA11y';
import {
  FIELD_ICON_SIZE,
  FIELD_PAD_END,
  FIELD_PAD_START,
  FIELD_PLACEHOLDER,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { FieldMessage } from './FieldMessage';
import { RequiredMark } from './RequiredMark';

// What every card field takes besides its own value: the attributes of the `<input>` it draws,
// minus the ones a card field sets itself.
type CardInputAttributes = Omit<
  ComponentPropsWithRef<'input'>,
  | 'size'
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'inputMode'
  | 'autoComplete'
  | 'className'
  | 'children'
>;

export type CardFieldProps = CardInputAttributes & {
  label?: string;
  /** Helper text under the field. */
  description?: string;
  /** Error message, replaces `description`. The page decides when and with which words. */
  error?: string;
  /** Height and text size, aligned on Button's. Default `md`. */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label, `required` and `aria-required` on the input. */
  required?: boolean;
  /** Slot rendered next to the label text (e.g. a TooltipHelp). */
  labelTrailing?: ReactNode;
  /** Merged on the wrapper. */
  className?: string;
};

/**
 * The input the way the browser says it was edited: the value it holds, the caret, the text it
 * held before and, for a deletion, which way it went (`inputType`, absent on autofill).
 */
export const fieldEditOf = (e: ChangeEvent<HTMLInputElement>, previous: string): FieldEdit => {
  const { inputType = '' } = e.nativeEvent as InputEvent;
  const { value, selectionStart } = e.target;
  return {
    text: value,
    caret: selectionStart ?? value.length,
    previous,
    deletion: inputType.startsWith('delete')
      ? inputType.endsWith('Forward')
        ? 'forward'
        : 'backward'
      : undefined,
  };
};

/**
 * Writes the reformatted text into the input and puts the caret back where the edit left it: the
 * browser would send it to the end. The state that follows renders the same text, so React leaves
 * the value, and the caret, alone. A field that autofill filled without focusing it keeps no caret.
 */
export const showEdit = (input: HTMLInputElement, { text, caret }: EditedField) => {
  input.value = text;
  if (document.activeElement === input) input.setSelectionRange(caret, caret);
};

type CardFieldShellProps = CardFieldProps & {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputMode: 'numeric';
  autoComplete: 'cc-number' | 'cc-exp' | 'cc-csc';
  /** Decorative icon on the start edge. */
  icon?: ElementType;
  /** Inside the border, on the end edge: the brand pill. It describes the input too. */
  endSlot?: ReactNode;
};

/**
 * The frame the three card fields share: label, one border around the input and what sits inside
 * it, and the helper or error under it, all from the field recipe. A card number, an expiry and a
 * code read left to right in any page, so the field is a `dir="ltr"` island (the label and the
 * message keep the page's side), as PhoneInput's is.
 */
export const CardField = ({
  label,
  description,
  error,
  size = 'md',
  required,
  labelTrailing,
  className,
  icon: Icon,
  endSlot,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  disabled,
  readOnly,
  ref,
  ...rest
}: CardFieldShellProps) => {
  const generatedId = useId();
  const a11y = useFieldA11y(
    {
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': labelledBy,
      'aria-describedby': describedBy,
    },
    { ownLabel: !!label }
  );
  const inputId = a11y.id ?? generatedId;
  const endId = `${inputId}-end`;
  const descId = `${inputId}-desc`;
  const helper = error || description;
  const describedByIds =
    [a11y['aria-describedby'], endSlot ? endId : undefined, helper ? descId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={clsx('block', className)}>
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
      <div
        dir="ltr"
        className={clsx(
          'flex w-full items-center overflow-hidden',
          fieldClass({ size, invalid: !!error, within: true, readOnly }),
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {Icon && (
          <Icon
            aria-hidden
            className={clsx(
              'ms-3 shrink-0 text-gray-500 dark:text-gray-400',
              FIELD_ICON_SIZE[size]
            )}
          />
        )}
        <input
          ref={ref}
          {...rest}
          id={inputId}
          type="text"
          spellCheck={false}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-label={a11y['aria-label']}
          aria-labelledby={a11y['aria-labelledby']}
          aria-describedby={describedByIds}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          className={clsx(
            'h-full min-w-0 flex-1 border-0 bg-transparent text-gray-900 tabular-nums focus:ring-0 focus:outline-none disabled:cursor-not-allowed dark:text-white',
            Icon ? 'ps-2.5' : FIELD_PAD_START[size],
            FIELD_PAD_END[size],
            FIELD_PLACEHOLDER
          )}
        />
        {endSlot && (
          <span id={endId} className="me-2 flex shrink-0 items-center">
            {endSlot}
          </span>
        )}
      </div>
      <FieldMessage
        show={!!helper}
        id={descId}
        className={clsx(
          'mt-1 block text-xs',
          error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}
      >
        {helper}
      </FieldMessage>
    </div>
  );
};
