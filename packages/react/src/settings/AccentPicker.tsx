import { clsx } from 'clsx';
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
  /** Number of columns from `sm:` breakpoint (default 10). */
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
  smCols = 10,
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
      className={clsx('grid gap-1.5', className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
      data-sm-cols={smCols}
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
