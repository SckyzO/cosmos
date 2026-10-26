import { clsx } from 'clsx';
import type { ElementType, ReactNode, Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { onRadioGroupKeyDown, radioTabIndex } from './radioGroupA11y';
import { useControllableState } from '../hooks/useControllableState';

export type SegmentOption<T extends string> = {
  label: string;
  value: T;
  icon?: ElementType;
  /**
   * A count or short text in a small pill after the label. It is part of the radio's accessible
   * name ("Active 4").
   */
  badge?: ReactNode;
};

export type SegmentedControlProps<T extends string> = FieldA11yProps & {
  options: SegmentOption<T>[];
  /** Selected value, when controlled. */
  value?: T;
  /** Initial value, when uncontrolled. None selected when omitted. */
  defaultValue?: T;
  onChange?: (v: T) => void;
  /**
   * `segments` (default) is a bordered row of joined segments. `pills` is a
   * rounded track holding separate pills, the selected one filled with the
   * accent.
   */
  appearance?: 'segments' | 'pills';
  /** Height and text size: `md` (default) or the more compact `sm`. */
  size?: 'sm' | 'md';
  /** Icon shown in a cell before the first option, for the whole group. */
  icon?: ElementType;
  /**
   * Stretch the group to fill its parent (`flex w-full`). Default `false`: the
   * group sizes to its options.
   */
  fullWidth?: boolean;
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
  appearance = 'segments',
  size = 'md',
  icon: GroupIcon,
  fullWidth = false,
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
  const pills = appearance === 'pills';
  const sm = size === 'sm';
  return (
    <div
      role="radiogroup"
      {...fieldA11y}
      onKeyDown={onRadioGroupKeyDown}
      className={clsx(
        fullWidth ? 'flex w-full' : 'inline-flex',
        'overflow-hidden rounded-lg border',
        pills
          ? clsx('items-center gap-1 border-[var(--color-border)]', sm ? 'h-8' : 'h-9')
          : 'border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {GroupIcon && (
        <span
          aria-hidden="true"
          className={clsx(
            'flex items-center self-stretch border-r bg-gray-50 dark:bg-gray-800/60',
            pills
              ? 'border-[var(--color-border)] px-2.5'
              : 'border-gray-200 px-3 dark:border-gray-700'
          )}
        >
          <GroupIcon
            className={clsx(
              'shrink-0 text-gray-400 dark:text-gray-500',
              pills || sm ? 'h-3.5 w-3.5' : 'h-4 w-4'
            )}
          />
        </span>
      )}
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
              'flex items-center gap-1.5 font-medium transition-colors focus-visible:ring-inset',
              pills
                ? clsx(
                    'rounded-md text-xs first-of-type:ml-1.5 last-of-type:mr-1.5',
                    sm ? 'h-6 px-2.5' : 'h-7 px-3'
                  )
                : clsx(
                    sm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
                    i > 0 && 'border-l border-gray-200 dark:border-gray-700'
                  ),
              isActive
                ? 'bg-brand-500 focus-visible:focus-indicator-on-accent text-white'
                : clsx(
                    'focus-visible:focus-indicator',
                    pills
                      ? 'text-[var(--color-text-muted)] hover:bg-gray-100 dark:hover:bg-white/5'
                      : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                  )
            )}
          >
            {Icon && <Icon className={sm ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
            {opt.label}
            {opt.badge !== undefined && (
              <span
                className={clsx(
                  'text-3xs rounded-full px-1.5 py-0.5 font-bold',
                  // The active segment is filled with the accent: a darker veil keeps white text
                  // above 4.5:1, which a lighter one does not.
                  isActive
                    ? 'bg-black/20 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
