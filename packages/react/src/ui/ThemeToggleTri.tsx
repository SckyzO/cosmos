import { clsx } from 'clsx';
import { Moon, MoonStar, Sun } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ComponentType } from 'react';

export type ThemeToggleTriSize = 'sm' | 'md';
export type ThemeMode = 'light' | 'dark' | 'oled';

export type ThemeToggleTriProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'onChange'
> & {
  /** Current theme. */
  theme: ThemeMode;
  /** Called with the next theme in the cycle (light → dark → oled → light). */
  onChange: (next: ThemeMode) => void;
  /** Visual size. `md` (default) = 40px, `sm` = 32px. */
  size?: ThemeToggleTriSize;
  /** Label used when the next click will switch to light mode. */
  lightLabel?: string;
  /** Label used when the next click will switch to dark mode. */
  darkLabel?: string;
  /** Label used when the next click will switch to OLED mode. */
  oledLabel?: string;
};

const SIZE_CLASS: Record<ThemeToggleTriSize, { box: string; icon: string }> = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5' },
};

const TRI_ORDER: readonly ThemeMode[] = ['light', 'dark', 'oled'];

const nextInCycle = (current: ThemeMode): ThemeMode => {
  const idx = TRI_ORDER.indexOf(current);
  return TRI_ORDER[(idx + 1) % TRI_ORDER.length];
};

// Each icon represents the *current* theme so the user knows what's active.
const ICON_FOR: Record<ThemeMode, ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  oled: MoonStar,
};

export const ThemeToggleTri = forwardRef<HTMLButtonElement, ThemeToggleTriProps>(
  function ThemeToggleTri(
    {
      theme,
      onChange,
      size = 'md',
      lightLabel = 'Switch to light mode',
      darkLabel = 'Switch to dark mode',
      oledLabel = 'Switch to OLED mode',
      className,
      ...rest
    },
    ref,
  ) {
    const next = nextInCycle(theme);
    const label =
      next === 'light' ? lightLabel : next === 'dark' ? darkLabel : oledLabel;
    const Icon = ICON_FOR[theme];
    const { box, icon } = SIZE_CLASS[size];
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onChange(next)}
        title={label}
        aria-label={label}
        data-theme={theme}
        className={clsx(
          'flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
          box,
          className,
        )}
        {...rest}
      >
        <Icon className={icon} aria-hidden />
      </button>
    );
  },
);
