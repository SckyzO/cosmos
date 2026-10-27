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
import { mergeRefs } from '../ui/mergeRefs';
import { Tag } from '../ui/Tag';
import { useControllableState } from '../hooks/useControllableState';
import type { ComboboxOption } from './Combobox';
import { FIELD_LISTBOX_PANEL, FIELD_PAD_END_ICON, type FieldSize } from './fieldRecipe';
import { useFilteredOptions, useListboxNavigation } from './listboxNavigation';
import { RequiredMark } from './RequiredMark';
import {
  LiveRegion,
  TAG_SIZE,
  TagFieldDescription,
  focusInputOnBoxPress,
  tagFieldClass,
  tagInputClass,
  useAnnouncer,
} from './tagField';

/** An option of a `MultiSelect`: the shape of a `Combobox` option. */
export type MultiSelectOption = ComboboxOption;

export type MultiSelectProps = {
  label?: ReactNode;
  /**
   * Keeps the label for assistive technology only: the label and the count row leave the layout,
   * so the field's top edge is the component's, for a toolbar where it lines up with buttons.
   */
  labelHidden?: boolean;
  /** Chosen option values, when controlled. */
  value?: string[];
  /** Initial option values, when uncontrolled. None chosen when omitted. */
  defaultValue?: string[];
  /** Called with the whole list of chosen values after a pick or a removal. */
  onChange?: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  /** Show this when no option matches the typed query. */
  emptyMessage?: string;
  /** The most values that can be chosen: the other options are then unavailable. No limit when omitted. */
  maxItems?: number;
  /** Disable the field: the tags cannot be removed and the list does not open. */
  disabled?: boolean;
  /** Helper text under the field. */
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

const NONE: string[] = [];

/**
 * MultiSelect — a `Combobox` that holds several values. The chosen ones are removable `Tag`s
 * in the field, all visible, wrapping onto more lines as they come; the input after them filters
 * the list. The list stays open after a pick, a checkbox marks the chosen options, and Backspace
 * in an empty input removes the last value.
 */
export const MultiSelect = ({
  label,
  labelHidden = false,
  value: valueProp,
  defaultValue = NONE,
  onChange,
  options,
  placeholder,
  emptyMessage = 'No matches found.',
  maxItems,
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
}: MultiSelectProps) => {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const descId = `${id}-desc`;
  const countId = `${id}-count`;
  const hasDesc = !!(helperText || error);
  const [values, setValues] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'MultiSelect.value',
  });
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'MultiSelect.open',
  });
  // Typing, focus and ArrowDown ask to open a list that may be open already:
  // only a change reaches `onOpenChange`.
  const setOpen = (next: boolean) => {
    if (next !== open && !(next && disabled)) setOpenState(next);
  };
  const [query, setQuery] = useState('');
  const { message, announce } = useAnnouncer();
  const wrapperRef = useRef<HTMLDivElement>(null);
  // The box with the tags and the input: the list opens under it, as wide.
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const atMax = maxItems !== undefined && values.length >= maxItems;

  // At the limit the chosen options stay available (to be unchosen), the others are not.
  const items = useMemo(
    () =>
      atMax
        ? options.map((o) => (values.includes(o.value) ? o : { ...o, disabled: true }))
        : options,
    [options, values, atMax]
  );
  const filtered = useFilteredOptions(items, query);

  const toggle = (opt: MultiSelectOption) => {
    if (opt.disabled) return;
    const chosen = values.includes(opt.value);
    const next = chosen ? values.filter((v) => v !== opt.value) : [...values, opt.value];
    setValues(next);
    announce(`${opt.label} ${chosen ? 'removed' : 'added'}, ${next.length} selected`);
    // The list stays open on the whole set of options for the next pick.
    setQuery('');
    setActiveIndex(items.indexOf(opt));
  };

  const remove = (v: string) => {
    const next = values.filter((x) => x !== v);
    setValues(next);
    announce(`${labelOf(v)} removed, ${next.length} selected`);
    inputRef.current?.focus();
  };

  const { activeIndex, setActiveIndex, onKeyDown } = useListboxNavigation({
    items: filtered,
    open,
    setOpen,
    onPick: toggle,
  });

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !query && values.length > 0) {
      remove(values[values.length - 1]!);
      return;
    }
    onKeyDown(e);
  };

  const countText = maxItems !== undefined ? `${values.length} of ${maxItems}` : `${values.length}`;

  return (
    <div
      ref={wrapperRef}
      className={clsx('w-full', className)}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        {label ? (
          <label
            htmlFor={id}
            className={clsx(
              'block text-sm font-medium text-gray-900 dark:text-white',
              labelHidden && 'sr-only'
            )}
          >
            {label}
            {required && <RequiredMark />}
          </label>
        ) : (
          <span />
        )}
        <span
          id={countId}
          className={clsx(
            'text-xs text-gray-500 dark:text-gray-400',
            (values.length === 0 || labelHidden) && 'sr-only'
          )}
        >
          <bdi>{values.length === 0 ? 'None selected' : `${countText} selected`}</bdi>
        </span>
      </div>
      <div
        ref={fieldRef}
        onMouseDown={(e) => !disabled && focusInputOnBoxPress(e, inputRef.current)}
        className={clsx(
          'relative',
          (label || values.length > 0) && !labelHidden && 'mt-2',
          tagFieldClass({
            size,
            invalid: !!error,
            disabled,
            padEnd: FIELD_PAD_END_ICON[size],
          })
        )}
      >
        {values.map((v) => (
          <Tag
            key={v}
            size={TAG_SIZE[size]}
            disabled={disabled}
            onRemove={() => remove(v)}
            className="shrink-0"
          >
            {labelOf(v)}
          </Tag>
        ))}
        <input
          ref={mergeRefs(inputRef, ref)}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-describedby={clsx(hasDesc && descId, countId)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-activedescendant={
            open && filtered[activeIndex] ? `${id}-opt-${activeIndex}` : undefined
          }
          disabled={disabled}
          value={query}
          placeholder={values.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          className={tagInputClass(size)}
        />
        <button
          type="button"
          aria-label="Toggle options"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className="focus-visible:focus-indicator inset-e-0 absolute inset-y-0 flex items-center rounded-e-lg pe-2 text-gray-400 hover:text-gray-500 focus-visible:ring-inset"
        >
          <ChevronsUpDown className="size-5" aria-hidden />
        </button>
      </div>
      {/* Focus stays in the input (aria-activedescendant), which handles Tab; Escape closes the
          list as the top overlay of the stack. A mousedown in the field, its label or its help
          text is not outside. */}
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
          aria-multiselectable="true"
          className={clsx('max-h-60 w-full text-sm', FIELD_LISTBOX_PANEL)}
        >
          {filtered.length === 0 ? (
            <li
              role="option"
              aria-selected={false}
              aria-disabled
              className="py-row-8 px-3 text-sm text-gray-500 dark:text-gray-400"
            >
              {emptyMessage}
            </li>
          ) : (
            filtered.map((opt, i) => {
              const isActive = i === activeIndex;
              const isChosen = values.includes(opt.value);
              return (
                <li
                  id={`${id}-opt-${i}`}
                  key={opt.value}
                  role="option"
                  aria-selected={isChosen}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    // mousedown fires before the input blurs: keep the focus where it is.
                    e.preventDefault();
                    toggle(opt);
                  }}
                  className={clsx(
                    'py-row-8 flex items-center gap-2.5 px-3 text-gray-900 select-none dark:text-gray-100',
                    isActive && 'bg-gray-50 dark:bg-white/5',
                    opt.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  )}
                >
                  <span
                    aria-hidden
                    className={clsx(
                      'flex size-[18px] shrink-0 items-center justify-center rounded-md border transition-colors',
                      isChosen
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                    )}
                  >
                    {isChosen && <Check className="size-3.5 text-white" />}
                  </span>
                  {opt.leading && <span className="shrink-0">{opt.leading}</span>}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={clsx('truncate', isChosen && 'font-semibold')}>
                      {opt.label}
                    </span>
                    {opt.secondary && (
                      <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {opt.secondary}
                      </span>
                    )}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </FloatingPanel>
      {hasDesc && (
        <TagFieldDescription id={descId} error={!!error}>
          {error ?? helperText}
        </TagFieldDescription>
      )}
      <LiveRegion message={message} />
    </div>
  );
};
