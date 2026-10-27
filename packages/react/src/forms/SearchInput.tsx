import { clsx } from 'clsx';
import { Search } from 'lucide-react';
import type { Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { useControllableState } from '../hooks/useControllableState';
import {
  FIELD_HEIGHT,
  FIELD_ICON_START,
  FIELD_ICON_SIZE,
  FIELD_PAD_START_ICON,
  FIELD_PAD_END,
  FIELD_PLACEHOLDER,
  FIELD_PLAINTEXT,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';

export type SearchInputProps = FieldA11yProps & {
  name?: string;
  /** Text, when controlled. */
  value?: string;
  /** Initial text, when uncontrolled. Default empty. */
  defaultValue?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  /** Height and text size, aligned on Button's. Default `md`. */
  size?: FieldSize;
  /** Sets `aria-required` on the input. It has no label of its own to carry an asterisk. */
  required?: boolean;
  className?: string;
  /** Ref to the text `<input>`. */
  ref?: Ref<HTMLInputElement>;
};

export const SearchInput = ({
  value: valueProp,
  defaultValue = '',
  onChange,
  placeholder = 'Search…',
  size = 'md',
  required,
  className,
  name,
  ref,
  ...a11y
}: SearchInputProps) => {
  const fieldA11y = useFieldA11y(a11y);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'SearchInput.value',
  });
  return (
    <div
      className={clsx('relative inline-flex w-full items-center', FIELD_HEIGHT[size], className)}
    >
      <Search
        aria-hidden
        className={clsx(
          'pointer-events-none absolute text-gray-400',
          FIELD_ICON_START[size],
          FIELD_ICON_SIZE[size]
        )}
      />
      <input
        ref={ref}
        type="text"
        name={name}
        {...fieldA11y}
        aria-required={required || undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'h-full w-full',
          fieldClass({ size, fixedHeight: false }),
          FIELD_PLACEHOLDER,
          FIELD_PLAINTEXT,
          FIELD_PAD_START_ICON[size],
          FIELD_PAD_END[size]
        )}
      />
    </div>
  );
};
