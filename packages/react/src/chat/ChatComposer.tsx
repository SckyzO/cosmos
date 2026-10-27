import { clsx } from 'clsx';
import { SendHorizontal, Square } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
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
  /**
   * A line under the field and the send button, inside the same panel: an attach button, a model
   * picker (a `Select`), a hint. Without it the composer is the single row it always was.
   */
  footer?: ReactNode;
  /**
   * A reply is being generated: the send button becomes a Stop button (same place, size and
   * color, a filled square), and Enter does not send. The field stays editable, so the next
   * message can be typed meanwhile. When it turns `false` while Stop holds the focus, the focus
   * moves to the field.
   */
  generating?: boolean;
  /** Called when the Stop button is pressed. */
  onStop?: () => void;
  /** Accessible name of the Stop button. Default `Stop generating`. */
  stopLabel?: string;
  /** Height in px the textarea grows to before it scrolls. Default `160`. */
  maxHeight?: number;
  className?: string;
  /** Ref to the `<textarea>`, to focus it for example. */
  ref?: Ref<HTMLTextAreaElement>;
};

/**
 * Message input. The textarea grows with its content, Enter sends and
 * Shift+Enter inserts a newline. The ref points at the textarea. While a reply
 * is `generating`, the send button turns into Stop.
 */
export function ChatComposer({
  onSend,
  label = 'Message',
  placeholder = 'Write a message…',
  sendLabel = 'Send message',
  disabled = false,
  attachment,
  footer,
  generating = false,
  onStop,
  stopLabel = 'Stop generating',
  maxHeight = 160,
  className,
  ref,
}: ChatComposerProps) {
  const [value, setValue] = useState('');
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const action = useRef<HTMLButtonElement>(null);
  // Whether Stop was the focused element: the browser may have dropped the focus by the time
  // the button turns back into a disabled Send, so it is remembered rather than read then.
  const actionFocused = useRef(false);
  const canSend = !disabled && !generating && value.trim() !== '';

  // An empty Send is disabled, which would drop the focus to the page: hand it to the field.
  useLayoutEffect(() => {
    if (generating) return;
    if (actionFocused.current || document.activeElement === action.current) {
      actionFocused.current = false;
      inner.current?.focus();
    }
  }, [generating]);

  useAutoGrow(inner, { value, maxHeight });

  const send = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  const row = (
    <>
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
        ref={action}
        type="button"
        aria-label={generating ? stopLabel : sendLabel}
        disabled={generating ? false : !canSend}
        onClick={generating ? onStop : send}
        onFocus={() => {
          actionFocused.current = generating;
        }}
        onBlur={(e) => {
          // A blur with no target is the browser dropping a button that turned disabled.
          if (e.relatedTarget) actionFocused.current = false;
        }}
        className="bg-brand-500 hover:bg-brand-600 focus-visible:focus-indicator flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generating ? (
          <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
        ) : (
          <SendHorizontal className="h-4 w-4" aria-hidden />
        )}
      </button>
    </>
  );
  const panel = 'border-t border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3';

  if (footer === undefined) {
    return <div className={clsx('flex items-end gap-2', panel, className)}>{row}</div>;
  }
  return (
    <div className={clsx(panel, className)}>
      <div className="flex items-end gap-2">{row}</div>
      <div className="mt-2 flex items-center gap-2">{footer}</div>
    </div>
  );
}
