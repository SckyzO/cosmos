import { clsx } from 'clsx';
import { useId, useRef, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useAutoGrow } from '../hooks/useAutoGrow';
import { useControllableState } from '../hooks/useControllableState';
import { mergeRefs } from '../ui/mergeRefs';
import {
  FIELD_PAD_X,
  FIELD_PAD_Y,
  FIELD_PLACEHOLDER,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { RequiredMark } from './RequiredMark';

export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export type TextareaProps = ComponentPropsWithRef<'textarea'> & {
  label?: string;
  description?: string;
  error?: string;
  /** Text size and padding, aligned on Button's. Default `md`. The height follows `rows`. */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label, `required` and `aria-required` on the textarea. */
  required?: boolean;
  /** Slot rendered next to the label text (e.g. a TooltipHelp). */
  labelTrailing?: ReactNode;
  /** Resize behaviour. Default `vertical`; with `autoResize` the handle goes and this is ignored. */
  resize?: TextareaResize;
  /**
   * Grow with the content: `rows` becomes the minimum height, and the field scrolls past `maxRows`
   * (never, by default). Default `false`.
   */
  autoResize?: boolean;
  /** With `autoResize`, the number of rows the field grows to before it scrolls. */
  maxRows?: number;
  /** Show a `<used> / <max>` counter below the field. Default: auto when `maxLength` is set. */
  showCount?: boolean;
};

const RESIZE_CLASS: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export function Textarea({
  label,
  description,
  error,
  size = 'md',
  required,
  labelTrailing,
  resize = 'vertical',
  autoResize = false,
  maxRows,
  showCount,
  rows = 4,
  maxLength,
  className,
  id,
  value,
  defaultValue,
  onChange,
  ref,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? rest.name ?? generatedId;
  // Tracks the text for the counter; the native field keeps its own value and default.
  const [currentValue, setCurrentValue] = useControllableState({
    value: value === undefined ? undefined : String(value ?? ''),
    defaultValue: typeof defaultValue === 'string' ? defaultValue : '',
    onChange: (_text: string, e: ChangeEvent<HTMLTextAreaElement>) => onChange?.(e),
    name: 'Textarea.value',
  });
  const inner = useRef<HTMLTextAreaElement | null>(null);
  useAutoGrow(inner, { value: currentValue, enabled: autoResize, maxRows });
  const counterEnabled = showCount ?? maxLength !== undefined;
  const overLimit = maxLength !== undefined && currentValue.length > maxLength;
  const descId = `${fieldId}-desc`;
  const hasDesc = !!(error || description);

  return (
    <div className="block">
      {label && (
        <label
          htmlFor={fieldId}
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
      <textarea
        ref={mergeRefs(inner, ref)}
        id={fieldId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => setCurrentValue(e.target.value, e)}
        aria-describedby={hasDesc ? descId : undefined}
        aria-invalid={error || overLimit ? true : undefined}
        aria-required={required || undefined}
        required={required}
        className={clsx(
          'block w-full',
          fieldClass({ size, invalid: !!(error || overLimit), fixedHeight: false }),
          FIELD_PAD_X[size],
          FIELD_PAD_Y[size],
          FIELD_PLACEHOLDER,
          RESIZE_CLASS[autoResize ? 'none' : resize],
          className
        )}
        {...rest}
      />
      <div className="mt-1 flex items-start justify-between gap-2">
        <span
          id={descId}
          className={clsx(
            'block min-h-[1rem] text-xs',
            error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? description ?? ''}
        </span>
        {counterEnabled && (
          <span
            aria-live="polite"
            className={clsx(
              'shrink-0 font-mono text-xs tabular-nums',
              overLimit ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {currentValue.length}
            {maxLength !== undefined && <> / {maxLength}</>}
          </span>
        )}
      </div>
    </div>
  );
}
