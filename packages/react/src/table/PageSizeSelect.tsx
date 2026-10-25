import { useId } from 'react';
import { Select } from '../forms/Select';

export type PageSizeSelectProps = {
  /** The page size in force. Listed even when `options` leaves it out, so the select never shows another one. */
  value: number;
  options: number[];
  onChange: (size: number) => void;
};

/**
 * The "Rows per page" control of a DataTable footer: a native select named by a visible label.
 */
export const PageSizeSelect = ({ value, options, onChange }: PageSizeSelectProps) => {
  const id = useId();
  const sizes = options.includes(value) ? options : [...options, value].sort((a, b) => a - b);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
        Rows per page
      </label>
      <Select
        id={id}
        size="sm"
        fullWidth={false}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        options={sizes.map((n) => ({ value: String(n), label: String(n) }))}
      />
    </div>
  );
};
