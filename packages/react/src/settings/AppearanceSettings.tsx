import { clsx } from 'clsx';
import { useId } from 'react';
import { AccentPicker } from './AccentPicker';
import { OptionPicker } from './OptionPicker';
import { PalettePicker } from './PalettePicker';
import {
  COSMOS_ACCENTS,
  COSMOS_FONTS,
  COSMOS_TEXT_SIZES,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosAccentMeta,
  type CosmosFont,
  type CosmosFontMeta,
  type CosmosTextSize,
  type CosmosTextSizeMeta,
  type CosmosSystemThemeMeta,
  type CosmosTheme,
  type CosmosThemeChoice,
  type CosmosThemeMeta,
} from './appearance';

export type AppearanceSettingsProps<T extends CosmosThemeChoice = CosmosTheme> = {
  /** Selected theme (`'system'` when `themes` offers it: then type the state as `CosmosThemeChoice`). */
  theme: T;
  /** Selected accent. */
  accent: CosmosAccent;
  onThemeChange: (theme: T) => void;
  onAccentChange: (accent: CosmosAccent) => void;
  /** Heading of the theme group. Default `'Theme'`. */
  themeLabel?: string;
  /** Heading of the accent group. Default `'Accent color'`. */
  accentLabel?: string;
  /**
   * Themes to offer. Default: all of `COSMOS_THEMES`. Add `COSMOS_SYSTEM_THEME`
   * to offer "System", then resolve it with `applyAppearance`.
   */
  themes?: (CosmosThemeMeta | CosmosSystemThemeMeta)[];
  /** Accents to offer. Default: all of `COSMOS_ACCENTS`. */
  accents?: CosmosAccentMeta[];
  /** Columns of the theme grid. Default 4; use 2 in narrow containers. */
  themeColumns?: number;
  /** Selected font. Default `'outfit'`. */
  font?: CosmosFont;
  /** Shows the font group. */
  onFontChange?: (font: CosmosFont) => void;
  /** Selected text size. Default `'md'`. */
  textSize?: CosmosTextSize;
  /** Shows the text size group. */
  onTextSizeChange?: (textSize: CosmosTextSize) => void;
  /** Heading of the font group. Default `'Font'`. */
  fontLabel?: string;
  /** Heading of the text size group. Default `'Text size'`. */
  textSizeLabel?: string;
  /**
   * Fonts to offer. Default: all of `COSMOS_FONTS`. Offer only the fonts whose
   * CSS the app imports (`@sckyzo/cosmos-theme/fonts/<id>`).
   */
  fonts?: CosmosFontMeta[];
  /** Text sizes to offer. Default: all of `COSMOS_TEXT_SIZES`. */
  textSizes?: CosmosTextSizeMeta[];
  className?: string;
};

/**
 * AppearanceSettings — theme and accent pickers for the Cosmos themes, built
 * on `<PalettePicker>` and `<AccentPicker>`, plus font and text size pickers
 * when their `on…Change` handlers are set. Controlled: pass the result to
 * `applyAppearance` (or your own theme switcher) to update the page.
 */
export const AppearanceSettings = <T extends CosmosThemeChoice = CosmosTheme>({
  theme,
  accent,
  onThemeChange,
  onAccentChange,
  themeLabel = 'Theme',
  accentLabel = 'Accent color',
  themes = COSMOS_THEMES,
  accents = COSMOS_ACCENTS,
  themeColumns = 4,
  font = 'outfit',
  onFontChange,
  textSize = 'md',
  onTextSizeChange,
  fontLabel = 'Font',
  textSizeLabel = 'Text size',
  fonts = COSMOS_FONTS,
  textSizes = COSMOS_TEXT_SIZES,
  className,
}: AppearanceSettingsProps<T>) => {
  const themeHeadingId = useId();
  const accentHeadingId = useId();
  const fontHeadingId = useId();
  const textSizeHeadingId = useId();
  return (
    <div className={clsx('space-y-6', className)}>
      <div>
        <p id={themeHeadingId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {themeLabel}
        </p>
        <PalettePicker
          aria-labelledby={themeHeadingId}
          className="mt-3"
          palettes={themes}
          value={theme}
          cols={themeColumns}
          // ids come from `themes`, so they are theme values.
          onChange={(id) => onThemeChange(id as T)}
        />
      </div>
      <div>
        <p id={accentHeadingId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {accentLabel}
        </p>
        <AccentPicker
          aria-labelledby={accentHeadingId}
          className="mt-3"
          colors={accents}
          value={accent}
          onChange={(id) => onAccentChange(id as CosmosAccent)}
          cols={6}
        />
      </div>
      {onFontChange && (
        <div>
          <p id={fontHeadingId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {fontLabel}
          </p>
          <OptionPicker
            aria-labelledby={fontHeadingId}
            className="mt-3"
            cols={3}
            value={font}
            // ids come from `fonts`, so they are CosmosFont values.
            onChange={(id) => onFontChange(id as CosmosFont)}
            options={fonts.map((f) => ({
              id: f.id,
              label: f.label,
              preview: (
                <span
                  aria-hidden
                  style={{ fontFamily: f.family }}
                  className="text-xl text-gray-900 dark:text-gray-100"
                >
                  Aa
                </span>
              ),
            }))}
          />
        </div>
      )}
      {onTextSizeChange && (
        <div>
          <p
            id={textSizeHeadingId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {textSizeLabel}
          </p>
          <OptionPicker
            aria-labelledby={textSizeHeadingId}
            className="mt-3"
            cols={4}
            value={textSize}
            onChange={(id) => onTextSizeChange(id as CosmosTextSize)}
            options={textSizes.map((t) => ({
              id: t.id,
              label: t.label,
              // Pixel sizes, so the previews don't scale with the setting.
              preview: (
                <span
                  aria-hidden
                  style={{ fontSize: `${16 * t.scale}px` }}
                  className="text-gray-900 dark:text-gray-100"
                >
                  Aa
                </span>
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
};
