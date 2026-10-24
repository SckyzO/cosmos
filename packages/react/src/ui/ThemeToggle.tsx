import { clsx } from 'clsx';
import { Moon, Sun } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

export type ThemeToggleSize = 'sm' | 'md';

export type ThemeToggleProps = Omit<ComponentPropsWithRef<'button'>, 'onClick' | 'onChange'> & {
  /** Current theme state. `true` = dark mode active (Sun shown to switch back to light). */
  isDark: boolean;
  /** Called when the user toggles the theme, with the next value of `isDark`. */
  onChange: (isDark: boolean) => void;
  /** Visual size. `md` (default) = 40px, `sm` = 32px. */
  size?: ThemeToggleSize;
  /** Override the button title (also used as aria-label). */
  lightLabel?: string;
  darkLabel?: string;
};

const SIZE_CLASS: Record<ThemeToggleSize, { box: string; icon: string }> = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5' },
};

export function ThemeToggle({
  isDark,
  onChange,
  size = 'md',
  lightLabel = 'Switch to light mode',
  darkLabel = 'Switch to dark mode',
  className,
  ref,
  ...rest
}: ThemeToggleProps) {
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? lightLabel : darkLabel;
  const { box, icon } = SIZE_CLASS[size];
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onChange(!isDark)}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={clsx(
        'focus-visible:focus-indicator flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
        box,
        className
      )}
      {...rest}
    >
      <Icon className={icon} aria-hidden />
    </button>
  );
}
