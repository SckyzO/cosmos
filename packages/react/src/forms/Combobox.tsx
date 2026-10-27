import { clsx } from 'clsx';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useId, useRef, useState, type ReactNode, type Ref } from 'react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { useControllableState } from '../hooks/useControllableState';
import {
  FIELD_LISTBOX_PANEL,
  FIELD_PAD_START,
  FIELD_PLACEHOLDER,
  FIELD_PLAINTEXT,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { useFilteredOptions, useListboxNavigation } from './listboxNavigation';
import { RequiredMark } from './RequiredMark';

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
  /** Height and text size, aligned on Button's. Default `md`. */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label and `aria-required` on the input. */
  required?: boolean;
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
  size = 'md',
  required,
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

  const filtered = useFilteredOptions(options, query);

  const pick = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    setValue(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  const { activeIndex, setActiveIndex, onKeyDown } = useListboxNavigation({
    items: filtered,
    open,
    setOpen,
    onPick: pick,
  });

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
          {required && <RequiredMark />}
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
          aria-required={required || undefined}
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
            'w-full pe-10',
            fieldClass({ size, invalid: !!error }),
            FIELD_PLACEHOLDER,
            FIELD_PLAINTEXT,
            FIELD_PAD_START[size]
          )}
        />
        <button
          type="button"
          aria-label="Toggle options"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className="focus-visible:focus-indicator inset-e-0 absolute inset-y-0 flex items-center rounded-e-lg pe-2 text-gray-400 hover:text-gray-500 focus-visible:ring-inset"
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
          className={clsx('max-h-60 w-full text-sm', FIELD_LISTBOX_PANEL)}
        >
          {filtered.length === 0 ? (
            <li className="py-row-8 px-3 text-sm text-gray-500 dark:text-gray-400">
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
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    // mousedown fires before input blur — prevents losing focus
                    // race with the listbox unmount.
                    e.preventDefault();
                    pick(opt);
                  }}
                  className={clsx(
                    'py-row-8 flex items-center gap-2 px-3 select-none',
                    isActive ? 'bg-brand-500 text-white' : 'text-gray-900 dark:text-gray-100',
                    opt.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
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
            error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
};
