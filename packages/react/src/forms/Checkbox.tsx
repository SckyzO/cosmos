import { clsx } from 'clsx';
import { Check, Minus } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export type CheckboxSize = 'sm' | 'md';

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'onChange' | 'children'
> & {
  label?: ReactNode;
  description?: string;
  /** Called with the next checked state. */
  onChange?: (checked: boolean, e: ChangeEvent<HTMLInputElement>) => void;
  /** When true, renders the indeterminate (minus) icon. Overrides `checked` visually. */
  indeterminate?: boolean;
  size?: CheckboxSize;
};

const SIZE_CLASS: Record<CheckboxSize, { box: string; icon: string; label: string }> = {
  sm: { box: 'h-4 w-4', icon: 'h-3 w-3', label: 'text-xs' },
  md: { box: 'h-[18px] w-[18px]', icon: 'h-3.5 w-3.5', label: 'text-sm' },
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    description,
    checked,
    defaultChecked,
    indeterminate = false,
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
  const fieldId = id ?? rest.name ?? generatedId;
  const innerRef = useRef<HTMLInputElement>(null);
  const setRef = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked ?? false);
  const isChecked = isControlled ? !!checked : internalChecked;
  const showFilled = isChecked || indeterminate;

  // Sync the native indeterminate flag (no DOM API exposed via JSX).
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

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
          ref={setRef}
          id={fieldId}
          type="checkbox"
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
            'peer-focus-visible:ring-brand-500/40 relative flex items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2',
            sizes.box,
            showFilled
              ? 'border-brand-500 bg-brand-500'
              : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
          )}
        >
          {/* Always render both icons; toggle visibility via opacity to keep
              the box's intrinsic baseline stable (prevents text from
              shifting when checked/unchecked). */}
          <Check
            className={clsx(
              'block text-white transition-opacity',
              sizes.icon,
              isChecked && !indeterminate ? 'opacity-100' : 'opacity-0'
            )}
          />
          {indeterminate && <Minus className={clsx('absolute block text-white', sizes.icon)} />}
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

// ── CheckboxGroup ────────────────────────────────────────────────────────────

export type CheckboxGroupOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type CheckboxGroupProps = {
  legend?: string;
  description?: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  options: CheckboxGroupOption[];
  orientation?: 'vertical' | 'horizontal';
  error?: string;
  /** Shared `name` attribute for all checkboxes. */
  name?: string;
  size?: CheckboxSize;
  className?: string;
};

export const CheckboxGroup = ({
  legend,
  description,
  value,
  defaultValue = [],
  onChange,
  options,
  orientation = 'vertical',
  error,
  name,
  size = 'md',
  className,
}: CheckboxGroupProps) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const current = isControlled ? value : internalValue;

  const toggle = (v: string) => {
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
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
          <Checkbox
            key={opt.value}
            label={opt.label}
            description={opt.description}
            disabled={opt.disabled}
            name={name}
            value={opt.value}
            size={size}
            checked={current.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </fieldset>
  );
};
