import { clsx } from 'clsx';
import { PaletteCard, type PaletteMeta } from './PaletteCard';

export type PalettePickerProps = {
  palettes: PaletteMeta[];
  value: string;
  onChange: (id: string) => void;
  /** Number of columns. Default 4. */
  cols?: number;
  className?: string;
};

/**
 * PalettePicker — responsive grid of `<PaletteCard>` previews. Use one for
 * the light theme set and another for the dark theme set.
 */
export const PalettePicker = ({
  palettes,
  value,
  onChange,
  cols = 4,
  className,
}: PalettePickerProps) => (
  <div
    className={clsx('grid gap-3', className)}
    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
  >
    {palettes.map((p) => (
      <PaletteCard key={p.id} meta={p} active={p.id === value} onClick={() => onChange(p.id)} />
    ))}
  </div>
);
