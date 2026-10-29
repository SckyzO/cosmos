import { clsx } from 'clsx';
import { Lock } from 'lucide-react';
import { useEffect, useRef, type Ref } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { SegmentedControl } from '../forms/SegmentedControl';
import { Textarea } from '../forms/Textarea';
import { Button } from '../ui/Button';
import { mergeRefs } from '../ui/mergeRefs';

/** One thing the composer can write: a reply to the customer, an internal note. */
export type CommentComposerMode = {
  /** What `onSubmit` and `onModeChange` receive. */
  value: string;
  /** The segment's text. */
  label: string;
  /**
   * A note only the team sees. Tints the field and the submit button the way
   * `variant="internal"` tints a comment, and says so in words, so it is not sent to a customer
   * by mistake. Default `false`.
   */
  internal?: boolean;
  /** Placeholder while this mode is selected. Default: the composer's `placeholder`. */
  placeholder?: string;
  /** Submit button text while this mode is selected. Default: the composer's `submitLabel`. */
  submitLabel?: string;
};

export type CommentComposerProps = {
  /**
   * Called with the trimmed text when the user submits a non-empty comment, and with the selected
   * mode's `value` when the composer has `modes` (the text alone otherwise).
   */
  onSubmit: (text: string, mode?: string) => void;
  /**
   * What the text can be (Reply, Internal note), as a segmented control above the field. Without
   * it the composer has no control and `onSubmit` gets the text alone.
   */
  modes?: CommentComposerMode[];
  /** The selected mode's `value`, when the host controls it. Only `undefined` means uncontrolled. */
  mode?: string;
  /** The mode selected first when uncontrolled. Default: the first of `modes`. */
  defaultMode?: string;
  /** Called with the new mode's `value`, in both modes. */
  onModeChange?: (mode: string) => void;
  /** Accessible name of the modes' control. Default `Type of message`. */
  modeLabel?: string;
  /**
   * Said, and announced when the mode changes, while an `internal` mode is selected. Default
   * `Internal note: only your team sees this.`
   */
  internalNotice?: string;
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
 * Submit stays disabled while the text is empty or `submitting`. `modes` adds a segmented control
 * to choose what is being written.
 */
export function CommentComposer({
  onSubmit,
  modes,
  mode: modeProp,
  defaultMode,
  onModeChange,
  modeLabel = 'Type of message',
  internalNotice = 'Internal note: only your team sees this.',
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
  const [mode, setMode] = useControllableState<string>({
    value: modeProp,
    defaultValue: defaultMode ?? modes?.[0]?.value ?? '',
    onChange: onModeChange,
    name: 'CommentComposer.mode',
  });
  const activeMode = modes?.find((m) => m.value === mode);
  const internal = activeMode?.internal === true;
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
    if (modes) onSubmit(text.trim(), mode);
    else onSubmit(text.trim());
    // Uncontrolled: ready for the next comment. A controlled host clears `value` itself.
    setText('');
  };

  return (
    <div className={clsx('flex flex-col', className)}>
      {modes && (
        <SegmentedControl
          size="sm"
          aria-label={modeLabel}
          className="mb-2 max-w-full self-start"
          options={modes.map((m) => ({
            value: m.value,
            label: m.label,
            icon: m.internal ? Lock : undefined,
          }))}
          value={mode}
          onChange={setMode}
        />
      )}
      {/* The tint reaches the field from here: it sets its own white surface, and a class passed
          to it would only fight that one by order. */}
      <div
        className={clsx(
          internal &&
            '[&_textarea]:border-amber-200 [&_textarea]:bg-amber-50 dark:[&_textarea]:border-amber-500/30 dark:[&_textarea]:bg-amber-500/10'
        )}
      >
        <Textarea
          ref={mergeRefs(field, ref)}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={label}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          aria-busy={submitting || undefined}
          placeholder={activeMode?.placeholder ?? placeholder}
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
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {modes && (
          // Always on the page, so the words are announced when an internal mode is picked.
          <p
            role="status"
            className="text-2xs me-auto flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400"
          >
            {internal && (
              <>
                <Lock aria-hidden className="h-3 w-3 shrink-0" />
                {internalNotice}
              </>
            )}
          </p>
        )}
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button
          size="sm"
          intent={internal ? 'warning' : 'brand'}
          loading={submitting}
          disabled={!canSubmit}
          onClick={submit}
        >
          {activeMode?.submitLabel ?? submitLabel}
        </Button>
      </div>
    </div>
  );
}
