import { clsx } from 'clsx';

export type ChatSuggestionsProps = {
  /** The suggested replies, one chip each. Nothing renders when the list is empty. */
  suggestions: string[];
  /** Called with the text of the chip the user picks. */
  onSelect: (text: string) => void;
  /** Accessible name of the list. Default `Suggested replies`. */
  label?: string;
  className?: string;
};

/**
 * Suggested replies as a row of chips, to put above a `ChatComposer`. It sends nothing itself:
 * `onSelect` gets the picked text and the app answers it as it does a typed message.
 */
export const ChatSuggestions = ({
  suggestions,
  onSelect,
  label = 'Suggested replies',
  className,
}: ChatSuggestionsProps) => {
  if (suggestions.length === 0) return null;
  return (
    <ul aria-label={label} className={clsx('flex flex-wrap gap-2 px-3 pb-2', className)}>
      {suggestions.map((s) => (
        <li key={s}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            className="border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 focus-visible:focus-indicator rounded-full border px-3 py-1 text-xs font-medium"
          >
            {s}
          </button>
        </li>
      ))}
    </ul>
  );
};
