import { clsx } from 'clsx';
import type { Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { useControllableState } from '../hooks/useControllableState';
import type { Intent } from '../ui/intent';

export type ToggleSize = 'sm' | 'md' | 'lg';

/** The colour of the lit track: the accent, or a meaning from the shared `Intent` vocabulary. */
export type ToggleIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger'>;

// Track and thumb: the thumb sits 2px from every edge of the track, on or off, so it travels the
// track's width minus the thumb's and minus 4px: to the right in left to right, to the left in
// right to left, where it starts on the right.
const SIZE_CLASSES: Record<
  ToggleSize,
  { gap: string; track: string; thumb: string; thumbOn: string; hit: string }
> = {
  md: {
    gap: 'gap-3',
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    thumbOn: 'translate-x-5 rtl:-translate-x-5',
    hit: '',
  },
  // A 20px track is under the 24px pointer target of WCAG 2.5.8: an invisible 2px on each side
  // brings the hit area to 24px.
  sm: {
    gap: 'gap-2',
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    thumbOn: 'translate-x-4 rtl:-translate-x-4',
    hit: 'before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-[""]',
  },
  // For a settings page: a 28px track clears the 24px pointer target by itself.
  lg: {
    gap: 'gap-4',
    track: 'h-7 w-[52px]',
    thumb: 'h-6 w-6',
    thumbOn: 'translate-x-6 rtl:-translate-x-6',
    hit: '',
  },
};

// The lit track. A switch asks 3:1 of its track against the page (WCAG 1.4.11), and the white
// thumb on it needs the same: green and amber at 500 or 600 fall under it on the light themes (the
// sand page makes amber-600 2.96:1), so they take a darker shade there and the 600 on the dark
// themes. The unlit track is gray whatever the intent.
const TRACK_ON: Record<ToggleIntent, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-700 dark:bg-green-600',
  warning: 'bg-amber-700 dark:bg-amber-600',
  danger: 'bg-red-600',
};

export type ToggleProps = FieldA11yProps & {
  /** Checked state, when controlled. */
  checked?: boolean;
  /** Initial checked state, when uncontrolled. Default `false`. */
  defaultChecked?: boolean;
  /** Called with the state to move to. */
  onChange?: (checked: boolean) => void;
  /**
   * `md` (default) is a 44×24 track; `sm` a 36×20 one, `lg` a 52×28 one for a settings page. The
   * label stays in the same `<label>`.
   */
  size?: ToggleSize;
  /** The colour of the track while on. Default `brand`. The track is gray while off, whatever it is. */
  intent?: ToggleIntent;
  /**
   * Which side of the switch the label sits on. `start` puts it before the switch, which then
   * rests on the end edge of the row: the layout of a settings list. Follows the reading
   * direction. Default `end`.
   */
  labelPosition?: 'start' | 'end';
  /**
   * With `name`, the field a native form posts: `value` while the switch is on, nothing while it
   * is off or disabled, as a checkbox does. Default `on`.
   */
  name?: string;
  value?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  /** Ref to the switch `<button role="switch">`, the element to focus on a validation error. */
  ref?: Ref<HTMLButtonElement>;
};

export const Toggle = ({
  checked: checkedProp,
  defaultChecked = false,
  onChange,
  size = 'md',
  intent = 'brand',
  labelPosition = 'end',
  name,
  value = 'on',
  disabled = false,
  label,
  description,
  ref,
  ...a11y
}: ToggleProps) => {
  const sizeClasses = SIZE_CLASSES[size];
  const fieldA11y = useFieldA11y(a11y, { ownLabel: !!label });
  const [checked, setChecked] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange,
    name: 'Toggle.checked',
  });
  // aria-disabled marks the dimmed label as part of an inactive control, whose
  // text WCAG 1.4.3 exempts from contrast: axe doesn't see a disabled
  // role="switch" button as a label's control.
  return (
    <label
      aria-disabled={disabled || undefined}
      className={clsx(
        'flex items-center',
        labelPosition === 'start' && 'flex-row-reverse',
        sizeClasses.gap,
        disabled && 'opacity-50'
      )}
    >
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        {...fieldA11y}
        disabled={disabled}
        onClick={() => !disabled && setChecked(!checked)}
        className={clsx(
          'focus-visible:focus-indicator relative shrink-0 rounded-full transition-colors',
          sizeClasses.track,
          sizeClasses.hit,
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          checked ? TRACK_ON[intent] : 'bg-gray-500 dark:bg-gray-400'
        )}
      >
        <span
          className={clsx(
            'inset-s-0.5 absolute top-0.5 rounded-full bg-white shadow transition-transform',
            sizeClasses.thumb,
            checked ? sizeClasses.thumbOn : 'translate-x-0'
          )}
        />
      </button>
      {name && checked && !disabled && <input type="hidden" name={name} value={value} />}
      {(label || description) && (
        <span className="min-w-0 flex-1">
          {label && (
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {description && (
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
};
