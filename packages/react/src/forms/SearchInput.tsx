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
  <div className={clsx('relative', className)}>
    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="focus:border-brand-500 h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm transition-colors focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
    />
  </div>
);
