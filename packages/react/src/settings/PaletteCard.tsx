import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export type PalettePreview = {
  /** Page background. */
  bg: string;
  /** Card / panel background (sits above `bg`). */
  surface: string;
  /** Borders and faint dividers. */
  border: string;
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
  className?: string;
};

/**
 * PaletteCard — preview card showing a tiny mockup (sidebar strip + card)
 * of a palette plus its label. Use inside `<PalettePicker>` to let the
 * user pick a light/dark theme palette.
 */
export const PaletteCard = ({ meta, active = false, onClick, className }: PaletteCardProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={meta.label}
    className={clsx(
      'group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all',
      active
        ? 'border-brand-500 shadow-sm'
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

    {/* Label row */}
    <div
      className="flex items-center justify-between px-2.5 py-1.5"
      style={{
        backgroundColor: meta.preview.surface,
        borderTop: `1px solid ${meta.preview.border}`,
      }}
    >
      <span className="text-left">
        <span
          className="block text-xs font-semibold"
          style={{ color: active ? undefined : '#6b7280' }}
        >
          {meta.label}
        </span>
        {meta.desc && (
          <span className="block text-[10px]" style={{ color: '#9ca3af' }}>
            {meta.desc}
          </span>
        )}
      </span>
      {active && (
        <span className="bg-brand-500 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
          <Check className="h-2.5 w-2.5 text-white" aria-hidden />
        </span>
      )}
    </div>
  </button>
);
