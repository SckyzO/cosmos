import { clsx } from 'clsx';
import type { OptionItem } from './OptionPicker';
import type {
  CosmosDensity,
  CosmosDensityMeta,
  CosmosFontMeta,
  CosmosTextSizeMeta,
} from './appearance';

// The font, text size and density choices of `AppearanceSettings` and `Customizer`, with their
// previews.

/** The gap between the rows of a density's preview, in px. */
const DENSITY_PREVIEW_GAP: Record<CosmosDensity, string> = {
  compact: 'gap-[2px]',
  default: 'gap-[5px]',
  comfortable: 'gap-[9px]',
};

export const fontOptions = (fonts: CosmosFontMeta[]): OptionItem[] =>
  fonts.map((f) => ({
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
  }));

export const textSizeOptions = (textSizes: CosmosTextSizeMeta[]): OptionItem[] =>
  textSizes.map((t) => ({
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
  }));

export const densityOptions = (densities: CosmosDensityMeta[]): OptionItem[] =>
  densities.map((d) => ({
    id: d.id,
    label: d.label,
    // Three rows, closer or further apart. Pixel gaps, so the preview doesn't follow the density
    // it shows.
    preview: (
      <span aria-hidden className={clsx('flex flex-col', DENSITY_PREVIEW_GAP[d.id])}>
        {[0, 1, 2].map((row) => (
          <span key={row} className="h-1 w-6 rounded-full bg-gray-300 dark:bg-gray-600" />
        ))}
      </span>
    ),
  }));
