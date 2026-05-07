import { clsx } from 'clsx';
import type { ElementType } from 'react';

export type FilterOption<T extends string = string> = { label: string; value: T };

export type FilterPillsProps<T extends string = string> = {
  options: FilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
  icon?: ElementType;
  className?: string;
};

export const FilterPills = <T extends string = string>({
  options,
  value,
  onChange,
  icon: Icon,
  className,
}: FilterPillsProps<T>) => (
  <div
    className={clsx(
      'flex h-9 items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700',
      className
    )}
  >
    {Icon && (
      <span className="flex h-full items-center border-r border-gray-200 bg-gray-50 px-2.5 dark:border-gray-700 dark:bg-gray-800/60">
        <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
      </span>
    )}
    <div className="flex items-center gap-1 px-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
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
      ))}
    </div>
  </div>
);
