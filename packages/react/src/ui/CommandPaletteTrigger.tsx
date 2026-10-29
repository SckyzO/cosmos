import { clsx } from 'clsx';
import { Search } from 'lucide-react';
import { useSyncExternalStore, type ComponentPropsWithRef } from 'react';
import { FIELD_HEIGHT, FIELD_ICON_SIZE, FIELD_TEXT, type FieldSize } from '../forms/fieldRecipe';
import { Kbd } from '../typography/Kbd';
import { ariaKeyShortcuts, hotkeyLabel, isApplePlatform } from './hotkey';

export type CommandPaletteTriggerProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  /** Text of the field-like button. Default `Search…`. Below `sm` it is read by assistive technology only. */
  placeholder?: string;
  /**
   * The hotkey that opens the palette, written as `CommandPalette`'s `hotkey` (`'mod+k'`), shown
   * as a key hint: `⌘K` on Apple platforms, `Ctrl K` elsewhere. It only labels the button: the
   * `CommandPalette` listens for the keys, so give both the same value. `null` hides the hint
   * (a palette with `hotkey={null}`). Default `'mod+k'`.
   */
  shortcut?: string | null;
  /** Height and text size, aligned on the form fields'. Default `md`. */
  size?: FieldSize;
};

// The square it shrinks to below `sm`: as wide as the field is tall.
const ICON_WIDTH: Record<FieldSize, string> = {
  sm: 'w-ctrl-32',
  md: 'w-ctrl-36',
  lg: 'w-ctrl-44',
};

// A server render and the first client render agree on `false`; the platform is read after.
const subscribeNothing = () => () => {};

/**
 * `CommandPaletteTrigger` — a button drawn like a search field, which opens a `CommandPalette`:
 * a placeholder, a magnifier and the hotkey as a key hint. Not an input: nothing is typed here,
 * the palette holds the field, so a screen reader announces a button that opens a dialog.
 *
 * The palette owns the hotkey (its `hotkey` prop, `mod+k` by default) and the open state. This
 * button registers no key listener: it takes `onClick={() => setOpen(true)}` and the same hotkey
 * for its hint, so the keys never toggle the palette twice.
 *
 * Below `sm` it shrinks to a square icon button; the placeholder stays as its accessible name.
 */
export const CommandPaletteTrigger = ({
  placeholder = 'Search…',
  shortcut = 'mod+k',
  size = 'md',
  className,
  ref,
  ...rest
}: CommandPaletteTriggerProps) => {
  const isMac = useSyncExternalStore(subscribeNothing, isApplePlatform, () => false);
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      aria-keyshortcuts={shortcut ? ariaKeyShortcuts(shortcut, isMac) : undefined}
      {...rest}
      // The look of a field (`fieldClass`) without its `focus:` state: a button shows the
      // `focus-visible` indicator of the other controls, so a mouse click leaves no ring.
      className={clsx(
        'focus-visible:focus-indicator relative flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600',
        FIELD_HEIGHT[size],
        FIELD_TEXT[size],
        // Below `sm`: a square, the icon centred. From `sm` up: the field's width and padding.
        ICON_WIDTH[size],
        'max-sm:justify-center sm:w-full sm:px-3',
        className
      )}
    >
      <Search aria-hidden className={clsx('shrink-0 text-gray-400', FIELD_ICON_SIZE[size])} />
      <span className="min-w-0 flex-1 truncate text-start max-sm:sr-only">
        <bdi>{placeholder}</bdi>
      </span>
      {shortcut && (
        <Kbd size="sm" className="max-sm:hidden">
          {hotkeyLabel(shortcut, isMac)}
        </Kbd>
      )}
    </button>
  );
};
