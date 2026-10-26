import { clsx } from 'clsx';
import { ChevronDown, Search } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { FloatingPanel } from '../ui/FloatingPanel';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { FIELD_PAD_X, FIELD_PLACEHOLDER, fieldClass, type FieldSize } from './fieldRecipe';
import { useListboxNavigation } from './listboxNavigation';
import { PHONE_COUNTRIES } from './phoneCountries';
import {
  PHONE_ERROR,
  digitsOf,
  filterCountries,
  flagEmoji,
  isPlausibleNumber,
  matchDialPrefix,
  resolveCountries,
  toE164,
} from './phoneNumber';
import { RequiredMark } from './RequiredMark';

// The language country names are written in: the page's, as `Intl.DisplayNames` takes it. The
// server snapshot is English, so the first client render matches the server's and the names switch
// once hydrated.
const subscribeNever = () => () => {};
const pageLocale = () => document.documentElement.lang || navigator.language || 'en';
const serverLocale = () => 'en';

const useCountryNames = () => {
  const locale = useSyncExternalStore(subscribeNever, pageLocale, serverLocale);
  return useMemo(() => {
    let names: Intl.DisplayNames;
    try {
      names = new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      // A malformed `lang` attribute: English is what is left.
      names = new Intl.DisplayNames(['en'], { type: 'region' });
    }
    return { locale, nameOf: (code: string) => names.of(code) ?? code };
  }, [locale]);
};

export type PhoneInputProps = FieldA11yProps & {
  label?: string;
  /** Helper text under the field. */
  description?: string;
  /** Error message, replaces `description`. It wins over the one shown for an invalid number. */
  error?: string;
  /** Height and text size, aligned on Button's. Default `md`. */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label, `required` and `aria-required` on the number. */
  required?: boolean;
  /**
   * The number in E.164 (`+33612345678`), or `''` for none, when controlled. A number that is not
   * valid yet is reported as `''`.
   */
  value?: string;
  /** Initial number, when uncontrolled. */
  defaultValue?: string;
  /** Called with the E.164 number once it is valid, and with `''` while it is empty or not valid. */
  onChange?: (value: string) => void;
  /**
   * ISO 3166-1 alpha-2 code of the country selected until a number or the user says otherwise.
   * Default `US` (the first of `countries` when it is not in that list).
   */
  defaultCountry?: string;
  /** The countries the list offers, as ISO 3166-1 alpha-2 codes. Every country when omitted. */
  countries?: string[];
  /**
   * Formats the national digits as the user types (`libphonenumber-js`'s `AsYouType`, say). The
   * field then shows what it returns for the digits typed; the caret is the host's concern.
   */
  format?: (country: string, national: string) => string;
  /**
   * Checks a number the light rule (4 or more digits, 15 at most with the country code) accepted:
   * return the message to show when it is not valid, nothing when it is. A number it rejects is
   * reported as `''`.
   */
  validate?: (value: string) => string | undefined;
  placeholder?: string;
  disabled?: boolean;
  /** Merged on the wrapper. */
  className?: string;
  /** Ref to the number `<input>`. */
  ref?: Ref<HTMLInputElement>;
};

type Evaluated = { national: string; unresolved: boolean; message?: string; value: string };

// What the number field holds, as a value: the E.164 string when it passes both checks.
const evaluate = (
  country: string,
  text: string,
  validate: PhoneInputProps['validate']
): Evaluated => {
  // A leading "+" left in the text is a country code no allowed country has.
  const unresolved = text.trimStart().startsWith('+');
  const national = digitsOf(text);
  const dial = PHONE_COUNTRIES[country]!;
  if (unresolved || national === '') return { national, unresolved, value: '' };
  if (!isPlausibleNumber(dial, national)) return { national, unresolved, value: '' };
  const e164 = toE164(dial, national);
  const message = validate?.(e164);
  return { national, unresolved, message, value: message ? '' : e164 };
};

