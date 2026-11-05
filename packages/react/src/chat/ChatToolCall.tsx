import { clsx } from 'clsx';
import { AlertCircle, Check, ChevronRight, Wrench } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { useLabels } from '../labels/labelsContext';
import { Fold } from '../ui/Fold';
import { Spinner } from '../ui/Spinner';
import { SectionLabel } from '../ui/SectionLabel';
import { INTENT_STYLE } from '../ui/intent';
import { CHAT_TOOL_CALL_LABELS, type ChatToolCallLabels } from './labels';

export type ChatToolCallStatus = 'running' | 'done' | 'failed';

export type ChatToolCallProps = {
  /** Name of the tool, in mono: `search_docs`. */
  name: string;
  /** `running` shows a spinner, `done` a check, `failed` an alert. */
  status: ChatToolCallStatus;
  /** How long it took, formatted by the app (`1.2s`): "Done in 1.2s". Used by `done` only. */
  duration?: string;
  /** What the tool was called with: shown under "Input" when open (a `CodeBlock`, say). */
  input?: ReactNode;
  /** What the tool returned: shown under "Output" when open. */
  output?: ReactNode;
  /** Open state, when controlled. */
  open?: boolean;
  /** Initial open state, when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The texts it writes, over `LabelsProvider`'s `chatToolCall` and the English defaults. */
  labels?: Partial<ChatToolCallLabels>;
  className?: string;
};

const Caption = ({ children }: { children: ReactNode }) => (
  <SectionLabel className="mb-1">{children}</SectionLabel>
);

/**
 * What the assistant did, as a framed row: a tool call with its status. The whole row is the
 * disclosure button, closed by default; open, it shows the input and the output. Put it in the
 * `children` of a reply, above its text.
 *
 * Only the status text is a live region (`aria-live="polite"`), so a call going from "Running" to
 * "Done in 1.2s" is announced and the rest of the row is not.
 */
export const ChatToolCall = ({
  name,
  status,
  duration,
  input,
  output,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  labels: ownLabels,
  className,
}: ChatToolCallProps) => {
  const labels = useLabels('chatToolCall', CHAT_TOOL_CALL_LABELS, ownLabels);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'ChatToolCall.open',
  });
  const bodyId = useId();

  const statusText =
    status === 'running'
      ? labels.running
      : status === 'failed'
        ? labels.failed
        : duration
          ? labels.doneIn(duration)
          : labels.done;
  const statusColor =
    status === 'running'
      ? 'text-[var(--color-text-muted)]'
      : status === 'failed'
        ? INTENT_STYLE.danger.text
        : INTENT_STYLE.success.text;

  return (
    <div
      className={clsx(
        'w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]',
        className
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
        className="focus-visible:focus-indicator py-row-8 flex w-full items-center gap-2 px-3 text-start hover:bg-gray-50 focus-visible:ring-inset dark:hover:bg-white/5"
      >
        <ChevronRight
          aria-hidden
          className={clsx(
            'h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-(--cosmos-motion-base) ease-(--cosmos-ease-in-out)',
            open ? 'rotate-90' : 'rtl:rotate-180'
          )}
        />
        <Wrench aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
        <span className="min-w-0 truncate font-mono text-xs text-[var(--color-text-primary)]">
          <bdi>{name}</bdi>
        </span>
        <span
          aria-live="polite"
          className={clsx(
            'text-2xs ms-auto inline-flex shrink-0 items-center gap-1.5 font-medium',
            statusColor
          )}
        >
          {/* The spinner is a `role="status"` of its own: hidden, or "Loading" is announced too. */}
          {status === 'running' && (
            <span aria-hidden className="inline-flex">
              <Spinner size="xs" intent="neutral" />
            </span>
          )}
          {status === 'done' && <Check aria-hidden className="h-3.5 w-3.5" />}
          {status === 'failed' && <AlertCircle aria-hidden className="h-3.5 w-3.5" />}
          <span>
            <bdi>{statusText}</bdi>
          </span>
        </span>
      </button>
      {/* The body is mounted when the call first opens, and stays: it folds back, it does not go. */}
      <Fold id={bodyId} open={open} lazy className="bg-[var(--color-bg-base)]">
        <div className="grid gap-3 border-t border-[var(--color-border)] px-3 py-2.5">
          {input !== undefined && (
            <div className="min-w-0">
              <Caption>{labels.input}</Caption>
              {input}
            </div>
          )}
          {output !== undefined && (
            <div className="min-w-0">
              <Caption>{labels.output}</Caption>
              {output}
            </div>
          )}
        </div>
      </Fold>
    </div>
  );
};
