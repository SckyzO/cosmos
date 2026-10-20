import { clsx } from 'clsx';
import { useId } from 'react';
import { AccentPicker } from './AccentPicker';
import { PalettePicker } from './PalettePicker';
import {
  COSMOS_ACCENTS,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosAccentMeta,
  type CosmosTheme,
  type CosmosThemeMeta,
} from './appearance';

export type AppearanceSettingsProps = {
  /** Selected theme. */
  theme: CosmosTheme;
  /** Selected accent. */
  accent: CosmosAccent;
  onThemeChange: (theme: CosmosTheme) => void;
  onAccentChange: (accent: CosmosAccent) => void;
  /** Heading of the theme group. Default `'Theme'`. */
  themeLabel?: string;
  /** Heading of the accent group. Default `'Accent color'`. */
  accentLabel?: string;
  /** Themes to offer. Default: all of `COSMOS_THEMES`. */
  themes?: CosmosThemeMeta[];
  /** Accents to offer. Default: all of `COSMOS_ACCENTS`. */
  accents?: CosmosAccentMeta[];
  /** Columns of the theme grid. Default 4; use 2 in narrow containers. */
  themeColumns?: number;
  className?: string;
};

/**
 * AppearanceSettings — theme and accent pickers for the Cosmos themes, built
 * on `<PalettePicker>` and `<AccentPicker>`. Controlled: pass the result to
 * `applyAppearance` (or your own theme switcher) to update the page.
 */
export const AppearanceSettings = ({
  theme,
  accent,
  onThemeChange,
  onAccentChange,
  themeLabel = 'Theme',
  accentLabel = 'Accent color',
  themes = COSMOS_THEMES,
  accents = COSMOS_ACCENTS,
  themeColumns = 4,
  className,
}: AppearanceSettingsProps) => {
  const themeHeadingId = useId();
  const accentHeadingId = useId();
  return (
    <div className={clsx('space-y-6', className)}>
      <div role="group" aria-labelledby={themeHeadingId}>
        <p id={themeHeadingId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {themeLabel}
        </p>
        <PalettePicker
          className="mt-3"
          palettes={themes}
          value={theme}
          cols={themeColumns}
          // ids come from `themes`, so they are CosmosTheme values.
          onChange={(id) => onThemeChange(id as CosmosTheme)}
        />
      </div>
      <div role="group" aria-labelledby={accentHeadingId}>
        <p id={accentHeadingId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {accentLabel}
        </p>
        <AccentPicker
          className="mt-3"
          colors={accents}
          value={accent}
          onChange={(id) => onAccentChange(id as CosmosAccent)}
          cols={6}
        />
      </div>
    </div>
  );
};
