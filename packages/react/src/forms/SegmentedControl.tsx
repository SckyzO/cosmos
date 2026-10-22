import { clsx } from 'clsx';
import type { ElementType } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { onRadioGroupKeyDown, radioTabIndex } from './radioGroupA11y';

export type SegmentOption<T extends string> = {
  label: string;
  value: T;
  icon?: ElementType;
};

export type SegmentedControlProps<T extends string> = FieldA11yProps & {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
};

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  className,
  ...a11y
}: SegmentedControlProps<T>) => {
  const fieldA11y = useFieldA11y(a11y);
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
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={radioTabIndex(isActive, i, anyChecked)}
            onClick={() => onChange(opt.value)}
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
