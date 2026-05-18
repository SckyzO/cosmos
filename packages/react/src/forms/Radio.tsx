import { clsx } from 'clsx';
import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export type RadioSize = 'sm' | 'md';

export type RadioProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'onChange' | 'children'
> & {
  label?: ReactNode;
  description?: string;
  /** Called with the next checked state (true when this radio becomes selected). */
  onChange?: (checked: boolean, e: ChangeEvent<HTMLInputElement>) => void;
  size?: RadioSize;
};

const SIZE_CLASS: Record<RadioSize, { box: string; dot: string; label: string }> = {
  sm: { box: 'h-4 w-4', dot: 'h-1.5 w-1.5', label: 'text-xs' },
  md: { box: 'h-[18px] w-[18px]', dot: 'h-2 w-2', label: 'text-sm' },
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    disabled,
    size = 'md',
    id,
    className,
    ...rest
  },
  forwardedRef
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked ?? false);
  const isChecked = isControlled ? !!checked : internalChecked;
  const sizes = SIZE_CLASS[size];

  return (
    <label
      htmlFor={fieldId}
      className={clsx(
        'inline-flex cursor-pointer items-start gap-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <span className="relative inline-flex shrink-0 items-center justify-center">
        <input
          ref={forwardedRef}
          id={fieldId}
          type="radio"
          checked={isControlled ? isChecked : undefined}
          defaultChecked={!isControlled ? defaultChecked : undefined}
          disabled={disabled}
          onChange={(e) => {
            if (!isControlled) setInternalChecked(e.target.checked);
            onChange?.(e.target.checked, e);
          }}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={clsx(
            'peer-focus-visible:ring-brand-500/40 flex items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-offset-gray-900',
            sizes.box,
            isChecked
              ? 'border-brand-500 bg-white dark:bg-gray-800'
              : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
          )}
        >
          {isChecked && <span className={clsx('bg-brand-500 rounded-full', sizes.dot)} />}
        </span>
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <span className={clsx('text-gray-700 dark:text-gray-300', sizes.label)}>{label}</span>
          )}
          {description && (
            <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</span>
          )}
        </span>
      )}
    </label>
  );
});

// ── RadioGroup ───────────────────────────────────────────────────────────────

export type RadioGroupOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  legend?: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: RadioGroupOption[];
  orientation?: 'vertical' | 'horizontal';
  error?: string;
  /** Shared `name` for the radios (auto-generated via useId if omitted). */
  name?: string;
  size?: RadioSize;
  className?: string;
};

export const RadioGroup = ({
  legend,
  description,
  value,
  defaultValue,
  onChange,
  options,
  orientation = 'vertical',
  error,
  name,
  size = 'md',
  className,
}: RadioGroupProps) => {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const current = isControlled ? value : internalValue;

  const select = (v: string) => {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
  };

  return (
    <fieldset className={clsx('block', className)}>
      {legend && (
        <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          {legend}
        </legend>
      )}
      {description && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <div className={clsx(orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2')}>
        {options.map((opt) => (
          <Radio
            key={opt.value}
            label={opt.label}
            description={opt.description}
            disabled={opt.disabled}
            name={groupName}
            value={opt.value}
            size={size}
            checked={current === opt.value}
            onChange={(checked) => {
              if (checked) select(opt.value);
            }}
          />
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </fieldset>
  );
};
