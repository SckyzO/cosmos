import { clsx } from 'clsx';
import { Search } from 'lucide-react';
import type { Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';

export type SearchInputProps = FieldA11yProps & {
  name?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  /** Ref to the text `<input>`. */
  ref?: Ref<HTMLInputElement>;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  name,
  ref,
  ...a11y
}: SearchInputProps) => {
  const fieldA11y = useFieldA11y(a11y);
  return (
    <div className={clsx('relative inline-flex h-9 w-full items-center', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
      <input
        ref={ref}
        type="text"
        name={name}
        {...fieldA11y}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus:field-focus h-full w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm transition-colors placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
      />
    </div>
  );
};
