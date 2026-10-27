import { clsx } from 'clsx';

// The look every form field shares, so no field drifts from the others. A field
// takes its look from `fieldClass` and its dimensions from the maps below, all
// keyed by `FieldSize`. The scale follows Button's `sm` / `md` / `lg` (same
// heights and text sizes); `md` is the default. The heights and the vertical padding are theme
// tokens, so the page's `data-density` moves them.

export type FieldSize = 'sm' | 'md' | 'lg';

export const FIELD_HEIGHT: Record<FieldSize, string> = {
  sm: 'h-ctrl-32',
  md: 'h-ctrl-36',
  lg: 'h-ctrl-44',
};

export const FIELD_TEXT: Record<FieldSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/** Horizontal padding of a text, so a field's text clears its border. */
export const FIELD_PAD_X: Record<FieldSize, string> = {
  sm: 'px-2.5',
  md: 'px-3',
  lg: 'px-4',
};

/** Start and end padding of a field whose other side is free (an icon on one edge). */
export const FIELD_PAD_START: Record<FieldSize, string> = {
  sm: 'ps-2.5',
  md: 'ps-3',
  lg: 'ps-4',
};

export const FIELD_PAD_END: Record<FieldSize, string> = {
  sm: 'pe-2.5',
  md: 'pe-3',
  lg: 'pe-4',
};

/** Vertical padding of a field with no fixed height (a Textarea). */
export const FIELD_PAD_Y: Record<FieldSize, string> = {
  sm: 'py-row-6',
  md: 'py-row-8',
  lg: 'py-row-10',
};

/** Start padding that clears an icon drawn over the field's start edge. */
export const FIELD_PAD_START_ICON: Record<FieldSize, string> = {
  sm: 'ps-8',
  md: 'ps-9',
  lg: 'ps-11',
};

/** End padding that clears a chevron drawn over the field's end edge. */
export const FIELD_PAD_END_ICON: Record<FieldSize, string> = {
  sm: 'pe-8',
  md: 'pe-9',
  lg: 'pe-10',
};

/** Where an icon sits on the start edge. */
export const FIELD_ICON_START: Record<FieldSize, string> = {
  sm: 'inset-s-2.5',
  md: 'inset-s-3',
  lg: 'inset-s-3.5',
};

/** Where an icon sits on the end edge. */
export const FIELD_ICON_END: Record<FieldSize, string> = {
  sm: 'inset-e-2.5',
  md: 'inset-e-3',
  lg: 'inset-e-3.5',
};

export const FIELD_ICON_SIZE: Record<FieldSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

type FieldState = 'neutral' | 'success' | 'invalid';

// Border and focus of each state, so a field and the OTP cells read them from one place.
// `success` keeps the accent focus: a green border alone would not tell where the focus is.
const FIELD_STATE: Record<FieldState, { border: string; focus: string; focusWithin: string }> = {
  neutral: {
    border: 'border-gray-200 dark:border-gray-700',
    focus: 'focus:field-focus',
    focusWithin: 'focus-within:field-focus',
  },
  success: {
    border: 'border-green-600 dark:border-green-500/60',
    focus: 'focus:field-focus',
    focusWithin: 'focus-within:field-focus',
  },
  invalid: {
    border: 'border-red-400 dark:border-red-500/60',
    focus: 'focus:field-focus-error',
    focusWithin: 'focus-within:field-focus-error',
  },
};

type FieldStateOptions = {
  /** Red border and halo instead of the neutral border. Wins over `success`. */
  invalid?: boolean;
  /** Green border instead of the neutral one: the value was checked and is valid. */
  success?: boolean;
  /**
   * The border is drawn by a wrapper of the real input (a prefix or a stepper
   * around it): the focus state follows `focus-within` instead of `focus`.
   */
  within?: boolean;
};

/**
 * Border and focus classes of a field in one of its states: neutral, `success`
 * or `invalid` (exclusive, `invalid` first). Colors only: size, surface and
 * the rest come from `fieldClass`, or from the control itself (the OTP cells).
 */
export const fieldStateClass = ({
  invalid = false,
  success = false,
  within = false,
}: FieldStateOptions) => {
  const state = FIELD_STATE[invalid ? 'invalid' : success ? 'success' : 'neutral'];
  return clsx(state.border, within ? state.focusWithin : state.focus);
};

type FieldClassOptions = FieldStateOptions & {
  size: FieldSize;
  /** Muted surface of a field that shows a value but can't be edited. */
  readOnly?: boolean;
  /** `false` for a field that grows with its content (a Textarea). Default `true`. */
  fixedHeight?: boolean;
};

/**
 * Surface of a field: radius, border, background in light and dark, text size,
 * height, and the focus, disabled, success and invalid states. Padding, width
 * and the text color of a part stay with the field. The state classes are
 * exclusive: `invalid` (first) or `success` swaps the border and the focus
 * together, `readOnly` the background.
 */
export const fieldClass = ({
  size,
  invalid = false,
  success = false,
  within = false,
  readOnly = false,
  fixedHeight = true,
}: FieldClassOptions) =>
  clsx(
    'rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:text-white',
    readOnly ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800',
    FIELD_TEXT[size],
    fixedHeight && FIELD_HEIGHT[size],
    fieldStateClass({ invalid, success, within })
  );

/**
 * A text field follows the direction of what is typed in it: Arabic aligns and flows right to
 * left, a URL left to right, each paragraph of a Textarea on its own. `plaintext` and not
 * `dir="auto"`, which would also flip the field's own `direction` to left to right for a URL
 * and move its end padding (the room for a trailing icon or button, laid out by the page's
 * direction) to the side opposite the adornment. With `plaintext` the field keeps the page's
 * direction and its padding stays under the adornment.
 */
export const FIELD_PLAINTEXT = '[unicode-bidi:plaintext]';

/** Placeholder color of a text field, readable in light and dark. */
export const FIELD_PLACEHOLDER = 'placeholder:text-gray-500 dark:placeholder:text-gray-400';

/**
 * The panel a field opens under itself to list its options (Combobox). One
 * surface, whatever the field: the listbox scrolls inside it.
 */
export const FIELD_LISTBOX_PANEL =
  'overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-800';
