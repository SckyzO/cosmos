import { clsx } from 'clsx';
import { useId } from 'react';
import { AccentPicker } from './AccentPicker';
import { OptionPicker } from './OptionPicker';
import { PalettePicker } from './PalettePicker';
import {
  COSMOS_ACCENTS,
  COSMOS_DENSITIES,
  COSMOS_FONTS,
  COSMOS_TEXT_SIZES,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosAccentMeta,
  type CosmosDensity,
  type CosmosDensityMeta,
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
  /** Selected density. Default `'default'`. */
  density?: CosmosDensity;
  /** Shows the density group. */
  onDensityChange?: (density: CosmosDensity) => void;
  /** Heading of the font group. Default `'Font'`. */
  fontLabel?: string;
  /** Heading of the text size group. Default `'Text size'`. */
  textSizeLabel?: string;
  /** Heading of the density group. Default `'Density'`. */
  densityLabel?: string;
  /**
   * Fonts to offer. Default: all of `COSMOS_FONTS`. Offer only the fonts whose
   * CSS the app imports (`@sckyzo/cosmos-theme/fonts/<id>`).
   */
  fonts?: CosmosFontMeta[];
  /** Text sizes to offer. Default: all of `COSMOS_TEXT_SIZES`. */
  textSizes?: CosmosTextSizeMeta[];
  /** Densities to offer. Default: all of `COSMOS_DENSITIES`. */
  densities?: CosmosDensityMeta[];
  /**
   * Pin each group's heading to the top of the scrolling ancestor while its group is in view.
   * For a panel that scrolls (`AppearanceMenu` sets it): the headings paint the `Popover` surface
   * (`bg-white`, `dark:bg-gray-900`) and bleed 1rem on each side, so the container needs a 1rem
   * padding. Default `false`.
   */
  stickyHeadings?: boolean;
  className?: string;
};

/** The gap between the rows of a density's preview, in px. */
const DENSITY_PREVIEW_GAP: Record<CosmosDensity, string> = {
  compact: 'gap-[2px]',
  default: 'gap-[5px]',
  comfortable: 'gap-[9px]',
};

/**
 * AppearanceSettings — theme and accent pickers for the Cosmos themes, built
 * on `<PalettePicker>` and `<AccentPicker>`, plus font, text size and density
 * pickers when their `on…Change` handlers are set. Controlled: pass the result to
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
  density = 'default',
  onDensityChange,
  fontLabel = 'Font',
  textSizeLabel = 'Text size',
  densityLabel = 'Density',
  fonts = COSMOS_FONTS,
  textSizes = COSMOS_TEXT_SIZES,
  densities = COSMOS_DENSITIES,
  stickyHeadings = false,
  className,
}: AppearanceSettingsProps<T>) => {
  const themeHeadingId = useId();
  const accentHeadingId = useId();
  const fontHeadingId = useId();
  const textSizeHeadingId = useId();
  const densityHeadingId = useId();
  const headingClass = clsx(
    'text-sm font-medium text-gray-700 dark:text-gray-300',
    stickyHeadings && 'sticky -top-4 z-10 -mx-4 bg-white px-4 py-2 dark:bg-gray-900'
  );
  return (
    <div className={clsx('space-y-6', className)}>
      <div>
        <p id={themeHeadingId} className={headingClass}>
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
        <p id={accentHeadingId} className={headingClass}>
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
          <p id={fontHeadingId} className={headingClass}>
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
          <p id={textSizeHeadingId} className={headingClass}>
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
      {onDensityChange && (
        <div>
          <p id={densityHeadingId} className={headingClass}>
            {densityLabel}
          </p>
          <OptionPicker
            aria-labelledby={densityHeadingId}
            className="mt-3"
            cols={3}
            value={density}
            // ids come from `densities`, so they are CosmosDensity values.
            onChange={(id) => onDensityChange(id as CosmosDensity)}
            options={densities.map((d) => ({
              id: d.id,
              label: d.label,
              // Three rows, closer or further apart. Pixel gaps, so the preview doesn't follow
              // the density it shows.
              preview: (
                <span aria-hidden className={clsx('flex flex-col', DENSITY_PREVIEW_GAP[d.id])}>
                  {[0, 1, 2].map((row) => (
                    <span key={row} className="h-1 w-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                  ))}
                </span>
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
};
