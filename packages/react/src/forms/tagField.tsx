import { clsx } from 'clsx';
import { useCallback, useState, type ReactNode } from 'react';
import type { TagSize } from '../ui/Tag';
import { FIELD_PLACEHOLDER, fieldClass, type FieldSize } from './fieldRecipe';

// Shared by MultiSelect and TagInput: a field whose values are Tags that wrap onto more lines,
// followed by a borderless input with a minimum width, so it never collapses at 375px.

/**
 * The tag that fits the field: its height plus the field's vertical padding and 2px border
 * gives the height of the other fields of the same size (`sm` 32px, `md` 36px, `lg` 44px).
 */
export const TAG_SIZE: Record<FieldSize, TagSize> = { sm: 'sm', md: 'sm', lg: 'md' };

// The height of one row of tags, which the input shares so the caret line matches a tag.
const ROW_HEIGHT: Record<FieldSize, string> = { sm: 'h-5.5', md: 'h-5.5', lg: 'h-6.5' };

// Less padding on the sides than a plain field: a tag sits closer to the border than a text.
const PAD_X: Record<FieldSize, string> = { sm: 'px-1.5', md: 'px-1.5', lg: 'px-2' };
const PAD_Y: Record<FieldSize, string> = { sm: 'py-row-4', md: 'py-row-6', lg: 'py-row-8' };

type TagFieldClassOptions = {
  size: FieldSize;
  invalid: boolean;
  disabled: boolean;
  /** Extra right padding that clears a control drawn over the field's right edge. */
  padRight?: string;
};

/** The box: it grows with its tags, and takes the focus state from the input inside it. */
export const tagFieldClass = ({ size, invalid, disabled, padRight }: TagFieldClassOptions) =>
  clsx(
    'flex w-full flex-wrap items-center gap-1.5',
    fieldClass({ size, invalid, within: true, fixedHeight: false }),
    PAD_X[size],
    PAD_Y[size],
    padRight,
    disabled && 'cursor-not-allowed opacity-50'
  );

/** The input after the tags: no border of its own, the box draws it. */
export const tagInputClass = (size: FieldSize) =>
  clsx(
    'min-w-24 flex-1 bg-transparent px-1.5 text-gray-900 outline-hidden disabled:cursor-not-allowed dark:text-white',
    ROW_HEIGHT[size],
    FIELD_PLACEHOLDER
  );

/**
 * A press on the box outside its controls puts the caret in the input, as in a text field.
 * Call it from the box's `onMouseDown`.
 */
export const focusInputOnBoxPress = (
  e: { target: EventTarget; preventDefault(): void },
  input: HTMLInputElement | null
) => {
  if (e.target instanceof Element && e.target.closest('button, input')) return;
  e.preventDefault();
  input?.focus();
};

/** Helper or error text under a field; the error replaces the helper. */
export const TagFieldDescription = ({
  id,
  error,
  children,
}: {
  id: string;
  error?: boolean;
  children: ReactNode;
}) => (
  <p
    id={id}
    className={clsx(
      'mt-1.5 text-xs',
      error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
    )}
  >
    {children}
  </p>
);

/**
 * Messages for screen readers: a tag added or removed changes nothing the focused input
 * announces. `announce` sets the text of the live region; `LiveRegion` renders it.
 */
export const useAnnouncer = () => {
  const [message, setMessage] = useState('');
  const announce = useCallback((text: string) => setMessage(text), []);
  return { message, announce };
};

export const LiveRegion = ({ message }: { message: string }) => (
  <span role="status" className="sr-only">
    {message}
  </span>
);
