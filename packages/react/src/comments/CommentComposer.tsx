import { clsx } from 'clsx';
import { useEffect, useRef, type Ref } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { Textarea } from '../forms/Textarea';
import { Button } from '../ui/Button';
import { mergeRefs } from '../ui/mergeRefs';

export type CommentComposerProps = {
  /** Called with the trimmed text when the user submits a non-empty comment. */
  onSubmit: (text: string) => void;
  /**
   * Shows a Cancel button and lets Escape cancel. Without it neither exists, which is right for
   * the composer at the bottom of a thread.
   */
  onCancel?: () => void;
  /** The text, when the host controls it. Only `undefined` means uncontrolled. */
  value?: string;
  /** The starting text when uncontrolled: the comment being edited. Default `''`. */
  defaultValue?: string;
  /** Called on every change with the new text, in both modes. */
  onChange?: (value: string) => void;
  /**
   * The comment is being sent: the submit button shows a spinner and does nothing, and the field
   * is read-only. The host clears `value` (or unmounts the composer) when it is done.
   */
  submitting?: boolean;
  /** Accessible name of the field. Default `Comment`. */
  label?: string;
  /** Default `Write a comment…`. */
  placeholder?: string;
  /** Default `Comment`. */
  submitLabel?: string;
  /** Default `Cancel`. */
  cancelLabel?: string;
  /** Rows the field starts with before it grows. Default `2`. */
  rows?: number;
  /** Rows the field grows to before it scrolls. Default `10`. */
  maxRows?: number;
  /** Put the focus in the field when the composer appears, the caret at the end. Default `false`. */
  autoFocus?: boolean;
  className?: string;
  /** Ref to the `<textarea>`. */
  ref?: Ref<HTMLTextAreaElement>;
};

/**
 * The field to write, reply to or edit a comment. Enter adds a line (a comment is not a chat
 * message); the submit button, or Ctrl/Cmd+Enter, sends. Built on `Textarea` with `autoResize`.
 * Submit stays disabled while the text is empty or `submitting`.
 */
export function CommentComposer({
  onSubmit,
  onCancel,
  value,
  defaultValue = '',
  onChange,
  submitting = false,
  label = 'Comment',
  placeholder = 'Write a comment…',
  submitLabel = 'Comment',
  cancelLabel = 'Cancel',
  rows = 2,
  maxRows = 10,
  autoFocus = false,
  className,
  ref,
}: CommentComposerProps) {
  const [text, setText] = useControllableState<string>({
    value,
    defaultValue,
    onChange,
    name: 'CommentComposer.value',
  });
  const field = useRef<HTMLTextAreaElement | null>(null);
  const canSubmit = !submitting && text.trim() !== '';

  useEffect(() => {
    if (!autoFocus) return;
    const el = field.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
    // Once, when the composer appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(text.trim());
    // Uncontrolled: ready for the next comment. A controlled host clears `value` itself.
    setText('');
  };

  return (
    <div className={clsx('flex flex-col', className)}>
      <Textarea
        ref={mergeRefs(field, ref)}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={label}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        aria-busy={submitting || undefined}
        placeholder={placeholder}
        rows={rows}
        maxRows={maxRows}
        autoResize
        readOnly={submitting}
        onKeyDown={(e) => {
          // isComposing: the Enter that confirms an IME candidate must not submit.
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape' && onCancel) {
            // Prevented, so an overlay around the composer keeps its own Escape for later.
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button size="sm" loading={submitting} disabled={!canSubmit} onClick={submit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
