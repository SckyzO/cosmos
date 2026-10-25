import { clsx } from 'clsx';
import type { Ref } from 'react';
import { paletteLabelColor } from './paletteLabelColor';
import { PICKER_SELECTED_BORDER, SelectedMark } from './SelectedMark';

export type PalettePreview = {
  /** Page background. */
  bg: string;
  /** Card / panel background (sits above `bg`). */
  surface: string;
  /** Borders and faint dividers. */
  border: string;
  /**
   * Label color on `surface`. Default: a gray that reads on it, dark on a light
   * surface and light on a dark one (taken as light when `surface` isn't a hex
   * color). Set it for a mid-tone surface or to match the palette's own text.
   */
  text?: string;
};

export type PaletteMeta = {
  /** Stable identifier. */
  id: string;
  /** Display name (e.g. "Pure Light"). */
  label: string;
  /** Short description (e.g. "white surfaces"). */
  desc?: string;
  /** Three colours used to render a mini mockup. */
  preview: PalettePreview;
};

export type PaletteCardProps = {
  meta: PaletteMeta;
  active?: boolean;
  onClick?: () => void;
  /** Roving tab stop, set by the picker's radio group. */
  tabIndex?: number;
  className?: string;
  /** Ref to the `<button role="radio">`. */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * PaletteCard — preview card showing a tiny mockup (sidebar strip + card)
 * of a palette plus its label. Use inside `<PalettePicker>` to let the
 * user pick a light/dark theme palette.
 */
export const PaletteCard = ({
  meta,
  active = false,
  onClick,
  tabIndex,
  className,
  ref,
}: PaletteCardProps) => {
  const labelColor = meta.preview.text ?? paletteLabelColor(meta.preview.surface);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      tabIndex={tabIndex}
      aria-label={meta.label}
      className={clsx(
        'group focus-visible:focus-indicator relative flex flex-col overflow-hidden rounded-xl border-2 transition-all',
        active
          ? clsx(PICKER_SELECTED_BORDER, 'shadow-sm')
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
        className
      )}
    >
      {/* Mini mockup */}
      <div
        className="flex h-16 w-full flex-col gap-0.5 p-2"
        style={{ backgroundColor: meta.preview.bg }}
      >
        <span className="h-2 w-8 rounded-sm" style={{ backgroundColor: meta.preview.border }} />
        <span
          className="mt-1 flex-1 rounded-sm"
          style={{
            backgroundColor: meta.preview.surface,
            border: `1px solid ${meta.preview.border}`,
          }}
        />
      </div>

      {/* Label row — flex-1 fills the card when a taller neighbor stretches the grid row. */}
      <div
        className="flex flex-1 items-center justify-between px-2.5 py-1.5"
        style={{
          backgroundColor: meta.preview.surface,
          borderTop: `1px solid ${meta.preview.border}`,
        }}
      >
        <span className="text-left">
          <span className="block text-xs font-semibold" style={{ color: labelColor }}>
            {meta.label}
          </span>
          {meta.desc && (
            <span className="text-3xs block" style={{ color: labelColor }}>
              {meta.desc}
            </span>
          )}
        </span>
        {active && <SelectedMark />}
      </div>
    </button>
  );
};
