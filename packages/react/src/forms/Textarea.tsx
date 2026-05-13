import { clsx } from 'clsx';
import {
  forwardRef,
  useId,
  useState,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  description?: string;
  error?: string;
  /** Slot rendered next to the label text (e.g. a TooltipHelp). */
  labelTrailing?: ReactNode;
  /** Resize behaviour. Default `vertical`. */
  resize?: TextareaResize;
  /** Show a `<used> / <max>` counter below the field. Default: auto when `maxLength` is set. */
  showCount?: boolean;
};

const RESIZE_CLASS: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    description,
    error,
    labelTrailing,
    resize = 'vertical',
    showCount,
    rows = 4,
    maxLength,
    className,
    id,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? rest.name ?? generatedId;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    typeof defaultValue === 'string' ? defaultValue : '',
  );
  const currentValue = isControlled ? String(value ?? '') : internalValue;
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
          {label}
          {labelTrailing}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          if (!isControlled) setInternalValue(e.target.value);
          onChange?.(e);
        }}
        aria-describedby={hasDesc ? descId : undefined}
        aria-invalid={error || overLimit ? true : undefined}
        className={clsx(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white',
          RESIZE_CLASS[resize],
          error || overLimit
            ? 'border-red-400 focus:border-red-500 dark:border-red-500/60'
            : 'focus:border-brand-500 border-gray-200 dark:border-gray-700',
          className,
        )}
        {...rest}
      />
      <div className="mt-1 flex items-start justify-between gap-2">
        <span
          id={descId}
          className={clsx(
            'block min-h-[1rem] text-xs',
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {error ?? description ?? ''}
        </span>
        {counterEnabled && (
          <span
            aria-live="polite"
            className={clsx(
              'shrink-0 font-mono text-xs tabular-nums',
              overLimit ? 'text-red-500' : 'text-gray-400 dark:text-gray-500',
            )}
          >
            {currentValue.length}
            {maxLength !== undefined && <> / {maxLength}</>}
          </span>
        )}
      </div>
    </div>
  );
});
