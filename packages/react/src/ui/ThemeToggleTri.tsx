import { clsx } from 'clsx';
import { Monitor, Moon, MoonStar, Sun } from 'lucide-react';
import type { ComponentType, ComponentPropsWithRef } from 'react';

export type ThemeToggleTriSize = 'sm' | 'md';
export type ThemeMode = 'light' | 'dark' | 'deep-blue';
/** What the toggle can hold once `system` is on: a mode, or `system` to follow the OS. */
export type ThemeModeChoice = ThemeMode | 'system';

export type ThemeToggleTriProps<T extends ThemeModeChoice = ThemeMode> = Omit<
  ComponentPropsWithRef<'button'>,
  'onClick' | 'onChange'
> & {
  /** Current theme (`'system'` with the `system` prop: then type the state as `ThemeModeChoice`). */
  theme: T;
  /**
   * Called with the next theme in the cycle (light → dark → deep-blue → light, with `system`:
   * light → dark → deep-blue → system → light).
   */
  onChange: (next: T) => void;
  /**
   * Adds `system` to the cycle, after deep blue: the theme follows `prefers-color-scheme`.
   * `applyAppearance` resolves it. Default `false`.
   */
  system?: boolean;
  /** Visual size. `md` (default) = 40px, `sm` = 32px. */
  size?: ThemeToggleTriSize;
  /** Label used when the next click will switch to light mode. */
  lightLabel?: string;
  /** Label used when the next click will switch to dark mode. */
  darkLabel?: string;
  /** Label used when the next click will switch to deep blue mode. */
  deepBlueLabel?: string;
  /** Label used when the next click will switch to the system theme. */
  systemLabel?: string;
};

const SIZE_CLASS: Record<ThemeToggleTriSize, { box: string; icon: string }> = {
  sm: { box: 'h-ctrl-32 w-ctrl-32', icon: 'h-4 w-4' },
  md: { box: 'h-ctrl-40 w-ctrl-40', icon: 'h-5 w-5' },
};

const TRI_ORDER: readonly ThemeModeChoice[] = ['light', 'dark', 'deep-blue'];
const TRI_ORDER_WITH_SYSTEM: readonly ThemeModeChoice[] = [...TRI_ORDER, 'system'];

const nextInCycle = (current: ThemeModeChoice, system: boolean): ThemeModeChoice => {
  const order = system ? TRI_ORDER_WITH_SYSTEM : TRI_ORDER;
  return order[(order.indexOf(current) + 1) % order.length];
};

// Each icon represents the *current* theme so the user knows what's active.
const ICON_FOR: Record<ThemeModeChoice, ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  'deep-blue': MoonStar,
  system: Monitor,
};

/**
 * ThemeToggleTri — icon button that cycles light → dark → deep-blue, then `system` when that
 * prop is set. It is
 * controlled: a click calls `onChange` with the next mode and changes nothing
 * else, so apply the theme there (for example with `applyAppearance`). To
 * offer all four themes, sand included, use `AppearanceSettings`.
 */
export function ThemeToggleTri<T extends ThemeModeChoice = ThemeMode>({
  theme,
  onChange,
  system = false,
  size = 'md',
  lightLabel = 'Switch to light mode',
  darkLabel = 'Switch to dark mode',
  deepBlueLabel = 'Switch to deep blue mode',
  systemLabel = 'Switch to system theme',
  className,
  ref,
  ...rest
}: ThemeToggleTriProps<T>) {
  // The cycle only holds modes of T: `theme` is one, and `system` adds the one T must allow.
  const next = nextInCycle(theme, system) as T;
  const labels: Record<ThemeModeChoice, string> = {
    light: lightLabel,
    dark: darkLabel,
    'deep-blue': deepBlueLabel,
    system: systemLabel,
  };
  const label = labels[next];
  const Icon = ICON_FOR[theme as ThemeModeChoice];
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
