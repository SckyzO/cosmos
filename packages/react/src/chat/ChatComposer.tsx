import { clsx } from 'clsx';
import { SendHorizontal } from 'lucide-react';
import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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
};

/**
 * Message input. The textarea grows with its content, Enter sends and
 * Shift+Enter inserts a newline. The ref points at the textarea.
 */
export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  (
    {
      onSend,
      label = 'Message',
      placeholder = 'Write a message…',
      sendLabel = 'Send message',
      disabled = false,
      attachment,
      maxHeight = 160,
      className,
    },
    forwardedRef
  ) => {
    const [value, setValue] = useState('');
    const inner = useRef<HTMLTextAreaElement | null>(null);
    const canSend = !disabled && value.trim() !== '';

    useLayoutEffect(() => {
      const el = inner.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    }, [value, maxHeight]);

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
          ref={mergeRefs(inner, forwardedRef)}
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
          className="focus:border-brand-500 min-h-10 flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          aria-label={sendLabel}
          disabled={!canSend}
          onClick={send}
          className="bg-brand-500 hover:bg-brand-600 focus-visible:ring-brand-500/40 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }
);
ChatComposer.displayName = 'ChatComposer';
