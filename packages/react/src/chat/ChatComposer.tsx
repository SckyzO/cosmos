import { clsx } from 'clsx';
import { SendHorizontal } from 'lucide-react';
import { useRef, useState, type ReactNode, type Ref } from 'react';
import { useAutoGrow } from '../hooks/useAutoGrow';
import { mergeRefs } from '../ui/mergeRefs';

export type ChatComposerProps = {
  /** Called with the trimmed text when the user sends a non-empty message. */
  onSend: (text: string) => void;
  /** Accessible label of the textarea. Default `Message`. */
  label?: string;
  placeholder?: string;
  /** Accessible name of the send button. Default `Send message`. */
  sendLabel?: string;
  disabled?: boolean;
  /** Slot left of the textarea, e.g. an attach-file button. */
  attachment?: ReactNode;
  /** Height in px the textarea grows to before it scrolls. Default `160`. */
  maxHeight?: number;
  className?: string;
  /** Ref to the `<textarea>`, to focus it for example. */
  ref?: Ref<HTMLTextAreaElement>;
};

/**
 * Message input. The textarea grows with its content, Enter sends and
 * Shift+Enter inserts a newline. The ref points at the textarea.
 */
export function ChatComposer({
  onSend,
  label = 'Message',
  placeholder = 'Write a message…',
  sendLabel = 'Send message',
  disabled = false,
  attachment,
  maxHeight = 160,
  className,
  ref,
}: ChatComposerProps) {
  const [value, setValue] = useState('');
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const canSend = !disabled && value.trim() !== '';

  useAutoGrow(inner, { value, maxHeight });

  const send = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <div
      className={clsx(
        'flex items-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3',
        className
      )}
    >
      {attachment}
      <textarea
        ref={mergeRefs(inner, ref)}
        rows={1}
        aria-label={label}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // isComposing: the Enter that confirms an IME candidate must not send.
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        className="focus:field-focus min-h-10 flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
      />
      <button
        type="button"
        aria-label={sendLabel}
        disabled={!canSend}
        onClick={send}
        className="bg-brand-500 hover:bg-brand-600 focus-visible:focus-indicator flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SendHorizontal className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
