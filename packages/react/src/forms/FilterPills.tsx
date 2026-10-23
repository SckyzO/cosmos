import { clsx } from 'clsx';
import type { ElementType, Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { onRadioGroupKeyDown, radioTabIndex } from './radioGroupA11y';

export type FilterOption<T extends string = string> = { label: string; value: T };

export type FilterPillsProps<T extends string = string> = FieldA11yProps & {
  options: FilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
  icon?: ElementType;
  /**
   * Stretch the pill group to fill its parent (`flex w-full`). Default
   * `false` — the group sizes to its content (pill labels + optional icon).
   */
  fullWidth?: boolean;
  className?: string;
  /**
   * Ref to the pill `<button>` that is the group's tab stop: the selected one,
   * or the first when none is. It follows the selection.
   */
  ref?: Ref<HTMLButtonElement>;
};

export const FilterPills = <T extends string = string>({
  options,
  value,
  onChange,
  icon: Icon,
  fullWidth = false,
  className,
  ref,
  ...a11y
}: FilterPillsProps<T>) => {
  const fieldA11y = useFieldA11y(a11y);
  const anyChecked = options.some((opt) => opt.value === value);
  return (
    <div
      className={clsx(
        fullWidth ? 'flex w-full' : 'inline-flex',
        'h-9 items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {Icon && (
        <span className="flex h-full items-center border-r border-gray-200 bg-gray-50 px-2.5 dark:border-gray-700 dark:bg-gray-800/60">
          <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        </span>
      )}
      <div
        role="radiogroup"
        {...fieldA11y}
        onKeyDown={onRadioGroupKeyDown}
        className="flex items-center gap-1 px-1.5"
      >
        {options.map((opt, i) => {
          const tabIndex = radioTabIndex(value === opt.value, i, anyChecked);
          return (
            <button
              key={opt.value}
              ref={tabIndex === 0 ? ref : undefined}
              type="button"
              role="radio"
              aria-checked={value === opt.value}
              tabIndex={tabIndex}
              onClick={() => onChange(opt.value)}
              className={clsx(
                'flex h-7 items-center rounded-md px-3 text-xs font-medium transition-colors',
                value === opt.value
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
