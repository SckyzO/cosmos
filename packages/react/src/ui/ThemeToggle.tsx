import { clsx } from 'clsx';
import { Monitor, Moon, MoonStar, Sun, Sunset, type LucideIcon } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { COSMOS_THEMES, type CosmosThemeChoice } from '../settings/appearance';

export type ThemeToggleSize = 'sm' | 'md';

export type ThemeToggleProps<T extends CosmosThemeChoice = CosmosThemeChoice> = Omit<
  ComponentPropsWithRef<'button'>,
  'onClick' | 'onChange'
> & {
  /** The current theme. `system` is a choice like the others: type the state as `CosmosThemeChoice`. */
  theme: T;
  /** Called with the next theme in `themes`: the first one after the last. */
  onChange: (next: T) => void;
  /**
   * The themes a click cycles through, in order. Default `['light', 'dark']`. Any of the four
   * Cosmos themes, and `system` to follow `prefers-color-scheme` (`applyAppearance` resolves it).
   * A `theme` that is not in the list moves to its first one.
   */
  themes?: readonly T[];
  /** Visual size. `md` (default) = 40px, `sm` = 32px. */
  size?: ThemeToggleSize;
  /**
   * The name of the button, which is also its tooltip, for the click that switches to a theme:
   * `labels={{ dark: 'Passer au thème sombre' }}`. Default "Switch to light theme", "Switch to
   * deep blue theme", "Switch to system theme"… from the theme's own name.
   */
  labels?: Partial<Record<T, string>>;
};

const SIZE_CLASS: Record<ThemeToggleSize, { box: string; icon: string }> = {
  sm: { box: 'h-ctrl-32 w-ctrl-32', icon: 'h-4 w-4' },
  md: { box: 'h-ctrl-40 w-ctrl-40', icon: 'h-5 w-5' },
};

const DEFAULT_THEMES: readonly CosmosThemeChoice[] = ['light', 'dark'];

// Each icon represents the *current* theme so the user knows what is active.
const ICON_FOR: Record<CosmosThemeChoice, LucideIcon> = {
  light: Sun,
  sand: Sunset,
  dark: Moon,
  'deep-blue': MoonStar,
  system: Monitor,
};

// What a theme is called in "Switch to … theme": the name the themes carry everywhere else.
const NAME_FOR = {
  ...Object.fromEntries(COSMOS_THEMES.map(({ id, label }) => [id, label.toLowerCase()])),
  system: 'system',
} as Record<CosmosThemeChoice, string>;

/**
 * ThemeToggle — an icon button that cycles through `themes`: light and dark by default, or any
 * of the four Cosmos themes and `system`. The icon shows the current theme, and the name says
 * what the click does ("Switch to dark theme"), so the button carries no `aria-pressed`.
 *
 * It is controlled: a click calls `onChange` with the next theme and changes nothing else, so
 * apply the theme there (for example with `applyAppearance`). For a choice by name, with a
 * preview of each theme, use `AppearanceSettings`.
 */
export function ThemeToggle<T extends CosmosThemeChoice = CosmosThemeChoice>({
  theme,
  onChange,
  themes = DEFAULT_THEMES as readonly T[],
  size = 'md',
  labels,
  className,
  ref,
  ...rest
}: ThemeToggleProps<T>) {
  const next = themes[(themes.indexOf(theme) + 1) % themes.length] ?? theme;
  const label = labels?.[next] ?? `Switch to ${NAME_FOR[next]} theme`;
  const Icon: LucideIcon = ICON_FOR[theme];
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
