import { clsx } from 'clsx';
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
      className={clsx('grid gap-3', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
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
