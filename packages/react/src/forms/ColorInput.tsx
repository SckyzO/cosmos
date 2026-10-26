import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { useId, useState, type Ref } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { markInk, normalizeHex } from './colorHex';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { FIELD_PAD_X, FIELD_PLACEHOLDER, fieldClass, type FieldSize } from './fieldRecipe';
import { onRadioGroupKeyDown, radioTabIndex } from './radioGroupA11y';
import { RequiredMark } from './RequiredMark';

export type ColorPreset = {
  /** The colour as a hex: `#14b8a6`, `#1ba` or `14b8a6`. Stored lowercase as `#rrggbb`. */
  value: string;
  /** The colour's name ("Teal"): what a screen reader announces, never the hex alone. */
  label: string;
};

// The eight Tailwind 500 hues, as plain data: a colour a user stored must not move when the theme
// or the accent does.
const DEFAULT_PRESETS: ColorPreset[] = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
];

const INVALID_MESSAGE = 'Enter a hex colour, such as #14b8a6.';

export type ColorInputProps = FieldA11yProps & {
  label?: string;
  /** Helper text under the field. */
  description?: string;
  /** Error message, replaces `description`. It wins over the one shown for an invalid hex draft. */
  error?: string;
  /** Height and text size of the hex field, aligned on Button's. Default `md`. */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label and `aria-required` on the hex field. */
  required?: boolean;
  /** The colour, as `#rrggbb`, when controlled. `''` is no colour. */
  value?: string;
  /** Initial colour, when uncontrolled. None when omitted. */
  defaultValue?: string;
  /**
   * Called with the lowercase `#rrggbb` when a preset is picked or a valid hex is typed. An
   * invalid draft never reaches it.
   */
  onChange?: (hex: string) => void;
  /** The swatches above the field. Default: the eight Tailwind 500 hues. `[]` for the hex field alone. */
  presets?: ColorPreset[];
  disabled?: boolean;
  /** Merged on the wrapper. */
  className?: string;
  /** Ref to the hex `<input>`. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * ColorInput — a colour as a row of named preset swatches (a radio group) and a hex field with a
 * preview square. The field keeps a draft while typing: `#abc`, `abc` and `#aabbcc` all give
 * `#aabbcc`, and only a valid hex reaches `onChange`. Leaving the field with an invalid draft shows
 * an error and keeps the value. There is no native colour input: it can't be styled and differs
 * per browser.
 */
export const ColorInput = ({
  label,
  description,
  error,
  size = 'md',
  required,
  value: valueProp,
  defaultValue = '',
  onChange,
  presets = DEFAULT_PRESETS,
  disabled = false,
  className,
  ref,
  ...a11y
}: ColorInputProps) => {
  const id = useId();
  const inputId = a11y.id ?? `${id}-hex`;
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'ColorInput.value',
  });
  const hex = normalizeHex(value);

  // What the user typed. A new value from outside (a preset, the host) replaces it, unless the
  // draft already reads as that value ("abc" while the value is "#aabbcc").
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    if (normalizeHex(draft) !== hex) setDraft(value);
  }
  // Set on leaving the field with a draft that is not a colour; cleared by the next keystroke.
  const [leftInvalid, setLeftInvalid] = useState(false);

  const fieldA11y = useFieldA11y({ ...a11y, id: inputId }, { ownLabel: !!label });
  const message = error ?? (leftInvalid ? INVALID_MESSAGE : undefined);
  const descId = `${id}-desc`;
  const helper = message ?? description;
  const checked = presets.findIndex((p) => normalizeHex(p.value) === hex);

  const pick = (preset: ColorPreset) => {
    setLeftInvalid(false);
    setValue(normalizeHex(preset.value) ?? preset.value);
  };

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
      {presets.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Preset colours"
          onKeyDown={onRadioGroupKeyDown}
          className="mb-2.5 flex flex-wrap gap-2"
        >
          {presets.map((preset, i) => {
            const on = i === checked;
            const presetHex = normalizeHex(preset.value) ?? preset.value;
            return (
              <button
                key={`${preset.value}-${preset.label}`}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={preset.label}
                title={preset.label}
                disabled={disabled}
                tabIndex={radioTabIndex(on, i, checked !== -1)}
                onClick={() => pick(preset)}
                style={{ backgroundColor: presetHex }}
                // The border (15% black, 25% white in the dark themes) makes a pale or a dark
                // preset read on every surface. The selected swatch is ringed in the accent, set
                // off by the panel colour; keyboard focus thickens that ring (or draws it, on an
                // unselected one).
                className={clsx(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border border-black/15 p-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25',
                  on
                    ? 'ring-brand-500 ring-2 ring-offset-2 ring-offset-(color:--color-bg-panel) outline-hidden focus-visible:ring-4'
                    : 'focus-visible:focus-indicator'
                )}
              >
                {on && (
                  <Check
                    className="size-4"
                    strokeWidth={3}
                    aria-hidden
                    style={{ color: markInk(presetHex) }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
      <div
        className={clsx(
          'flex w-50 max-w-full items-center gap-2.5',
          fieldClass({ size, invalid: !!message, within: true }),
          FIELD_PAD_X[size],
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          aria-hidden
          className="size-5 shrink-0 rounded-md border border-black/15 dark:border-white/25"
          style={{ backgroundColor: hex ?? 'transparent' }}
        />
        <input
          ref={ref}
          {...fieldA11y}
          aria-describedby={
            [fieldA11y['aria-describedby'], helper ? descId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-label={
            fieldA11y['aria-label'] ??
            (label || fieldA11y['aria-labelledby'] ? undefined : 'Hex value')
          }
          aria-invalid={message ? true : undefined}
          aria-required={required || undefined}
          required={required}
          disabled={disabled}
          value={draft}
          placeholder="#000000"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => {
            setDraft(e.target.value);
            setLeftInvalid(false);
            const typed = normalizeHex(e.target.value);
            if (typed !== null && typed !== value) setValue(typed);
          }}
          onBlur={() => {
            if (draft.trim() === '' || normalizeHex(draft) !== null) {
              // Settle on the value: "abc" becomes "#aabbcc", a cleared field gets the colour back.
              setDraft(value);
            } else {
              setLeftInvalid(true);
            }
          }}
          className={clsx(
            'h-full min-w-0 flex-1 border-0 bg-transparent text-gray-900 tabular-nums focus:ring-0 focus:outline-none disabled:cursor-not-allowed dark:text-white',
            FIELD_PLACEHOLDER
          )}
        />
      </div>
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
