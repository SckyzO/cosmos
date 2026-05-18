import { clsx } from 'clsx';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

// TUI Plus reference (Pattern 1 — "Simple"):
//   <Combobox>
//     <ComboboxLabel>Assigned to</ComboboxLabel>
//     <ComboboxInput onChange={…} displayValue={…} />
//     <ComboboxButton><ChevronUpDown /></ComboboxButton>
//     <ComboboxOptions>
//       {filtered.map(p => <ComboboxOption value={p}>{p.name}</ComboboxOption>)}
//     </ComboboxOptions>
//   </Combobox>
//
// Our implementation is uncontrolled-input + controlled-selection, no
// external lib (cmdk/headlessui not needed for this surface).

export type ComboboxOption = {
  value: string;
  label: string;
  /** Optional secondary text shown to the right (mirrors TUI "With secondary text"). */
  secondary?: ReactNode;
  /** Optional status dot/icon shown to the left (TUI "With status indicator"). */
  leading?: ReactNode;
  disabled?: boolean;
};

export type ComboboxProps = {
  label?: ReactNode;
  /** Selected option value (controlled). */
  value?: string;
  /** Called when the user picks an option. */
  onChange?: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** Show this when no option matches the typed query. */
  emptyMessage?: string;
  /** Disable the input + dropdown. */
  disabled?: boolean;
  /** Helper text under the input. */
  helperText?: string;
  /** Error message — replaces helperText when set. */
  error?: string;
  className?: string;
};

export const Combobox = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyMessage = 'No matches found.',
  disabled = false,
  helperText,
  error,
  className,
}: ComboboxProps) => {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep input mirror of external selection.
  useEffect(() => {
    if (!open) setQuery(selected?.label ?? '');
  }, [selected?.label, open]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        pick(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-900 dark:text-white"
        >
          {label}
        </label>
      )}
      <div className={clsx('relative', label && 'mt-2')}>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[activeIndex] ? `${id}-opt-${activeIndex}` : undefined}
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={clsx(
            'w-full rounded-md border bg-white py-1.5 pr-10 pl-3 text-sm shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/30 dark:border-white/10',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        />
        <button
          type="button"
          aria-label="Toggle options"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-500"
        >
          <ChevronsUpDown className="size-5" aria-hidden />
        </button>
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((opt, i) => {
                const isActive = i === activeIndex;
                const isSelected = opt.value === value;
                return (
                  <li
                    id={`${id}-opt-${i}`}
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => {
                      // mousedown fires before input blur — prevents losing focus
                      // race with the listbox unmount.
                      e.preventDefault();
                      pick(opt);
                    }}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2 px-3 py-2 select-none',
                      isActive
                        ? 'bg-brand-500 text-white'
                        : 'text-gray-900 dark:text-gray-100',
                      opt.disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {opt.leading && <span className="shrink-0">{opt.leading}</span>}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.secondary && (
                      <span
                        className={clsx(
                          'shrink-0 text-xs',
                          isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400',
                        )}
                      >
                        {opt.secondary}
                      </span>
                    )}
                    {isSelected && <Check className="size-4 shrink-0" aria-hidden />}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
      {(helperText || error) && (
        <p
          className={clsx(
            'mt-1.5 text-xs',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
};
