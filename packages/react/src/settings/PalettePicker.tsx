import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { useFieldA11y, type FieldA11yProps } from '../forms/fieldA11y';
import { onRadioGroupKeyDown, radioTabIndex } from '../forms/radioGroupA11y';
import { PaletteCard, type PaletteMeta } from './PaletteCard';
import { useControllableState } from '../hooks/useControllableState';

export type PalettePickerProps = FieldA11yProps & {
  palettes: PaletteMeta[];
  /** Selected palette id, when controlled. */
  value?: string;
  /** First selected palette id, when uncontrolled. None when omitted. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Number of columns from the `sm:` breakpoint (640px) up. Default 4; below it the grid has 2 (1 if `cols` is 1). */
  cols?: number;
  className?: string;
};

/**
 * PalettePicker — responsive grid of `<PaletteCard>` previews. Use one for
 * the light theme set and another for the dark theme set.
 */
export const PalettePicker = ({
  palettes,
  value: valueProp,
  defaultValue,
  onChange,
  cols = 4,
  className,
  ...a11y
}: PalettePickerProps) => {
  const fieldA11y = useFieldA11y(a11y);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'PalettePicker.value',
  });
  const anyChecked = palettes.some((item) => item.id === value);
  return (
    <div
      role="radiogroup"
      {...fieldA11y}
      onKeyDown={onRadioGroupKeyDown}
      // Whole class names, so Tailwind finds them; the counts reach them as
      // variables (an inline `grid-template-columns` would beat the `sm:` one).
      className={clsx(
        'grid grid-cols-[repeat(var(--palette-picker-narrow-cols),minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(var(--palette-picker-cols),minmax(0,1fr))]',
        className
      )}
      style={
        {
          '--palette-picker-narrow-cols': Math.min(cols, 2),
          '--palette-picker-cols': cols,
        } as CSSProperties
      }
    >
      {palettes.map((p, i) => (
        <PaletteCard
          key={p.id}
          meta={p}
          active={p.id === value}
          onClick={() => setValue(p.id)}
          tabIndex={radioTabIndex(p.id === value, i, anyChecked)}
        />
      ))}
    </div>
  );
};
