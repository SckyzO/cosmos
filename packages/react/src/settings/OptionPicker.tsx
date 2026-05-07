import { clsx } from 'clsx';
import { OptionCard, type OptionCardProps } from './OptionCard';

export type OptionItem = Pick<OptionCardProps, 'id' | 'label' | 'desc' | 'preview'>;

export type OptionPickerProps = {
  options: OptionItem[];
  value: string;
  onChange: (id: string) => void;
  /** Number of grid columns. Default 5. */
  cols?: number;
  className?: string;
};

/**
 * OptionPicker — responsive grid of `<OptionCard>` previews. Use for
 * generic single-select pickers (icon styles, view modes, density, etc.).
 */
export const OptionPicker = ({
  options,
  value,
  onChange,
  cols = 5,
  className,
}: OptionPickerProps) => (
  <div
    className={clsx('grid gap-2', className)}
    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
  >
    {options.map((o) => (
      <OptionCard
        key={o.id}
        id={o.id}
        label={o.label}
        desc={o.desc}
        preview={o.preview}
        active={o.id === value}
        onClick={() => onChange(o.id)}
      />
    ))}
  </div>
);
