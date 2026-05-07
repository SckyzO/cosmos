import { clsx } from 'clsx';
import { ColorSwatch } from './ColorSwatch';

export type AccentColor = {
  /** Stable identifier (used as React key + value). */
  id: string;
  /** Visible label. */
  label: string;
  /** Color hex. */
  hex: string;
};

export type AccentPickerProps = {
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
}: AccentPickerProps) => (
  <div
    className={clsx('grid gap-1.5', className)}
    style={{
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    }}
    data-sm-cols={smCols}
  >
    {colors.map((c) => (
      <ColorSwatch
        key={c.id}
        hex={c.hex}
        label={c.label}
        active={c.id === value}
        onClick={() => onChange(c.id)}
      />
    ))}
  </div>
);
