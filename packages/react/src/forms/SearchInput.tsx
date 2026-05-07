import { clsx } from 'clsx';
import { Search } from 'lucide-react';

export type SearchInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: SearchInputProps) => (
  <div className={clsx('relative inline-flex h-9 w-full items-center', className)}>
    <Search aria-hidden className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="focus:border-brand-500 h-full w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm transition-colors focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
    />
  </div>
);
