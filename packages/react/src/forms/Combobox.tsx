import { clsx } from 'clsx';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
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
  /**
   * Names the input when there is no visible `label`, as for a field in a table row or a grid
   * of lines. A `label` wins: the name is the one on screen.
   */
  'aria-label'?: string;
  /**
   * Selected option value, when controlled. With `allowCustomValue` it is also any text the
   * host holds as the value.
   */
  value?: string;
  /** Initial option value, when uncontrolled. None selected when omitted. */
  defaultValue?: string;
  /**
   * Called when the user picks an option, with its `value`. With `allowCustomValue` it is also
   * called on every keystroke, with the text typed.
   */
  onChange?: (value: string) => void;
  /**
   * Called with the option the user picks (a click, or Enter on the active option). Typed text
   * never fires it, which is how `allowCustomValue` tells a pick from typing.
   */
  onSelect?: (option: ComboboxOption) => void;
  /**
   * Accepts the text typed as the value, when no option is picked: a field that suggests a
   * catalogue and lets the user write their own entry. The text is the value (`onChange` fires on
   * every keystroke) and stays in the field when focus leaves. Nothing is active until an arrow
   * key moves there, so Enter keeps the text and lets an enclosing form submit; the list closes
   * when no option matches, unless `emptyMessage` is set. Keep the `value` of the options out of
   * what people type: a text equal to one names that option. Default `false`: the typed text is
   * only a filter, and the field goes back to the selected option when focus leaves.
   */
  allowCustomValue?: boolean;
  options: ComboboxOption[];
  placeholder?: string;
  /**
   * Show this when no option matches the typed query. Default "No matches found."; none with
   * `allowCustomValue`, where the text is accepted and the empty list stays closed.
   */
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
  'aria-label': ariaLabel,
  value: valueProp,
  defaultValue,
  onChange,
  onSelect,
  allowCustomValue = false,
  options,
  placeholder,
  emptyMessage,
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
  // What the field shows once the list is closed: the label of the selected option, or the
  // value itself when the typed text is the value.
  const shownText = selected?.label ?? (allowCustomValue ? (value ?? '') : '');
  const [query, setQuery] = useState(shownText);
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
  const mirrorKey = open ? null : shownText;
  const [lastMirrorKey, setLastMirrorKey] = useState(mirrorKey);
  if (mirrorKey !== lastMirrorKey) {
    setLastMirrorKey(mirrorKey);
    if (mirrorKey !== null) setQuery(mirrorKey);
  }

  const filtered = useFilteredOptions(options, query);
  // With typed text accepted, a list with nothing to suggest is no error: it opens only for a
  // message the host asked for.
  const emptyText = emptyMessage ?? (allowCustomValue ? undefined : 'No matches found.');
  const listOpen = open && (filtered.length > 0 || emptyText !== undefined);

  const pick = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    setValue(opt.value);
    onSelect?.(opt);
    setQuery(opt.label);
    setOpen(false);
  };

  // Typed text that is the value must not give way to the first match on Enter: nothing is
  // active until an arrow key (or the pointer) says so.
  const noneActive = allowCustomValue ? -1 : 0;
  const {
    activeIndex,
    setActiveIndex,
    onKeyDown: navigate,
  } = useListboxNavigation({
    items: filtered,
    open,
    setOpen,
    onPick: pick,
    initialIndex: noneActive,
  });
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    navigate(e);
    // Enter with no option active accepts the text: the list closes, and the Enter goes on to
    // submit the form around the field.
    if (allowCustomValue && e.key === 'Enter' && !filtered[activeIndex]) setOpen(false);
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
          {required && <RequiredMark />}
        </label>
      )}
      <div ref={fieldRef} className={clsx('relative', label && 'mt-2')}>
        <input
          ref={ref}
          id={id}
          role="combobox"
          aria-label={label ? undefined : ariaLabel}
          aria-expanded={listOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-describedby={hasDesc ? descId : undefined}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-activedescendant={
            listOpen && filtered[activeIndex] ? `${id}-opt-${activeIndex}` : undefined
          }
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(noneActive);
            if (allowCustomValue) setValue(e.target.value);
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
        open={listOpen}
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
            <li className="py-row-8 px-3 text-sm text-gray-500 dark:text-gray-400">{emptyText}</li>
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
