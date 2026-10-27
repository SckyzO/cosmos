import { clsx } from 'clsx';
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { mergeRefs } from '../ui/mergeRefs';
import { Tag } from '../ui/Tag';
import { useControllableState } from '../hooks/useControllableState';
import { FIELD_LISTBOX_PANEL, type FieldSize } from './fieldRecipe';
import { filterByLabel, useListboxNavigation } from './listboxNavigation';
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

export type TagInputProps = {
  label?: ReactNode;
  /** The tags, when controlled. */
  value?: string[];
  /** Initial tags, when uncontrolled. None when omitted. */
  defaultValue?: string[];
  /** Called with the whole list of tags after one is added or removed. */
  onChange?: (values: string[]) => void;
  placeholder?: string;
  /** Texts offered in a list under the field while typing; the ones already added are left out. */
  suggestions?: string[];
  /**
   * Called with the trimmed text of a tag about to be added. Return `false` to reject it: the text
   * stays in the input and the field shows `invalidMessage`, until the text changes.
   */
  validate?: (text: string) => boolean;
  /** Shown when `validate` rejects a text. Default `"<text>" is not a valid tag.` */
  invalidMessage?: string;
  /**
   * The keys that add the typed text as a tag: `KeyboardEvent.key` values, so `Enter`, `Tab`, or
   * a character such as `,`, `;` or a space. Default `['Enter', ',']`. A pasted text is split on
   * the characters among them (and on line breaks when `Enter` is one).
   */
  separators?: string[];
  /** The most tags the field holds. No limit when omitted. */
  maxTags?: number;
  /** Disable the field: the tags cannot be removed. */
  disabled?: boolean;
  /** Helper text under the field. Default names the `separators` ("Press Enter or comma to add a tag."). */
  helperText?: string;
  /** Error message, shown in place of the helper text and of `invalidMessage`. */
  error?: string;
  /** Height and text size, aligned on Button's. Default `md`. */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label and `aria-required` on the input. */
  required?: boolean;
  className?: string;
  /** Ref to the `<input>`. */
  ref?: Ref<HTMLInputElement>;
  /** Open state of the suggestions, when controlled. */
  open?: boolean;
  /** Initial open state of the suggestions, when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the open state to move to. */
  onOpenChange?: (open: boolean) => void;
};

const NONE: string[] = [];
const DEFAULT_SEPARATORS = ['Enter', ','];

const KEY_NAME: Record<string, string> = {
  ',': 'comma',
  ';': 'semicolon',
  ' ': 'space',
};

// "Press Enter or comma to add a tag."
const describeSeparators = (separators: string[]) => {
  if (separators.length === 0) return undefined;
  const names = separators.map((s) => KEY_NAME[s] ?? s);
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
  return `Press ${list} to add a tag.`;
};

// A character inside a RegExp class.
const escapeClass = (c: string) => c.replace(/[\\\]^-]/g, '\\$&');

// The suggestions as listbox items, filtered by the typed text.
const suggestionItems = (suggestions: string[] | undefined, query: string) =>
  filterByLabel(
    (suggestions ?? []).map((label) => ({ label })),
    query
  );

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * TagInput — free-text tags. Each tag is a removable `Tag` in the field, wrapping onto more lines
 * as they come, with a borderless input after them. Enter and comma (`separators`) turn the typed
 * text into a tag, a pasted list adds each of its items, a text already added is skipped, and
 * Backspace in an empty input removes the last tag. `suggestions` offer ready texts in a list,
 * `validate` rejects the others, and a live region announces every addition and removal.
 */