/**
 * PhoneInput — a country picker joined to the number field, in one border with one focus ring. The
 * country shows its flag (decorative: the ISO code carries the meaning), ISO code and calling
 * code; its list searches by name, ISO code or calling code. Typing a number that starts with `+`
 * and a known calling code switches the country; picking a country keeps the digits typed. The
 * value is the E.164 number. The check is light (digits only, 4 to 15): `format` and `validate`
 * let a host plug real per-country rules in.
 */
export const PhoneInput = ({
  label,
  description,
  error,
  size = 'md',
  required,
  value: valueProp,
  defaultValue = '',
  onChange,
  defaultCountry = 'US',
  countries,
  format,
  validate,
  placeholder,
  disabled = false,
  className,
  ref,
  ...a11y
}: PhoneInputProps) => {
  const id = useId();
  const inputId = a11y.id ?? `${id}-number`;
  const listboxId = `${id}-listbox`;
  const descId = `${id}-desc`;
  const allowed = resolveCountries(countries);
  const allowedKey = allowed.join();
  const { locale, nameOf } = useCountryNames();

  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'PhoneInput.value',
  });

  const fallbackCountry = allowed.includes(defaultCountry.toUpperCase())
    ? defaultCountry.toUpperCase()
    : allowed[0]!;
  const show = (country: string, national: string) =>
    format ? format(country, national) : national;
  const [initial] = useState(() => {
    const match = matchDialPrefix(digitsOf(value), allowed, fallbackCountry);
    return match
      ? { country: match.country, text: show(match.country, match.rest) }
      : { country: fallbackCountry, text: '' };
  });
  const [country, setCountry] = useState(initial.country);
  // What the user typed (or `format` returned) in the number field.
  const [text, setText] = useState(initial.text);
  const current = evaluate(country, text, validate);

  // A number from outside (the host, a reset) replaces the field, unless the field already reads as
  // that number: "06 12" typed is not rewritten while the value is not valid yet.
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    if (value !== current.value) {
      const match = value === '' ? null : matchDialPrefix(digitsOf(value), allowed, country);
      if (value === '') setText('');
      else if (match) {
        setCountry(match.country);
        setText(show(match.country, match.rest));
      }
    }
  }

  const commit = (nextCountry: string, nextText: string) => {
    setCountry(nextCountry);
    setText(nextText);
    const next = evaluate(nextCountry, nextText, validate).value;
    if (next !== value) setValue(next);
  };

  const onNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTouched(false);
    // Letters are dropped; a "+" only counts first.
    const plus = /^\s*\+/.test(e.target.value);
    const typed = (plus ? '+' : '') + e.target.value.replace(/[^\d\s().-]/g, '');
    if (plus) {
      const match = matchDialPrefix(digitsOf(typed), allowed, country);
      if (match) return commit(match.country, show(match.country, match.rest));
      return commit(country, typed);
    }
    commit(country, format ? format(country, digitsOf(typed)) : typed);
  };

  // Set on leaving the number field; cleared by the next keystroke.
  const [touched, setTouched] = useState(false);
  const invalidMessage =
    touched && text.trim() !== '' && current.value === ''
      ? (current.message ?? PHONE_ERROR)
      : undefined;
  const message = error ?? invalidMessage;
  const helper = message ?? description;

  const fieldA11y = useFieldA11y({ ...a11y, id: inputId }, { ownLabel: !!label });

  // The list.
  const [open, setOpenState] = useState(false);
  const [query, setQuery] = useState('');
  const fieldRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = useMemo(
    () =>
      allowedKey
        .split(',')
        .map((code) => ({
          code,
          name: nameOf(code),
          label: nameOf(code),
          dial: PHONE_COUNTRIES[code]!,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [allowedKey, nameOf, locale]
  );
  const filtered = useMemo(() => filterCountries(options, query), [options, query]);
  const pick = (code: string) => {
    commit(code, format ? format(code, current.national) : text);
    setOpenState(false);
  };
  const { activeIndex, setActiveIndex, onKeyDown } = useListboxNavigation({
    items: filtered,
    open,
    setOpen: (next) => setOpenState(next),
    onPick: (option) => pick(option.code),
  });
  const openList = () => {
    if (open || disabled) return;
    setQuery('');
    setActiveIndex(
      Math.max(
        0,
        options.findIndex((o) => o.code === country)
      )
    );
    setOpenState(true);
  };

  // Keep the active option in view as the arrow keys move it.
  useEffect(() => {
    if (open)
      document.getElementById(`${id}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, id]);

  const countryName = nameOf(country);
  const dial = PHONE_COUNTRIES[country]!;
  const divider = 'border-gray-200 dark:border-gray-700';

  return (
    <div className={clsx('block', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {required ? (
            <span>
              {label}
              <RequiredMark />
            </span>
          ) : (
            label
          )}
        </label>
      )}
      <div
        ref={fieldRef}
        data-open={open || undefined}
        className={clsx(
          'flex w-full items-stretch overflow-hidden',
          fieldClass({ size, invalid: !!message, within: true }),
          message ? 'data-open:field-focus-error' : 'data-open:field-focus',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpenState(false) : openList())}
          onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              openList();
            }
          }}
          className={clsx(
            'flex shrink-0 items-center gap-2 border-r bg-transparent whitespace-nowrap outline-hidden hover:bg-gray-50 disabled:cursor-not-allowed dark:hover:bg-gray-900',
            divider,
            FIELD_PAD_X[size],
            'pr-2.5'
          )}
        >
          {/* The accessible name starts with what the button is for and ends with the visible text. */}
          <span className="sr-only">Country: {countryName},</span>
          <span aria-hidden className="text-base leading-none">
            {flagEmoji(country)}
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">{country}</span>
          <span className="text-gray-500 dark:text-gray-400">+{dial}</span>
          <ChevronDown className="size-3.5 text-gray-500 dark:text-gray-400" aria-hidden />
        </button>
        <input
          ref={ref}
          {...fieldA11y}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          aria-describedby={
            [fieldA11y['aria-describedby'], helper ? descId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={message ? true : undefined}
          aria-required={required || undefined}
          required={required}
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={onNumberChange}
          onBlur={() => setTouched(true)}
          className={clsx(
            'h-full min-w-0 flex-1 border-0 bg-transparent text-gray-900 tabular-nums focus:ring-0 focus:outline-none disabled:cursor-not-allowed dark:text-white',
            FIELD_PAD_X[size],
            FIELD_PLACEHOLDER
          )}
        />
      </div>
      <FloatingPanel
        open={open}
        onClose={() => setOpenState(false)}
        triggerRef={triggerRef}
        anchorRef={fieldRef}
        placement={{ side: 'bottom', align: 'start', offset: 4 }}
        className="w-80 max-w-[calc(100vw-2rem)]"
      >
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-700">
            <Search className="size-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
            <input
              role="combobox"
              aria-label="Search countries"
              aria-expanded
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={filtered[activeIndex] ? `${id}-opt-${activeIndex}` : undefined}
              value={query}
              placeholder="Search"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              className={clsx(
                'min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-900 focus:ring-0 focus:outline-none dark:text-white',
                FIELD_PLACEHOLDER
              )}
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Countries"
            hidden={filtered.length === 0}
            className="max-h-60 overflow-auto p-1.5 text-sm"
          >
            {filtered.map((option, i) => (
              <li
                id={`${id}-opt-${i}`}
                key={option.code}
                role="option"
                aria-selected={option.code === country}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  // Keeps focus in the search field through the pick.
                  e.preventDefault();
                  pick(option.code);
                }}
                className={clsx(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-gray-900 select-none dark:text-gray-100',
                  i === activeIndex ? 'bg-brand-50 dark:bg-brand-500/15' : 'bg-transparent'
                )}
              >
                <span aria-hidden className="text-base leading-none">
                  {flagEmoji(option.code)}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className={clsx(option.code === country && 'font-semibold')}>
                    {option.name}
                  </span>{' '}
                  <span className="text-gray-600 dark:text-gray-300">{option.code}</span>
                </span>
                <span className="shrink-0 text-gray-600 dark:text-gray-300">+{option.dial}</span>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <p role="status" className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
              No matches found.
            </p>
          )}
        </div>
      </FloatingPanel>
      {helper && (
        <span
          id={descId}
          className={clsx(
            'mt-1 block text-xs',
            message ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {helper}
        </span>
      )}
    </div>
  );
};
