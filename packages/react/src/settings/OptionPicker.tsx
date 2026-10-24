import { clsx } from 'clsx';
import { useFieldA11y, type FieldA11yProps } from '../forms/fieldA11y';
import { onRadioGroupKeyDown, radioTabIndex } from '../forms/radioGroupA11y';
import { OptionCard, type OptionCardProps } from './OptionCard';
import { useControllableState } from '../hooks/useControllableState';

export type OptionItem = Pick<OptionCardProps, 'id' | 'label' | 'desc' | 'preview'>;

export type OptionPickerProps = FieldA11yProps & {
  options: OptionItem[];
  /** Selected option id, when controlled. */
  value?: string;
  /** First selected option id, when uncontrolled. None when omitted. */
  defaultValue?: string;
  onChange?: (id: string) => void;
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
  value: valueProp,
  defaultValue,
  onChange,
  cols = 5,
  className,
  ...a11y
}: OptionPickerProps) => {
  const fieldA11y = useFieldA11y(a11y);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'OptionPicker.value',
  });
  const anyChecked = options.some((item) => item.id === value);
  return (
    <div
      role="radiogroup"
      {...fieldA11y}
      onKeyDown={onRadioGroupKeyDown}
      className={clsx('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((o, i) => (
        <OptionCard
          key={o.id}
          id={o.id}
          label={o.label}
          desc={o.desc}
          preview={o.preview}
          active={o.id === value}
          onClick={() => setValue(o.id)}
          tabIndex={radioTabIndex(o.id === value, i, anyChecked)}
        />
      ))}
    </div>
  );
};
