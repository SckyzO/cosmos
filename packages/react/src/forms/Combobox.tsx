import { clsx } from 'clsx';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { useControllableState } from '../hooks/useControllableState';

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
// Our implementation is an uncontrolled input over a selection the host may
// control, no external lib (cmdk/headlessui not needed for this surface).

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
  /** Selected option value, when controlled. */
  value?: string;
  /** Initial option value, when uncontrolled. None selected when omitted. */
  defaultValue?: string;
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
  /** Ref to the `<input role="combobox">`, not to the toggle button. */
  ref?: Ref<HTMLInputElement>;
  /** Open state of the list, when controlled. */
  open?: boolean;
  /** Initial open state, when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the open state to move to. */
  onOpenChange?: (open: boolean) => void;
};

export const Combobox = ({
  label,
  value: valueProp,
  defaultValue,
  onChange,
  options,
  placeholder,
  emptyMessage = 'No matches found.',
  disabled = false,
  helperText,
  error,
  className,
  ref,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: ComboboxProps) => {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const descId = `${id}-desc`;
  const hasDesc = !!(helperText || error);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'Combobox.value',
  });
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Combobox.open',
  });
  // Typing, focus and ArrowDown ask to open a list that may be open already:
  // only a change reaches `onOpenChange`.
  const setOpen = (next: boolean) => {
    if (next !== open) setOpenState(next);
  };
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // The input and its toggle button: the listbox opens under it, as wide.
  const fieldRef = useRef<HTMLDivElement>(null);

  // Keep input mirror of external selection.
  // Adjusted during render rather than in an effect: it only re-syncs while the
  // list is closed, when the selected label or the open state changes.
  const mirrorKey = open ? null : (selected?.label ?? '');
  const [lastMirrorKey, setLastMirrorKey] = useState(mirrorKey);
  if (mirrorKey !== lastMirrorKey) {
    setLastMirrorKey(mirrorKey);
    if (mirrorKey !== null) setQuery(mirrorKey);
  }

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Arrow keys step over disabled options and stay put at either end.
  const moveActive = (step: 1 | -1) =>
    setActiveIndex((i) => {
      let next = i + step;
      while (filtered[next]?.disabled) next += step;
      return filtered[next] ? next : i;
    });

  const pick = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    setValue(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        pick(filtered[activeIndex]);
      }
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={clsx('w-full', className)}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
      )}
      <div ref={fieldRef} className={clsx('relative', label && 'mt-2')}>
        <input
          ref={ref}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-describedby={hasDesc ? descId : undefined}
          aria-invalid={error ? true : undefined}
          aria-activedescendant={
            open && filtered[activeIndex] ? `${id}-opt-${activeIndex}` : undefined
          }
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
            'w-full rounded-md border bg-white py-1.5 pr-10 pl-3 text-sm shadow-sm placeholder:text-gray-500 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400',
            error
              ? 'focus:field-focus-error border-red-400 dark:border-red-500/60'
              : 'focus:field-focus border-gray-300 dark:border-white/10',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        />
        <button
          type="button"
          aria-label="Toggle options"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className="focus-visible:focus-indicator absolute inset-y-0 right-0 flex items-center rounded-r-md pr-2 text-gray-400 hover:text-gray-500 focus-visible:ring-inset"
        >
          <ChevronsUpDown className="size-5" aria-hidden />
        </button>
      </div>
      {/* Focus stays in the input (aria-activedescendant), which handles Tab;
          Escape closes the listbox as the top overlay of the stack, so a modal
          around it stays open. A mousedown anywhere in the field, its label or
          its help text is not outside. */}
      <FloatingPanel
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={wrapperRef}
        anchorRef={fieldRef}
        placement={{ side: 'bottom', align: 'start', offset: 4, matchWidth: true }}
        moveFocus={false}
      >
        <ul
          id={listboxId}
          role="listbox"
          className="max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</li>
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
                    isActive ? 'bg-brand-500 text-white' : 'text-gray-900 dark:text-gray-100',
                    opt.disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {opt.leading && <span className="shrink-0">{opt.leading}</span>}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.secondary && (
                    <span
                      className={clsx(
                        'shrink-0 text-xs',
                        isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
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
      </FloatingPanel>
      {hasDesc && (
        <p
          id={descId}
          className={clsx(
            'mt-1.5 text-xs',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
};
