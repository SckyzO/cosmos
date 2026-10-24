import { clsx } from 'clsx';
import type { ElementType, Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { onRadioGroupKeyDown, radioTabIndex } from './radioGroupA11y';
import { useControllableState } from '../hooks/useControllableState';

export type SegmentOption<T extends string> = {
  label: string;
  value: T;
  icon?: ElementType;
};

export type SegmentedControlProps<T extends string> = FieldA11yProps & {
  options: SegmentOption<T>[];
  /** Selected value, when controlled. */
  value?: T;
  /** Initial value, when uncontrolled. None selected when omitted. */
  defaultValue?: T;
  onChange?: (v: T) => void;
  className?: string;
  /**
   * Ref to the segment `<button>` that is the group's tab stop: the selected
   * one, or the first when none is. It follows the selection.
   */
  ref?: Ref<HTMLButtonElement>;
};

export const SegmentedControl = <T extends string>({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  className,
  ref,
  ...a11y
}: SegmentedControlProps<T>) => {
  const fieldA11y = useFieldA11y(a11y);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'SegmentedControl.value',
  });
  const anyChecked = options.some((opt) => opt.value === value);
  return (
    <div
      role="radiogroup"
      {...fieldA11y}
      onKeyDown={onRadioGroupKeyDown}
      className={clsx(
        'inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {options.map((opt, i) => {
        const Icon = opt.icon;
        const isActive = opt.value === value;
        const tabIndex = radioTabIndex(isActive, i, anyChecked);
        return (
          <button
            key={opt.value}
            ref={tabIndex === 0 ? ref : undefined}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={tabIndex}
            onClick={() => setValue(opt.value)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
              i > 0 && 'border-l border-gray-200 dark:border-gray-700',
              isActive
                ? 'bg-brand-500 text-white'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