export const TagInput = ({
  label,
  value: valueProp,
  defaultValue = NONE,
  onChange,
  placeholder,
  suggestions,
  validate,
  invalidMessage,
  separators = DEFAULT_SEPARATORS,
  maxTags,
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
}: TagInputProps) => {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const descId = `${id}-desc`;
  const countId = `${id}-count`;
  const [values, setValues] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'TagInput.value',
  });
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'TagInput.open',
  });
  const setOpen = (next: boolean) => {
    if (next !== open && !(next && disabled)) setOpenState(next);
  };
  const [query, setQuery] = useState('');
  // The text `validate` turned down, until the user changes it.
  const [rejected, setRejected] = useState<string | null>(null);
  const { message, announce } = useAnnouncer();
  const fieldRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const helper = helperText ?? describeSeparators(separators);
  const errorText =
    error ??
    (rejected !== null ? (invalidMessage ?? `"${rejected}" is not a valid tag.`) : undefined);
  const description = errorText ?? helper;

  const available = suggestions?.filter((s) => !values.some((v) => sameTag(v, s)));
  const matches = suggestionItems(available, query);

  /**
   * Adds the texts as tags, in order: an empty one, one already there and one past `maxTags` are
   * skipped, and the first one `validate` turns down stops the run. Returns what was left alone,
   * `rejected` or not, so the caller knows whether to clear the input.
   */
  const add = (texts: string[]): { rejected?: string } => {
    const next = [...values];
    const notes: string[] = [];
    let turnedDown: string | undefined;
    for (const raw of texts) {
      const text = raw.trim();
      if (!text) continue;
      if (next.some((v) => sameTag(v, text))) {
        notes.push(`${text} is already added`);
      } else if (maxTags !== undefined && next.length >= maxTags) {
        notes.push(`Maximum of ${maxTags} tags reached`);
        break;
      } else if (validate && !validate(text)) {
        turnedDown = text;
        break;
      } else {
        next.push(text);
      }
    }
    const added = next.slice(values.length);
    if (added.length > 0) setValues(next);
    if (turnedDown !== undefined) {
      setRejected(turnedDown);
      notes.push(invalidMessage ?? `"${turnedDown}" is not a valid tag.`);
    }
    const said = [...(added.length > 0 ? [`${added.join(', ')} added`] : []), ...notes];
    if (said.length > 0)
      announce(`${said.join('. ')}${added.length > 0 ? `, ${next.length} tags` : ''}`);
    return { rejected: turnedDown };
  };

  const remove = (v: string) => {
    setValues(values.filter((x) => x !== v));
    announce(`${v} removed, ${values.length - 1} tags`);
    inputRef.current?.focus();
  };

  const commitTyped = () => {
    if (add([query]).rejected === undefined) setQuery('');
  };

  const pickSuggestion = (item: { label: string }) => {
    add([item.label]);
    setQuery('');
    setActiveIndex(-1);
  };

  const {
    activeIndex,
    setActiveIndex,
    onKeyDown: onListKeyDown,
  } = useListboxNavigation({
    items: matches,
    open,
    setOpen,
    onPick: pickSuggestion,
    initialIndex: -1,
  });

  const splitChars = separators.filter((s) => s.length === 1);
  const splitText = (text: string) => {
    const breaks = separators.includes('Enter') ? [...splitChars, '\n', '\r'] : splitChars;
    return breaks.length === 0
      ? [text]
      : text.split(new RegExp(`[${breaks.map(escapeClass).join('')}]`));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter that confirms an IME composition is not ours.
    if (e.nativeEvent.isComposing) return;
    if (suggestions) {
      onListKeyDown(e);
      if (e.defaultPrevented) return;
    }
    if (e.key === 'Backspace' && !query && values.length > 0) {
      remove(values[values.length - 1]!);
    } else if (separators.includes(e.key) && query.trim()) {
      e.preventDefault();
      commitTyped();
    } else if (e.key === ',' && separators.includes(',')) {
      // Nothing typed: the comma adds nothing and is not typed either.
      e.preventDefault();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const parts = splitText(text);
    if (parts.length < 2) return;
    e.preventDefault();
    add(parts);
  };

  // Keyboards that report no key (`Unidentified`) still type the separator: split what came in.
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setRejected(null);
    setActiveIndex(-1);
    setOpen(true);
    const parts = splitText(text);
    if (parts.length > 1) {
      // A turned-down text stays in the input for the user to fix.
      const { rejected: turnedDown } = add(parts.slice(0, -1));
      setQuery(turnedDown ?? parts[parts.length - 1]!);
    } else {
      setQuery(text);
    }
  };

  const countText = `${values.length}${maxTags !== undefined ? ` of ${maxTags}` : ''} ${
    values.length === 1 && maxTags === undefined ? 'tag' : 'tags'
  }`;
  const listOpen = open && matches.length > 0;

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
      <span id={countId} className="sr-only">
        {countText}
      </span>
      <div
        ref={fieldRef}
        onMouseDown={(e) => !disabled && focusInputOnBoxPress(e, inputRef.current)}
        className={clsx(label && 'mt-2', tagFieldClass({ size, invalid: !!errorText, disabled }))}
      >
        {values.map((v) => (
          <Tag
            key={v}
            size={TAG_SIZE[size]}
            disabled={disabled}
            onRemove={() => remove(v)}
            className="shrink-0"
          >
            {v}
          </Tag>
        ))}
        <input
          ref={mergeRefs(inputRef, ref)}
          id={id}
          type="text"
          role={suggestions ? 'combobox' : undefined}
          aria-expanded={suggestions ? listOpen : undefined}
          aria-controls={suggestions ? listboxId : undefined}
          aria-autocomplete={suggestions ? 'list' : undefined}
          aria-activedescendant={
            listOpen && matches[activeIndex] ? `${id}-opt-${activeIndex}` : undefined
          }
          aria-describedby={clsx(description && descId, countId)}
          aria-invalid={errorText ? true : undefined}
          aria-required={required || undefined}
          disabled={disabled}
          value={query}
          placeholder={values.length === 0 ? placeholder : undefined}
          onChange={onInputChange}
          onFocus={() => suggestions && setOpen(true)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className={tagInputClass(size)}
        />
      </div>
      {suggestions && (
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
            aria-label="Suggestions"
            className={clsx('max-h-60 w-full text-sm', FIELD_LISTBOX_PANEL)}
          >
            {matches.map((item, i) => (
              <li
                id={`${id}-opt-${i}`}
                key={item.label}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  // mousedown fires before the input blurs: keep the focus where it is.
                  e.preventDefault();
                  pickSuggestion(item);
                }}
                className={clsx(
                  'py-row-8 cursor-pointer truncate px-3 text-gray-900 select-none dark:text-gray-100',
                  i === activeIndex && 'bg-gray-50 dark:bg-white/5'
                )}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </FloatingPanel>
      )}
      {description && (
        <TagFieldDescription id={descId} error={!!errorText}>
          {description}
        </TagFieldDescription>
      )}
      <LiveRegion message={message} />
    </div>
  );
};
