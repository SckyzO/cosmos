import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { useFieldA11y, type FieldA11yProps } from '../forms/fieldA11y';
import { onRadioGroupKeyDown, radioTabIndex } from '../forms/radioGroupA11y';
import { ColorSwatch } from './ColorSwatch';

export type AccentColor = {
  /** Stable identifier (used as React key + value). */
  id: string;
  /** Visible label. */
  label: string;
  /** Color hex. */
  hex: string;
};

export type AccentPickerProps = FieldA11yProps & {
  /** Available accent colours. */
  colors: AccentColor[];
  /** Currently selected colour id. */
  value: string;
  onChange: (id: string) => void;
  /** Number of columns on small screens (default 5). */
  cols?: number;
  /** Number of columns from the `sm:` breakpoint (640px) up (default: the value of `cols`). */
  smCols?: number;
  className?: string;
};

/**
 * AccentPicker — grid of `<ColorSwatch>` buttons. Use to let the user
 * pick the primary brand colour. Inspired by rackscope's appearance settings.
 */
export const AccentPicker = ({
  colors,
  value,
  onChange,
  cols = 5,
  smCols = cols,
  className,
  ...a11y
}: AccentPickerProps) => {
  const fieldA11y = useFieldA11y(a11y);
  const anyChecked = colors.some((item) => item.id === value);
  return (
    <div
      role="radiogroup"
      {...fieldA11y}
      onKeyDown={onRadioGroupKeyDown}
      // Whole class names, so Tailwind finds them; the counts reach them as
      // variables (an inline `grid-template-columns` would beat the `sm:` one).
      className={clsx(
        'grid grid-cols-[repeat(var(--accent-picker-cols),minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(var(--accent-picker-sm-cols),minmax(0,1fr))]',
        className
      )}
      style={
        {
          '--accent-picker-cols': cols,
          '--accent-picker-sm-cols': smCols,
        } as CSSProperties
      }
    >
      {colors.map((c, i) => (
        <ColorSwatch
          key={c.id}
          hex={c.hex}
          label={c.label}
          active={c.id === value}
          onClick={() => onChange(c.id)}
          tabIndex={radioTabIndex(c.id === value, i, anyChecked)}
        />
      ))}
    </div>
  );
};
